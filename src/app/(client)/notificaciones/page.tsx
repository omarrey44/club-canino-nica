import { Bell } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

import { EmptyState } from '@/components/ui/empty-state'
import { LiveRefresh } from '@/components/stays/live-refresh'
import { MarkAllReadButton } from '@/components/notifications/mark-all-read'
import { NotificationItem } from '@/components/notifications/notification-item'
import { PageHeader } from '@/components/ui/page-header'
import { formatDate } from '@/lib/datetime'
import { getNotifications, getUnreadCount } from '@/server/queries/notifications'
import { requireUser } from '@/server/auth/session'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Notificaciones' }

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ filtro?: string }>
}) {
  const user = await requireUser()
  const { filtro } = await searchParams
  const onlyUnread = filtro === 'sin-leer'

  const [notifications, unread] = await Promise.all([
    getNotifications(user, onlyUnread),
    getUnreadCount(user.id),
  ])

  // Agrupadas por día: una lista plana de sesenta avisos es difícil de situar.
  const groups = new Map<string, typeof notifications>()
  for (const notification of notifications) {
    const day = formatDate(notification.createdAt)
    groups.set(day, [...(groups.get(day) ?? []), notification])
  }

  return (
    <div className="space-y-6">
      {/* Mientras la pestaña esté visible, los avisos nuevos entran solos. */}
      <LiveRefresh seconds={90} />

      <PageHeader
        eyebrow="Avisos"
        title="Notificaciones"
        description={
          unread === 0
            ? 'Estás al día.'
            : `Tienes ${unread} ${unread === 1 ? 'aviso sin leer' : 'avisos sin leer'}.`
        }
        action={<MarkAllReadButton disabled={unread === 0} />}
      />

      <nav aria-label="Filtrar avisos" className="flex gap-2">
        {[
          { value: '', label: 'Todos' },
          { value: 'sin-leer', label: 'Sin leer' },
        ].map((option) => {
          const active = onlyUnread === (option.value === 'sin-leer')
          return (
            <Link
              key={option.label}
              href={option.value ? '/notificaciones?filtro=sin-leer' : '/notificaciones'}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex min-h-11 items-center rounded-pill px-4 text-sm font-semibold transition-colors',
                active
                  ? 'bg-navy-800 text-white'
                  : 'border border-line-strong bg-surface text-ink-muted hover:text-ink'
              )}
            >
              {option.label}
            </Link>
          )
        })}
      </nav>

      {notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title={onlyUnread ? 'No tienes avisos sin leer' : 'Sin avisos por ahora'}
          description="Te escribiremos cuando tu mascota ingrese, coma, salga a pasear o esté lista para recoger."
        />
      ) : (
        <div className="space-y-6">
          {[...groups.entries()].map(([day, items]) => (
            <section key={day} className="space-y-2.5">
              <h2 className="text-sm font-bold text-ink-muted">{day}</h2>
              <ul className="space-y-2.5">
                {items.map((notification) => (
                  <li key={notification.id}>
                    <NotificationItem notification={notification} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
