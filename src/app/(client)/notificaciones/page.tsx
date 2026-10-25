import type { Metadata } from 'next'

import { NotificationsView } from '@/components/notifications/notifications-view'
import { requireUser } from '@/server/auth/session'

export const metadata: Metadata = { title: 'Notificaciones' }

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ filtro?: string; pagina?: string }>
}) {
  const user = await requireUser()

  return (
    <NotificationsView
      user={user}
      basePath="/notificaciones"
      searchParams={await searchParams}
      emptyDescription="Te escribiremos cuando tu mascota ingrese, coma, salga a pasear o esté lista para recoger."
    />
  )
}
