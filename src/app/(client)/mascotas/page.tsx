import { PawPrint } from 'lucide-react'
import type { Metadata } from 'next'

import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'

export const metadata: Metadata = { title: 'Mis mascotas' }

export default function MyPetsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Mis mascotas"
        description="Su informacion, salud y vacunas."
      />

      {/* FASE 2: alta, edicion, ficha completa y modulo de vacunas. */}
      <EmptyState
        icon={PawPrint}
        title="Aun no registras ninguna mascota"
        description="Con su ficha completa el equipo del club sabe como cuidarla: alimentacion, alergias y contactos de emergencia."
      />
    </div>
  )
}
