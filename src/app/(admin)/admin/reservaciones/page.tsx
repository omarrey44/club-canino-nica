import { CalendarDays } from 'lucide-react'
import type { Metadata } from 'next'

import { PhasePlaceholder } from '@/components/layout/phase-placeholder'

export const metadata: Metadata = { title: 'Reservaciones' }

export default function AdminReservationsPage() {
  return (
    <PhasePlaceholder
      icon={CalendarDays}
      title="Reservaciones"
      description="Agenda por dia y semana, con capacidad disponible."
      emptyTitle="No hay reservaciones registradas"
      emptyDescription="Aqui veras la agenda con filtros por fecha, estado y servicio."
      phase="Fase 3"
    />
  )
}
