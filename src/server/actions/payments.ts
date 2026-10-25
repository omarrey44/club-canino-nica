'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import type { Route } from 'next'

import { prisma } from '@/lib/prisma'
import { notify, notifyStaff } from '@/server/notifications'
import { toCents } from '@/lib/pricing'
import { recordAudit } from '@/server/audit'
import { requireRole, requireStaff, requireUser } from '@/server/auth/session'
import {
  activeProvider,
  createCheckout,
  getPaymentStatus,
  refundPayment as refundWithProvider,
} from '@/server/providers/payment'
import { errorState, successState, type ActionState } from './types'

async function appOrigin() {
  const headerList = await headers()
  return (
    process.env.NEXT_PUBLIC_APP_URL ?? `http://${headerList.get('host') ?? 'localhost:3000'}`
  )
}

/**
 * Abre la pantalla de cobro.
 *
 * El monto se toma de la reservacion guardada, nunca del navegador: si viniera
 * del formulario, cualquiera podria pagar un peso.
 */
export async function startCheckout(reservationId: string): Promise<ActionState> {
  const user = await requireUser()

  const reservation = await prisma.reservation.findFirst({
    where: { id: reservationId, clientId: user.id },
    select: {
      id: true,
      code: true,
      total: true,
      currency: true,
      status: true,
      service: { select: { name: true } },
      pet: { select: { name: true } },
      payment: { select: { id: true, status: true } },
    },
  })
  if (!reservation) return errorState('No encontramos esa reservación.')

  if (reservation.status === 'CANCELLED') {
    return errorState('Esta reservación está cancelada.')
  }
  if (reservation.payment?.status === 'PAID') {
    return errorState('Esta reservación ya está pagada.')
  }

  // Toda reservacion nace con su fila de pago, pero si faltara se crea aqui.
  const payment =
    reservation.payment ??
    (await prisma.payment.create({
      data: {
        reservationId: reservation.id,
        provider: activeProvider(),
        status: 'PENDING',
        amount: reservation.total,
        currency: reservation.currency,
      },
      select: { id: true, status: true },
    }))

  const origin = await appOrigin()

  try {
    const session = await createCheckout({
      paymentId: payment.id,
      reservationCode: reservation.code,
      description: `${reservation.service.name} · ${reservation.pet.name}`,
      amountCents: toCents(String(reservation.total)),
      currency: reservation.currency,
      customerEmail: user.email,
      successUrl: `${origin}/reservas/${reservation.id}?pago=verificando`,
      cancelUrl: `${origin}/reservas/${reservation.id}?pago=cancelado`,
    })

    await prisma.payment.update({
      where: { id: payment.id },
      data: { provider: activeProvider(), providerRef: session.providerRef },
    })

    // El destino lo devuelve el proveedor en runtime (una URL de Stripe o la
    // pantalla demo), asi que typedRoutes no puede validarlo.
    redirect(session.url as Route)
  } catch (error) {
    // `redirect` lanza una excepcion de control de flujo; dejarla pasar.
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') throw error
    if (typeof error === 'object' && error !== null && 'digest' in error) throw error

    console.error('[payments.startCheckout]', error)
    return errorState('No pudimos abrir la pantalla de pago. Intenta de nuevo.')
  }
}

/**
 * Confirma contra el proveedor al volver de la pantalla de pago.
 *
 * La URL de exito no prueba nada: cualquiera puede escribirla. Por eso se le
 * pregunta al proveedor cual es el estado real.
 */
export async function verifyPayment(reservationId: string): Promise<ActionState> {
  const user = await requireUser()

  const payment = await prisma.payment.findFirst({
    where: { reservationId, reservation: { clientId: user.id } },
    select: {
      id: true,
      status: true,
      providerRef: true,
      reservation: {
        select: { id: true, code: true, clientId: true, petId: true, organizationId: true },
      },
    },
  })
  if (!payment?.providerRef) return errorState('No encontramos ese cobro.')
  if (payment.status === 'PAID') return successState('Pago confirmado.')

  const status = await getPaymentStatus(payment.providerRef)
  if (status !== 'PAID') {
    return errorState('El pago todavía no aparece confirmado. Puede tardar un momento.')
  }

  await markPaid(payment.id, payment.reservation)
  revalidatePath(`/reservas/${reservationId}`)
  return successState('Pago confirmado.')
}

