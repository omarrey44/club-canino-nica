import { ChevronRight, Dog, LogIn } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

import { EmptyState } from '@/components/ui/empty-state'
import { LinkButton } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/page-header'
import { PetAvatar } from '@/components/ui/pet-avatar'
import { StatusBadge } from '@/components/ui/status-badge'
import { activityTypeLabels, stayStatusLabels, stayStatusTones } from '@/lib/constants/labels'
import { CheckOutTime } from '@/components/stays/check-out-time'
import { formatTime, relativeTime } from '@/lib/datetime'
import { getActiveStays } from '@/server/queries/stays'
import { requireStaff } from '@/server/auth/session'

export const metadata: Metadata = { title: 'Estancias' }

export default async function AdminStaysPage() {
  const user = await requireStaff()
  const stays = await getActiveStays(user.organizationId)

  return (
    <div className="space-y-4 sm:space-y-5">
      <PageHeader
        eyebrow="Operación"
        icon={Dog}
        title="Estancias"
        description={`${stays.length} ${stays.length === 1 ? 'mascota' : 'mascotas'} en el club ahora.`}
        action={
          <LinkButton size="sm" href="/admin/check-in">
            <LogIn aria-hidden />
            Check-in
          </LinkButton>
        }
      />

      {stays.length === 0 ? (
        <EmptyState
          icon={Dog}
          title="Ninguna mascota en estancia"
          description="Registra un ingreso desde check-in y aparecera aquí con sus horas y su estado."
          action={
            <LinkButton size="sm" href="/admin/check-in">
              Ir a check-in
            </LinkButton>
          }
        />
      ) : (
        <ul className="space-y-3">
          {stays.map((stay) => {
            const last = stay.activities[0]

            return (
              <li key={stay.id}>
                <Link
                  href={`/admin/estancias/${stay.id}`}
                  className="flex items-center gap-3.5 rounded-card border border-line bg-surface p-4 shadow-card transition-colors hover:border-line-strong"
                >
                  <PetAvatar name={stay.pet.name} photoUrl={stay.pet.photoUrl} size="lg" />

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-extrabold text-navy-900">{stay.pet.name}</p>
                      <StatusBadge tone={stayStatusTones[stay.status]}>
                        {stayStatusLabels[stay.status]}
                      </StatusBadge>
                      {stay.currentLocation && (
                        <StatusBadge tone="neutral" showDot={false}>
                          {stay.currentLocation}
                        </StatusBadge>
                      )}
                    </div>

                    <p className="truncate text-sm text-ink-muted">
                      {stay.reservation.client.fullName} · {stay.reservation.service.name}
                    </p>

                    <p className="text-sm text-ink-muted tabular-nums">
                      {formatTime(stay.checkInAt)} a <CheckOutTime date={stay.expectedCheckOutAt} /> ·{' '}
                      {stay._count.activities}{' '}
                      {stay._count.activities === 1 ? 'registro' : 'registros'}
                    </p>

                    {last && (
                      <p className="text-sm text-ink-subtle">
                        Último: {activityTypeLabels[last.type]} · {relativeTime(last.occurredAt)}
                      </p>
                    )}
                  </div>

                  <ChevronRight className="size-5 shrink-0 text-ink-subtle" aria-hidden />
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
