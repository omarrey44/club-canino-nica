import { Dog } from 'lucide-react'
import type { Metadata } from 'next'

import { PhasePlaceholder } from '@/components/layout/phase-placeholder'

export const metadata: Metadata = { title: 'Estancias' }

export default function AdminStaysPage() {
  return (
    <PhasePlaceholder
      icon={Dog}
      title="Estancias"
      description="Check-in, seguimiento y registro rapido de actividades."
      emptyTitle="Ninguna mascota en estancia"
      emptyDescription="Al registrar un check-in podras anotar comidas, paseos, descansos y fotos en segundos."
      phase="Fase 4"
    />
  )
}
