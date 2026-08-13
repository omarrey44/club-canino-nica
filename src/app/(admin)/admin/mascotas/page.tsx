import { Dog } from 'lucide-react'
import type { Metadata } from 'next'

import { PhasePlaceholder } from '@/components/layout/phase-placeholder'

export const metadata: Metadata = { title: 'Mascotas' }

export default function AdminPetsPage() {
  return (
    <PhasePlaceholder
      icon={Dog}
      title="Mascotas"
      description="Todas las mascotas del club y su informacion de cuidado."
      emptyTitle="Todavia no hay mascotas registradas"
      emptyDescription="Podras filtrar por nombre, propietario, raza y estancia actual."
      phase="Fase 2"
    />
  )
}
