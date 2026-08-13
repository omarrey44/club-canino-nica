import { Video } from 'lucide-react'
import type { Metadata } from 'next'

import { PhasePlaceholder } from '@/components/layout/phase-placeholder'

export const metadata: Metadata = { title: 'Camaras' }

export default function AdminCamerasPage() {
  return (
    <PhasePlaceholder
      icon={Video}
      title="Camaras"
      description="Alta de camaras y permisos por estancia."
      emptyTitle="No hay camaras configuradas"
      emptyDescription="Cada camara se autoriza por estancia: al terminar el dia, el propietario pierde el acceso automaticamente."
      phase="Fase 6"
    />
  )
}
