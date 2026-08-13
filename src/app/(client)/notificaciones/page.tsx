import { Bell } from 'lucide-react'
import type { Metadata } from 'next'

import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'

export const metadata: Metadata = { title: 'Notificaciones' }

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Siempre al día"
        title="Notificaciones"
        description="Todo lo importante sobre tu mascota, sin perderte ningún momento."
      />

      {/* FASE 8: listado real, marcado de leidas y preparacion para push. */}
      <EmptyState
        icon={Bell}
        title="Sin avisos por ahora"
        description="Te escribiremos cuando tu mascota ingrese, coma, salga a pasear o esté lista para recoger."
      />
    </div>
  )
}
