import { Video } from 'lucide-react'
import type { Metadata } from 'next'

import { PhasePlaceholder } from '@/components/layout/phase-placeholder'

export const metadata: Metadata = { title: 'Cámaras' }

export default function AdminCamerasPage() {
  return (
    <PhasePlaceholder
      icon={Video}
      title="Cámaras"
      description="Alta de cámaras y permisos por estancia."
      emptyTitle="No hay cámaras configuradas"
      emptyDescription="Cada cámara se autoriza por estancia: al terminar el día, el propietario pierde el acceso automaticamente."
      phase="Fase 6"
    />
  )
}
