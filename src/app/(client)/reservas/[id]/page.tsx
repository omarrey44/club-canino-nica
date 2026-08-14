import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

import { Alert } from '@/components/ui/alert'
import { CancelReservationButton } from '@/components/reservations/cancel-reservation-button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PetAvatar } from '@/components/ui/pet-avatar'
import { StatusBadge } from '@/components/ui/status-badge'
import { business, formatCurrency } from '@/config/business'
import { formatDate, formatDateTime, formatTime } from '@/lib/datetime'
import {
  paymentStatusLabels,
  paymentStatusTones,
  reservationStatusLabels,
  reservationStatusTones,
} from '@/lib/constants/labels'
import { getReservationDetail } from '@/server/queries/reservations'
import { requireUser } from '@/server/auth/session'

type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ nueva?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const user = await requireUser()
  const reservation = await getReservationDetail(id, user)
  return { title: reservation ? `Reservación ${reservation.code}` : 'Reservación' }
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <div className="flex justify-between gap-4 py-2.5">
      <dt className="shrink-0 text-ink-muted">{label}</dt>
      <dd className="text-right font-semibold text-ink">{value}</dd>
    </div>
  )
}

export default async function ReservationDetailPage({ params, searchParams }: Props) {
  const { id } = await params
  const { nueva } = await searchParams
  const user = await requireUser()
  const reservation = await getReservationDetail(id, user)

  if (!reservation) notFound()

  const sameDay = formatDate(reservation.startAt) === formatDate(reservation.endAt)
  const canCancel = ['PENDING', 'CONFIRMED'].includes(reservation.status)

  return (
    <div className="space-y-6">
      <Link
        href="/reservas"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Mis reservaciones
      </Link>

      {nueva && (
        <Alert tone="success">
          <span className="flex items-start gap-1.5">
            <CheckCircle2 className="sr-only" aria-hidden />
            Listo, apartamos el lugar de {reservation.pet.name}. Te confirmamos en breve y te
            avisamos por aquí.
          </span>
        </Alert>
      )}

      <header className="flex flex-wrap items-center gap-4">
        <PetAvatar
          name={reservation.pet.name}
          photoUrl={reservation.pet.photoUrl}
          size="xl"
        />
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-extrabold text-navy-900">{reservation.pet.name}</h1>
            <StatusBadge tone={reservationStatusTones[reservation.status]}>
              {reservationStatusLabels[reservation.status]}
            </StatusBadge>
          </div>
          <p className="text-ink-muted">
            {reservation.service.name} · código {reservation.code}
          </p>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Cuando</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="divide-y divide-line text-sm">
            {sameDay ? (
              <>
                <Row label="Fecha" value={formatDate(reservation.startAt)} />
                <Row
                  label="Horario"
                  value={`${formatTime(reservation.startAt)} a ${formatTime(reservation.endAt)}`}
                />
              </>
            ) : (
              <>
                <Row label="Entrada" value={formatDateTime(reservation.startAt)} />
                <Row label="Salida" value={formatDateTime(reservation.endAt)} />
              </>
            )}
            <Row label="Servicio" value={reservation.service.name} />
            {reservation.clientNotes && (
              <Row label="Tus notas" value={reservation.clientNotes} />
            )}
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Detalle del cobro</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-ink-muted">{reservation.service.name}</dt>
              <dd className="font-semibold text-ink tabular-nums">
                {formatCurrency(String(reservation.subtotal))}
              </dd>
            </div>

            {reservation.extras.map((extra) => (
              <div key={extra.id} className="flex justify-between gap-4">
                <dt className="text-ink-muted">
                  {extra.service.name}
                  <span className="text-ink-subtle"> · {extra.quantity}</span>
                </dt>
                <dd className="font-semibold text-ink tabular-nums">
                  {formatCurrency(String(Number(extra.unitPrice) * extra.quantity))}
                </dd>
              </div>
            ))}

            {Number(reservation.taxes) > 0 && (
              <div className="flex justify-between gap-4 border-t border-line pt-2">
                <dt className="text-ink-muted">{business.billing.taxLabel}</dt>
                <dd className="font-semibold text-ink tabular-nums">
                  {formatCurrency(String(reservation.taxes))}
                </dd>
              </div>
            )}

            <div className="flex items-baseline justify-between gap-4 border-t border-line pt-2">
              <dt className="font-bold text-navy-900">Total</dt>
              <dd className="text-lg font-extrabold text-navy-900 tabular-nums">
                {formatCurrency(String(reservation.total))}
              </dd>
            </div>
          </dl>

          {reservation.payment && (
            <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-4">
              <span className="text-sm text-ink-muted">Estado del pago</span>
              <StatusBadge tone={paymentStatusTones[reservation.payment.status]}>
                {paymentStatusLabels[reservation.payment.status]}
              </StatusBadge>
            </div>
          )}

          {reservation.payment?.status === 'PENDING' && (
            <p className="mt-3 text-sm text-ink-muted">
              El pago en línea llega pronto. Por ahora coordinamos el pago contigo al
              confirmar la reservación.
            </p>
          )}
        </CardContent>
      </Card>

      {reservation.status === 'CANCELLED' && reservation.cancellationReason && (
        <Card>
          <CardHeader>
            <CardTitle>Motivo de la cancelación</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-ink-muted">{reservation.cancellationReason}</p>
          </CardContent>
        </Card>
      )}

      {canCancel && (
        <div className="flex">
          <CancelReservationButton reservationId={reservation.id} />
        </div>
      )}
    </div>
  )
}
