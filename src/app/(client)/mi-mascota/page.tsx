import { PawPrint } from 'lucide-react'
import type { Metadata } from 'next'

import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'

export const metadata: Metadata = { title: 'Mi mascota hoy' }

export default function PetTodayPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Su día en vivo"
        title="Mi mascota hoy"
        description="El detalle de su día, minuto a minuto."
      />

      {/* FASE 4: timeline de actividades en vivo, camaras autorizadas y fotos. */}
      <EmptyState
        icon={PawPrint}
        title="Tu mascota no esta en el club ahora mismo"
        description="Durante su estancia verás aquí cada comida, paseo, descanso y fotografía del día."
      />
    </div>
  )
}