/** Marca el pago, confirma la reservacion y avisa. Un solo lugar para todo eso. */
async function markPaid(
  paymentId: string,
  reservation: { id: string; code: string; clientId: string; petId: string; organizationId: string }
) {
  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: paymentId },
      data: { status: 'PAID', paidAt: new Date(), failureReason: null },
    })

    // Un pago confirmado confirma la reservacion, si seguia pendiente.
    await tx.reservation.updateMany({
      where: { id: reservation.id, status: 'PENDING' },
      data: { status: 'CONFIRMED' },
    })

    await notify({
        organizationId: reservation.organizationId,
        userId: reservation.clientId,
        petId: reservation.petId,
        type: 'PAYMENT_CONFIRMED',
        title: 'Recibimos tu pago',
        body: `Tu reservación ${reservation.code} está confirmada.`,
        linkUrl: `/reservas/${reservation.id}`,
      }, tx)

    await notifyStaff(
      {
        organizationId: reservation.organizationId,
        petId: reservation.petId,
        type: 'PAYMENT_CONFIRMED',
        title: 'Pago recibido',
        body: `Se pagó la reservación ${reservation.code}.`,
        linkUrl: '/admin/pagos',
      },
      tx
    )
  })
}

/**
 * Cierra un cobro simulado.
 *
 * Solo existe mientras el proveedor sea `demo`. Con Stripe activo, quien
 * confirma es el webhook firmado y esta accion se niega a hacer nada.
 */
export async function completeDemoPayment(
  paymentId: string,
  outcome: 'paid' | 'failed'
): Promise<ActionState> {
  const user = await requireUser()

  if (activeProvider() !== 'demo') {
    return errorState('Los cobros reales se confirman desde el proveedor, no desde aquí.')
  }

  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, reservation: { clientId: user.id } },
    select: {
      id: true,
      status: true,
      reservation: {
        select: { id: true, code: true, clientId: true, petId: true, organizationId: true },
      },
    },
  })
  if (!payment) return errorState('No encontramos ese cobro.')
  if (payment.status === 'PAID') return successState('Ese cobro ya estaba pagado.')

  if (outcome === 'failed') {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'FAILED', failureReason: 'Pago simulado rechazado.' },
    })
  } else {
    await markPaid(payment.id, payment.reservation)
  }

  revalidatePath(`/reservas/${payment.reservation.id}`)
  revalidatePath('/admin/pagos')
  redirect(`/reservas/${payment.reservation.id}?pago=${outcome === 'paid' ? 'listo' : 'fallido'}`)
}

// ---------------------------------------------------------------------------
// Panel
// ---------------------------------------------------------------------------

/**
 * Registra un cobro recibido fuera de la plataforma.
 *
 * Una guarderia cobra en efectivo o por transferencia todos los dias; sin esto
 * el panel mostraria como pendientes cobros que ya entraron.
 */
export async function markPaymentPaidManually(paymentId: string): Promise<ActionState> {
  const user = await requireStaff()

  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, reservation: { organizationId: user.organizationId } },
    select: {
      id: true,
      status: true,
      reservation: {
        select: { id: true, code: true, clientId: true, petId: true, organizationId: true },
      },
    },
  })
  if (!payment) return errorState('No encontramos ese cobro.')
  if (payment.status === 'PAID') return errorState('Ese cobro ya está pagado.')

  await markPaid(payment.id, payment.reservation)

  await recordAudit(user, {
    action: 'PAYMENT_MARKED_PAID',
    entityType: 'Payment',
    entityId: payment.id,
    changes: { code: payment.reservation.code, from: payment.status, method: 'manual' },
  })

  revalidatePath('/admin/pagos')
  return successState('Cobro registrado como pagado.')
}

/** Reembolso. Movimiento de dinero, asi que queda restringido a ADMIN. */
export async function refundPayment(paymentId: string): Promise<ActionState> {
  const user = await requireRole('ADMIN', 'SUPER_ADMIN')

  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, reservation: { organizationId: user.organizationId } },
    select: {
      id: true,
      status: true,
      amount: true,
      providerRef: true,
      reservation: { select: { code: true } },
    },
  })
  if (!payment) return errorState('No encontramos ese cobro.')
  if (payment.status !== 'PAID') return errorState('Solo se puede reembolsar un cobro pagado.')

  const result = await refundWithProvider(
    payment.providerRef ?? '',
    toCents(String(payment.amount))
  )
  if (!result.ok) return errorState(result.error)

  await prisma.payment.update({
    where: { id: payment.id },
    data: { status: 'REFUNDED', refundedAt: new Date() },
  })

  await recordAudit(user, {
    action: 'PAYMENT_REFUNDED',
    entityType: 'Payment',
    entityId: payment.id,
    changes: { code: payment.reservation.code, amount: String(payment.amount) },
  })

  revalidatePath('/admin/pagos')
  return successState('Reembolso registrado.')
}
