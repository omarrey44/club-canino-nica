import { FileText } from 'lucide-react'
import type { Metadata } from 'next'

import { PhasePlaceholder } from '@/components/layout/phase-placeholder'

export const metadata: Metadata = { title: 'Reportes diarios' }

export default function AdminReportsPage() {
  return (
    <PhasePlaceholder
      icon={FileText}
      title="Reportes diarios"
      description="El resumen del dia que recibe cada propietario."
      emptyTitle="No hay reportes pendientes"
      emptyDescription="El formulario se precarga con las actividades ya registradas para no capturar lo mismo dos veces."
      phase="Fase 5"
    />
  )
}
