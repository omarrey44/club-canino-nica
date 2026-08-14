import { CalendarDays } from 'lucide-react'

import { PetAvatar } from '@/components/ui/pet-avatar'
import { StatusBadge } from '@/components/ui/status-badge'
import { formatCurrency } from '@/config/business'
import { formatDate, formatTime } from '@/lib/datetime'
import { reservationStatusLabels, reservationStatusTones } from '@/lib/constants/labels'
import type { ReservationStatus } from '@/generated/prisma/client'
import { cn } from '@/lib/utils'

export type ReservationCardData = {
  id: string
  code: string
  status: ReservationStatus
  startAt: Date
  endAt: Date
  total: unknown
  pet: { name: string; photoUrl: string | null }
  service: { name: string }
}

/** Un rango dentro del mismo dia se lee mejor como "12 ago · 8:00 – 18:00". */
function formatRange(startAt: Date, endAt: Date): string {
  const sameDay = formatDate(startAt) === formatDate(endAt)
  return sameDay
    ? `${formatDate(startAt)} · ${formatTime(startAt)} – ${formatTime(endAt)}`
    : `${formatDate(startAt)} – ${formatDate(endAt)}`
}

export function ReservationCard({
  reservation,
  embedded = false,
}: {
  reservation: ReservationCardData
  /** Integra la información dentro de otro panel sin duplicar borde o sombra. */
  embedded?: boolean
}) {
  return (
    <article
      className={cn(
        'rounded-card border border-line bg-surface p-4 shadow-card sm:p-5',
        embedded && 'rounded-none border-0 bg-transparent p-0 shadow-none sm:p-0'
      )}
    >
      <div className="flex items-start gap-3.5">
        <PetAvatar name={reservation.pet.name} photoUrl={reservation.pet.photoUrl} />

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-extrabold text-navy-900">{reservation.pet.name}</p>
            <StatusBadge tone={reservationStatusTones[reservation.status]}>
              {reservationStatusLabels[reservation.status]}
            </StatusBadge>
          </div>

          <p className="text-sm font-semibold text-ink-muted">{reservation.service.name}</p>

          <p className="flex items-center gap-1.5 text-sm text-ink-muted">
            <CalendarDays className="size-3.5 shrink-0" aria-hidden />
            {formatRange(reservation.startAt, reservation.endAt)}
          </p>
        </div>

        <div className="shrink-0 rounded-field bg-canvas-warm px-3 py-2 text-right">
          <p className="font-extrabold text-navy-900 tabular-nums">
            {formatCurrency(String(reservation.total))}
          </p>
          <p className="text-2xs text-ink-subtle">{reservation.code}</p>
        </div>
      </div>
    </article>
  )
}
