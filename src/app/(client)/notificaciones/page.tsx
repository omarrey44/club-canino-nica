import { Bell, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

import { EmptyState } from '@/components/ui/empty-state'
import { LiveRefresh } from '@/components/stays/live-refresh'
import { MarkAllReadButton } from '@/components/notifications/mark-all-read'
import { NotificationItem } from '@/components/notifications/notification-item'
import { PageHeader } from '@/components/ui/page-header'
import { formatDate } from '@/lib/datetime'
import {
  getNotifications,
  getUnreadCount,
  NOTIFICATIONS_PAGE_SIZE,
} from '@/server/queries/notifications'
import { requireUser } from '@/server/auth/session'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Notificaciones' }

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ filtro?: string; pagina?: string }>
}) {
  const user = await requireUser()
  const { filtro, pagina } = await searchParams
  const onlyUnread = filtro === 'sin-leer'
  const parsedPage = Number.parseInt(pagina ?? '1', 10)
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1

  const [notifications, unread] = await Promise.all([
    getNotifications(user, onlyUnread, page),
    getUnreadCount(user.id),
  ])
  const hasNextPage = notifications.length > NOTIFICATIONS_PAGE_SIZE
  const visibleNotifications = notifications.slice(0, NOTIFICATIONS_PAGE_SIZE)

  // Agrupadas por día: una lista plana de sesenta avisos es difícil de situar.
  const groups = new Map<string, typeof visibleNotifications>()
  for (const notification of visibleNotifications) {
    const day = formatDate(notification.createdAt)
    groups.set(day, [...(groups.get(day) ?? []), notification])
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4 sm:space-y-5">
      {/* Mientras la pestaña esté visible, los avisos nuevos entran solos. */}
      <LiveRefresh seconds={90} />

      <PageHeader
        eyebrow="Avisos"
        icon={Bell}
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

      {visibleNotifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title={onlyUnread ? 'No tienes avisos sin leer' : 'Sin avisos por ahora'}
          description="Te escribiremos cuando tu mascota ingrese, coma, salga a pasear o esté lista para recoger."
        />
      ) : (
        <div className="space-y-4">
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

          {(page > 1 || hasNextPage) && (
            <nav
              aria-label="Páginas de notificaciones"
              className="flex items-center justify-between gap-3 border-t border-line pt-4"
            >
              {page > 1 ? (
                <Link
                  href={`/notificaciones?${new URLSearchParams({
                    ...(onlyUnread ? { filtro: 'sin-leer' } : {}),
                    pagina: String(page - 1),
                  })}`}
                  className="inline-flex min-h-11 items-center gap-1 rounded-pill border border-line-strong bg-surface px-4 text-sm font-semibold text-ink transition-colors hover:bg-canvas"
                >
                  <ChevronLeft className="size-4" aria-hidden />
                  Anterior
                </Link>
              ) : (
                <span />
              )}

              <span className="text-xs font-semibold text-ink-muted">Página {page}</span>

              {hasNextPage ? (
                <Link
                  href={`/notificaciones?${new URLSearchParams({
                    ...(onlyUnread ? { filtro: 'sin-leer' } : {}),
                    pagina: String(page + 1),
                  })}`}
                  className="inline-flex min-h-11 items-center gap-1 rounded-pill bg-navy-800 px-4 text-sm font-semibold text-white transition-colors hover:bg-navy-700"
                >
                  Siguiente
                  <ChevronRight className="size-4" aria-hidden />
                </Link>
              ) : (
                <span />
              )}
            </nav>
          )}
        </div>
      )}
    </div>
  )
}
