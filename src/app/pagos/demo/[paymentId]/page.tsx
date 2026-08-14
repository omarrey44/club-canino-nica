import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import type { Metadata } from 'next'

import { DemoCheckout } from '@/components/payments/demo-checkout'
import { formatCurrency } from '@/config/business'
import { prisma } from '@/lib/prisma'
import { activeProvider } from '@/server/providers/payment'
import { requireUser } from '@/server/auth/session'

export const metadata: Metadata = { title: 'Pago de demostración' }

/**
 * Ocupa el lugar de la pagina del proveedor.
 *
 * Vive fuera del layout del cliente a proposito: durante un cobro no debe haber
 * barra de navegacion tentando a irse a otro lado, igual que en Stripe.
 */
export default async function DemoCheckoutPage({
  params,
}: {
  params: Promise<{ paymentId: string }>
}) {
  const { paymentId } = await params
  const user = await requireUser()

  // Con un proveedor real esta pantalla no debe existir.
  if (activeProvider() !== 'demo') notFound()

  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, reservation: { clientId: user.id } },
    select: {
      id: true,
      status: true,
      amount: true,
      reservation: {
        select: {
          id: true,
          code: true,
          pet: { select: { name: true } },
          service: { select: { name: true } },
        },
      },
    },
  })
  if (!payment) notFound()

  // Un cobro ya cerrado no se vuelve a abrir.
  if (payment.status === 'PAID' || payment.status === 'REFUNDED') {
    redirect(`/reservas/${payment.reservation.id}`)
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-5 bg-canvas px-4 py-10">
      <DemoCheckout
        paymentId={payment.id}
        amount={formatCurrency(String(payment.amount))}
        description={`${payment.reservation.service.name} · ${payment.reservation.pet.name}`}
        reservationCode={payment.reservation.code}
      />

      <Link
        href={`/reservas/${payment.reservation.id}`}
        className="text-sm font-semibold text-ink-muted hover:text-ink"
      >
        Cancelar y volver a mi reservación
      </Link>
    </main>
  )
}
