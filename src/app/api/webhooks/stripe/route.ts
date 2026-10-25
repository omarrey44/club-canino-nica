import { NextResponse, type NextRequest } from 'next/server'

import { prisma } from '@/lib/prisma'
import { notify, notifyStaff } from '@/server/notifications'
import { verifyWebhookSignature } from '@/server/providers/payment'

/**
 * Notificaciones de Stripe.
 *
 * Es quien decide de verdad que un cobro entro. La pantalla de exito del
 * navegador no confirma nada: cualquiera puede escribir esa URL.
 *
 * La ruta es publica por necesidad (Stripe no tiene sesion), asi que la firma
 * es lo unico que la protege. Sin firma valida se responde 400 y no se toca
 * nada.
 */
export async function POST(request: NextRequest) {
  // El cuerpo crudo, sin parsear: la firma se calcula sobre los bytes exactos.
  const payload = await request.text()

  if (!verifyWebhookSignature(payload, request.headers.get('stripe-signature'))) {
    console.error('[webhook.stripe] firma invalida')
    return NextResponse.json({ error: 'firma invalida' }, { status: 400 })
  }

  let event: { type?: string; data?: { object?: Record<string, unknown> } }
  try {
    event = JSON.parse(payload)
  } catch {
    return NextResponse.json({ error: 'cuerpo invalido' }, { status: 400 })
  }

  const session = event.data?.object ?? {}
  const providerRef = typeof session.id === 'string' ? session.id : null
  if (!providerRef) return NextResponse.json({ received: true })

  const payment = await prisma.payment.findFirst({
    where: { providerRef },
    select: {
      id: true,
      status: true,
      reservation: {
        select: { id: true, code: true, clientId: true, petId: true, organizationId: true },
      },
    },
  })
  // Un evento de un pago que no conocemos se acepta y se ignora: responder con
  // error haria que Stripe lo reintente para siempre.
  if (!payment) return NextResponse.json({ received: true })

  switch (event.type) {
    case 'checkout.session.completed':
    case 'checkout.session.async_payment_succeeded': {
      if (payment.status === 'PAID') break

      await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: payment.id },
          data: { status: 'PAID', paidAt: new Date(), failureReason: null },
        })
        await tx.reservation.updateMany({
          where: { id: payment.reservation.id, status: 'PENDING' },
          data: { status: 'CONFIRMED' },
        })
        await notify(
          {
            organizationId: payment.reservation.organizationId,
            userId: payment.reservation.clientId,
            petId: payment.reservation.petId,
            type: 'PAYMENT_CONFIRMED',
            title: 'Recibimos tu pago',
            body: `Tu reservación ${payment.reservation.code} está confirmada.`,
            linkUrl: `/reservas/${payment.reservation.id}`,
          },
          tx
        )
        await notifyStaff(
          {
            organizationId: payment.reservation.organizationId,
            petId: payment.reservation.petId,
            type: 'PAYMENT_CONFIRMED',
            title: 'Pago recibido',
            body: `Se pagó la reservación ${payment.reservation.code}.`,
            linkUrl: '/admin/pagos',
          },
          tx
        )
      })
      break
    }

    case 'checkout.session.expired':
    case 'checkout.session.async_payment_failed': {
      if (payment.status !== 'PAID') {
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'FAILED',
            failureReason: 'El proveedor reporto que el cobro no se completo.',
          },
        })
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
