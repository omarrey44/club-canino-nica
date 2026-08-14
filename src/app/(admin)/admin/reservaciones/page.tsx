import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import type { Metadata, Route } from 'next'

import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { PetAvatar } from '@/components/ui/pet-avatar'
import { ReservationStatusActions } from '@/components/reservations/reservation-status-actions'
import { StatusBadge } from '@/components/ui/status-badge'
import { formatCurrency } from '@/config/business'
import { clubDateInput, clubDateTime, formatDate, formatTime } from '@/lib/datetime'
import { reservationStatusLabels, reservationStatusTones } from '@/lib/constants/labels'
import { getAdminAgenda, type AdminAgendaRange } from '@/server/queries/reservations'
import { requireStaff } from '@/server/auth/session'
import { cn } from '@/lib/utils'
import type { ReservationStatus } from '@/generated/prisma/client'

export const metadata: Metadata = { title: 'Reservaciones' }

const RANGES: Array<{ value: AdminAgendaRange; label: string }> = [
  { value: 'day', label: 'Dia' },
  { value: 'week', label: 'Semana' },
]

const STATUS_FILTERS: ReservationStatus[] = [
  'PENDING',
  'CONFIRMED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
]

/**
 * Arma la URL de la agenda conservando los filtros activos.
 *
 * La cadena se construye en runtime, asi que `typedRoutes` no puede validarla:
 * la ruta base es fija y solo cambia la query.
 */
function buildHref(params: Record<string, string | undefined>): Route {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value)
  }
  const query = search.toString()
  return (query ? `/admin/reservaciones?${query}` : '/admin/reservaciones') as Route
}

export default async function AdminReservationsPage({
  searchParams,
}: {
  searchParams: Promise<{ rango?: string; fecha?: string; estado?: string }>
}) {
  const user = await requireStaff()
  const { rango, fecha, estado } = await searchParams

  const range: AdminAgendaRange = rango === 'week' ? 'week' : 'day'
  const anchorDate = fecha && /^\d{4}-\d{2}-\d{2}$/.test(fecha) ? fecha : clubDateInput()
  const from = clubDateTime(anchorDate, '12:00')
  const status = STATUS_FILTERS.includes(estado as ReservationStatus)
    ? (estado as ReservationStatus)
    : undefined

  const agenda = await getAdminAgenda(user.organizationId, { range, from, status })

  const stepDays = range === 'week' ? 7 : 1
  const shift = (days: number) =>
    clubDateInput(new Date(from.getTime() + days * 86_400_000))

  const heading =
    range === 'week'
      ? `${formatDate(agenda.start)} – ${formatDate(new Date(agenda.end.getTime() - 1))}`
      : formatDate(agenda.start)

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operacion"
        title="Reservaciones"
        description="Quien llega, quien sale y que falta confirmar."
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          <Link
            href={buildHref({ rango, fecha: shift(-stepDays), estado })}
            aria-label="Periodo anterior"
            className="flex size-11 items-center justify-center rounded-field border border-line-strong bg-surface text-ink-muted hover:text-ink"
          >
            <ChevronLeft className="size-4" aria-hidden />
          </Link>
          <Link
            href={buildHref({ rango, fecha: shift(stepDays), estado })}
            aria-label="Periodo siguiente"
            className="flex size-11 items-center justify-center rounded-field border border-line-strong bg-surface text-ink-muted hover:text-ink"
          >
            <ChevronRight className="size-4" aria-hidden />
          </Link>
        </div>

        <p className="font-bold text-navy-900">{heading}</p>

        <Link
          href={buildHref({ rango, estado })}
          className="inline-flex min-h-11 items-center text-sm font-semibold text-brand-700 hover:underline"
        >
          Hoy
        </Link>

        <div className="ml-auto flex gap-1.5">
          {RANGES.map((option) => (
            <Link
              key={option.value}
              href={buildHref({
                rango: option.value === 'day' ? undefined : option.value,
                fecha: anchorDate,
                estado,
              })}
              aria-current={range === option.value ? 'page' : undefined}
              className={cn(
                'flex min-h-11 items-center rounded-pill px-4 text-sm font-semibold transition-colors',
                range === option.value
                  ? 'bg-navy-800 text-white'
                  : 'border border-line-strong bg-surface text-ink-muted hover:text-ink'
              )}
            >
              {option.label}
            </Link>
          ))}
        </div>
      </div>

      <nav aria-label="Filtrar por estado" className="flex gap-2 overflow-x-auto pb-1">
        <Link
          href={buildHref({ rango, fecha: anchorDate })}
          aria-current={!status ? 'page' : undefined}
          className={cn(
            'flex min-h-11 items-center rounded-pill px-4 text-sm font-semibold whitespace-nowrap transition-colors',
            !status
              ? 'bg-navy-800 text-white'
              : 'border border-line-strong bg-surface text-ink-muted hover:text-ink'
          )}
        >
          Todas ({agenda.reservations.length})
        </Link>

        {STATUS_FILTERS.map((option) => (
          <Link
            key={option}
            href={buildHref({ rango, fecha: anchorDate, estado: option })}
            aria-current={status === option ? 'page' : undefined}
            className={cn(
              'flex min-h-11 items-center rounded-pill px-4 text-sm font-semibold whitespace-nowrap transition-colors',
              status === option
                ? 'bg-navy-800 text-white'
                : 'border border-line-strong bg-surface text-ink-muted hover:text-ink'
            )}
          >
            {reservationStatusLabels[option]}
            {agenda.counts[option] ? ` (${agenda.counts[option]})` : ''}
          </Link>
        ))}
      </nav>

      {agenda.reservations.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="Sin reservaciones en este periodo"
          description="Cambia de fecha o quita el filtro de estado para ver mas."
        />
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
          {agenda.reservations.map((reservation) => (
            <li key={reservation.id} className="flex flex-wrap items-center gap-3 p-4">
              <PetAvatar name={reservation.pet.name} photoUrl={reservation.pet.photoUrl} />

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/reservas/${reservation.id}`}
                    className="inline-flex min-h-11 items-center font-bold text-navy-900 hover:underline"
                  >
                    {reservation.pet.name}
                  </Link>
                  <StatusBadge tone={reservationStatusTones[reservation.status]}>
                    {reservationStatusLabels[reservation.status]}
                  </StatusBadge>
                </div>
                <p className="truncate text-sm text-ink-muted">
                  {reservation.client.fullName} · {reservation.service.name}
                </p>
                <p className="text-sm text-ink-muted tabular-nums">
                  {formatTime(reservation.startAt)} a {formatTime(reservation.endAt)}
                  {range === 'week' && ` · ${formatDate(reservation.startAt)}`}
                </p>
              </div>

              <div className="hidden shrink-0 text-right sm:block">
                <p className="font-bold text-navy-900 tabular-nums">
                  {formatCurrency(String(reservation.total))}
                </p>
                <p className="text-2xs text-ink-subtle">{reservation.code}</p>
              </div>

              <ReservationStatusActions
                reservationId={reservation.id}
                status={reservation.status}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
