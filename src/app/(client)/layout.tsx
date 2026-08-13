import { ClientSidebar } from '@/components/layout/client-sidebar'
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav'
import { requireUser } from '@/server/auth/session'

/**
 * Shell del portal del cliente.
 *
 * `requireUser()` corre en el servidor en cada navegacion: aunque alguien
 * manipule el proxy, sin sesion no se renderiza nada.
 */
export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  await requireUser()

  return (
    <div className="flex min-h-dvh bg-canvas">
      <ClientSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        {/* pb-20 deja aire sobre la barra inferior en movil. */}
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-6 pb-24 sm:px-6 md:pb-10">
          {children}
        </main>
      </div>
      <MobileBottomNav />
    </div>
  )
}
