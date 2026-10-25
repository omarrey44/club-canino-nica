import { AdminMobileNav, AdminSidebar } from '@/components/layout/admin-sidebar'
import { LogoutButton } from '@/components/layout/logout-button'
import { NotificationBell } from '@/components/notifications/notification-bell'
import { StatusBadge } from '@/components/ui/status-badge'
import { roleLabels } from '@/lib/constants/labels'
import { requireStaff } from '@/server/auth/session'
import { getUnreadCount } from '@/server/queries/notifications'

/**
 * Shell del panel operativo. `requireStaff()` es la barrera real: un CLIENT
 * que escriba /admin a mano termina de vuelta en su inicio.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireStaff()
  const unreadCount = await getUnreadCount(user.id)

  return (
    <div className="app-background app-background-minimal flex min-h-dvh">
      <AdminSidebar role={user.role} />

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminMobileNav
          userName={user.fullName}
          role={user.role}
          footer={<LogoutButton />}
          bell={
            <NotificationBell
              count={unreadCount}
              className="border border-white/15 bg-white/10 text-white hover:bg-white/15"
            />
          }
        />

        <header className="hidden items-center justify-between gap-4 border-b border-line bg-surface px-7 py-2.5 lg:flex">
          <p className="flex items-center gap-2.5 text-sm text-ink-muted">
            <span>
              Sesión de <span className="font-medium text-ink">{user.fullName}</span>
            </span>
            <StatusBadge tone="brand">{roleLabels[user.role]}</StatusBadge>
          </p>
          <div className="flex items-center gap-2">
            <NotificationBell count={unreadCount} className="text-navy-700 hover:bg-navy-50" />
            <LogoutButton />
          </div>
        </header>

        <main id="main-content" className="mx-auto w-full max-w-[90rem] flex-1 px-4 py-4 sm:px-6 sm:py-5 lg:px-7 lg:py-6">{children}</main>
      </div>
    </div>
  )
}
