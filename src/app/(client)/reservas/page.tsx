import { CalendarDays, Plus } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'
import type { Metadata } from 'next'

import { EmptyState } from '@/components/ui/empty-state'
import { LinkButton } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/page-header'
import { ReservationCard } from '@/components/reservations/reservation-card'
import { SkeletonCard } from '@/components/ui/skeleton'
import {
  clientFilterLabels,
  getClientReservations,
  type ClientReservationFilter,
} from '@/server/queries/reservations'
import { requireUser } from '@/server/auth/session'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Mis reservaciones' }

const FILTERS: ClientReservationFilter[] = ['upcoming', 'active', 'past', 'cancelled']

const emptyCopy: Record<ClientReservationFilter, { title: string; description: string }> = {
  upcoming: {
    title: 'No tienes reservaciones proximas',
    description: 'Aparta el lugar de tu mascota y la veras aqui con su fecha y horario.',
  },
  active: {
    title: 'Ninguna mascota en el club ahora',
    description: 'Cuando tu mascota ingrese, su estancia aparecera en esta pestana.',
  },
  past: {
    title: 'Todavia no hay estancias finalizadas',
    description: 'Aqui quedara el historial de cada visita al club.',
  },
  cancelled: {
    title: 'No has cancelado ninguna reservacion',
    description: 'Las reservaciones canceladas se guardan aqui como referencia.',
  },
}

async function ReservationList({ filter }: { filter: ClientReservationFilter }) {
  const user = await requireUser()
  const reservations = await getClientReservations(user, filter)

  if (reservations.length === 0) {
    const copy = emptyCopy[filter]
    return (
      <EmptyState
        icon={CalendarDays}
        title={copy.title}
        description={copy.description}
        action={
          filter === 'upcoming' ? (
            <LinkButton size="sm" href="/reservas/nueva">
              <Plus aria-hidden />
              Reservar una estancia
            </LinkButton>
          ) : null
        }
      />
    )
  }

  return (
    <ul className="space-y-3">
      {reservations.map((reservation) => (
        <li key={reservation.id}>
          <Link
            href={`/reservas/${reservation.id}`}
            className="block rounded-card transition-transform hover:-translate-y-px"
          >
            <ReservationCard reservation={reservation} />
          </Link>
        </li>
      ))}
    </ul>
  )
}

export default async function ReservationsPage({
  searchParams,
}: {
  searchParams: Promise<{ filtro?: string }>
}) {
  const { filtro } = await searchParams
  const filter = (FILTERS as string[]).includes(filtro ?? '')
    ? (filtro as ClientReservationFilter)
    : 'upcoming'

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Tus estancias"
        title="Mis reservaciones"
        description="Proximas, activas y finalizadas."
        action={
          <LinkButton size="sm" href="/reservas/nueva">
            <Plus aria-hidden />
            Reservar
          </LinkButton>
        }
      />

      <nav aria-label="Filtrar reservaciones" className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((option) => {
          const active = option === filter
          return (
            <Link
              key={option}
              href={option === 'upcoming' ? '/reservas' : `/reservas?filtro=${option}`}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex min-h-11 items-center rounded-pill px-4 text-sm font-semibold whitespace-nowrap transition-colors',
                active
                  ? 'bg-navy-800 text-white'
                  : 'border border-line-strong bg-surface text-ink-muted hover:text-ink'
              )}
            >
              {clientFilterLabels[option]}
            </Link>
          )
        })}
      </nav>

      {/* La `key` reinicia el Suspense al cambiar de filtro, para que se vea el
          esqueleto en lugar de la lista anterior congelada. */}
      <Suspense
        key={filter}
        fallback={
          <div className="space-y-3">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        }
      >
        <ReservationList filter={filter} />
      </Suspense>
    </div>
  )
}
