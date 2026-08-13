import { ClientSidebar } from '@/components/layout/client-sidebar'
import { ClientMobileHeader } from '@/components/layout/client-mobile-header'
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
        <ClientMobileHeader />
        {/* El espacio inferior deja aire sobre la barra flotante en movil. */}
        <main
          id="main-content"
          className="mx-auto w-full max-w-4xl flex-1 px-4 pt-6 pb-32 sm:px-6 sm:pt-8 md:py-10"
        >
          {children}
        </main>
      </div>
      <MobileBottomNav />
    </div>
  )
}
