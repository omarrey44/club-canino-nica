import { AdminMobileNav, AdminSidebar } from '@/components/layout/admin-sidebar'
import { LogoutButton } from '@/components/layout/logout-button'
import { requireStaff } from '@/server/auth/session'

/**
 * Shell del panel operativo. `requireStaff()` es la barrera real: un CLIENT
 * que escriba /admin a mano termina de vuelta en su inicio.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireStaff()

  return (
    <div className="flex min-h-dvh bg-canvas">
      <AdminSidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminMobileNav />

        <header className="hidden items-center justify-between gap-4 border-b border-line bg-surface px-7 py-3.5 lg:flex">
          <p className="text-sm text-ink-muted">
            Sesión de <span className="font-medium text-ink">{user.fullName}</span>
          </p>
          <LogoutButton />
        </header>

        <main id="main-content" className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    </div>
  )
}
