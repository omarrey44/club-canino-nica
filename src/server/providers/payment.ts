import 'server-only'

import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto'

import { business } from '@/config/business'

/**
 * Abstraccion de cobro.
 *
 * Reglas que este modulo existe para hacer cumplir:
 *
 * 1. La plataforma NUNCA ve ni guarda datos de tarjeta. El cliente los escribe
 *    en la pagina del proveedor, no en la nuestra.
 * 2. Lo unico que se guarda es el estado y una referencia opaca del proveedor.
 * 3. Quien decide que un pago esta cobrado es el proveedor, no el navegador:
 *    volver de la pantalla de pago no marca nada como pagado.
 *
 * Sin llaves configuradas funciona el proveedor `demo`, que simula la pagina de
 * cobro con una pantalla marcada como demostracion. Sirve para recorrer el flujo
 * completo sin cobrarle a nadie.
 */

export type CheckoutSession = {
  /** A donde se envia al cliente para pagar. */
  url: string
  /** Referencia del proveedor. Es lo unico que se guarda en `Payment`. */
  providerRef: string
}

export type ProviderPaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'

export type CheckoutInput = {
  paymentId: string
  reservationCode: string
  description: string
  /** Monto en centavos. Nunca se envia el total calculado en el navegador. */
  amountCents: number
  currency: string
  customerEmail: string
  successUrl: string
  cancelUrl: string
}

export function activeProvider(): 'demo' | 'stripe' {
  return process.env.PAYMENT_PROVIDER === 'stripe' ? 'stripe' : 'demo'
}

// ---------------------------------------------------------------------------
// Proveedor demo
// ---------------------------------------------------------------------------

/**
 * Simula la pagina del proveedor.
 *
 * La referencia lleva prefijo `demo_` para que sea imposible confundir un cobro
 * simulado con uno real al mirar la base de datos o el panel.
 */
function demoCheckout(input: CheckoutInput): CheckoutSession {
  return {
    providerRef: `demo_${randomUUID()}`,
    url: `/pagos/demo/${input.paymentId}`,
  }
}

// ---------------------------------------------------------------------------
// Proveedor Stripe
// ---------------------------------------------------------------------------

const STRIPE_API = 'https://api.stripe.com/v1'

function stripeKey(): string {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('Falta STRIPE_SECRET_KEY.')
  return key
}

/**
 * Llama a la API de Stripe con `fetch`.
 *
 * Sin el SDK oficial a proposito: mientras no haya llaves con que probarlo,
 * agregar la dependencia seria peso sin verificar. Cuando el cobro real entre
 * en operacion conviene cambiar a `stripe` por los reintentos y la
 * idempotencia; el resto de la aplicacion no se entera.
 *
 * ponytail: adaptador con fetch, migrar al SDK oficial al activar cobros reales.
 */
async function stripeRequest(
  path: string,
  body?: Record<string, string>,
  idempotencyKey?: string
) {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${stripeKey()}`,
    'Content-Type': 'application/x-www-form-urlencoded',
  }
  // Evita cobrar dos veces si la peticion se reintenta por un fallo de red.
  if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey

  const response = await fetch(`${STRIPE_API}${path}`, {
    method: body ? 'POST' : 'GET',
    headers,
    body: body ? new URLSearchParams(body).toString() : undefined,
  })

  const data = await response.json()
  if (!response.ok) {
    throw new Error(`Stripe ${response.status}: ${data?.error?.message ?? 'error desconocido'}`)
  }
  return data
}

async function stripeCheckout(input: CheckoutInput): Promise<CheckoutSession> {
  const session = await stripeRequest(
    '/checkout/sessions',
    {
      mode: 'payment',
      'line_items[0][quantity]': '1',
      'line_items[0][price_data][currency]': input.currency.toLowerCase(),
      'line_items[0][price_data][unit_amount]': String(input.amountCents),
      'line_items[0][price_data][product_data][name]': input.description,
      customer_email: input.customerEmail,
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      client_reference_id: input.paymentId,
      'metadata[reservationCode]': input.reservationCode,
    },
    // El id del pago como clave: reintentar el mismo cobro no crea una sesion
    // nueva ni un segundo cargo.
    `checkout_${input.paymentId}`
  )

  return { providerRef: session.id, url: session.url }
}

// ---------------------------------------------------------------------------
// API publica
// ---------------------------------------------------------------------------

export async function createCheckout(input: CheckoutInput): Promise<CheckoutSession> {
  return activeProvider() === 'stripe' ? stripeCheckout(input) : demoCheckout(input)
}

/**
 * Consulta el estado real en el proveedor.
 *
 * Se usa al volver de la pantalla de pago: la URL de exito no es prueba de
 * nada, cualquiera puede escribirla a mano.
 */
export async function getPaymentStatus(providerRef: string): Promise<ProviderPaymentStatus> {
  if (activeProvider() !== 'stripe' || providerRef.startsWith('demo_')) {
    // En demo el estado lo lleva la base: no hay nadie a quien preguntarle.
    return 'PENDING'
  }

  const session = await stripeRequest(`/checkout/sessions/${providerRef}`)
  if (session.payment_status === 'paid') return 'PAID'
  if (session.status === 'expired') return 'FAILED'
  return 'PENDING'
}

export async function refundPayment(
  providerRef: string,
  amountCents: number
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (activeProvider() !== 'stripe' || providerRef.startsWith('demo_')) {
    return { ok: true }
  }

  try {
    const session = await stripeRequest(`/checkout/sessions/${providerRef}`)
    if (!session.payment_intent) return { ok: false, error: 'Ese cobro no llego a completarse.' }

    await stripeRequest(
      '/refunds',
      { payment_intent: session.payment_intent, amount: String(amountCents) },
      `refund_${providerRef}`
    )
    return { ok: true }
  } catch (error) {
    console.error('[payment.refund]', error)
    return { ok: false, error: 'El proveedor rechazo el reembolso. Revisalo en su panel.' }
  }
}

/**
 * Verifica la firma de un webhook de Stripe.
 *
 * Sin esto, cualquiera que conozca la URL podria marcar reservaciones como
 * pagadas con un POST.
 */
export function verifyWebhookSignature(
  payload: string,
  signatureHeader: string | null
): boolean {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret || !signatureHeader) return false

  const parts = Object.fromEntries(
    signatureHeader.split(',').map((part) => part.split('=') as [string, string])
  )
  const timestamp = parts.t
  const signature = parts.v1
  if (!timestamp || !signature) return false

  // Ventana de cinco minutos: bloquea reenviar una notificacion vieja.
  const age = Math.abs(Date.now() / 1000 - Number(timestamp))
  if (!Number.isFinite(age) || age > 300) return false

  const expected = createHmac('sha256', secret)
    .update(`${timestamp}.${payload}`)
    .digest('hex')

  const a = Buffer.from(signature, 'hex')
  const b = Buffer.from(expected, 'hex')
  return a.length === b.length && timingSafeEqual(a, b)
}

/** Etiqueta para la interfaz cuando los cobros no son reales. */
export const isDemoPayments = activeProvider() === 'demo'

export const paymentCurrency = business.currency
