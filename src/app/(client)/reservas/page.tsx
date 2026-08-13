import { CalendarDays } from 'lucide-react'
import type { Metadata } from 'next'

import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'

export const metadata: Metadata = { title: 'Mis reservaciones' }

export default function ReservationsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Tu agenda"
        title="Mis reservaciones"
        description="Próximas, activas y finalizadas, organizadas en un solo lugar."
      />

      {/* FASE 3: listado con filtros por estado y el flujo de reserva en 7 pasos. */}
      <EmptyState
        icon={CalendarDays}
        title="No tienes reservaciones próximas"
        description="Cuando reserves una estancia, aparecerá aquí con su fecha, horario y estado."
      />
    </div>
  )
}
