import type { Metadata } from 'next'

import { NotificationsView } from '@/components/notifications/notifications-view'
import { requireStaff } from '@/server/auth/session'

export const metadata: Metadata = { title: 'Avisos' }

export default async function AdminNotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ filtro?: string; pagina?: string }>
}) {
  const user = await requireStaff()

  return (
    <NotificationsView
      user={user}
      basePath="/admin/avisos"
      searchParams={await searchParams}
      emptyDescription="Aquí llegan las reservas nuevas, las cancelaciones y los pagos recibidos."
    />
  )
}
