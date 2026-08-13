import { Users } from 'lucide-react'
import type { Metadata } from 'next'

import { PhasePlaceholder } from '@/components/layout/phase-placeholder'

export const metadata: Metadata = { title: 'Clientes' }

export default function AdminClientsPage() {
  return (
    <PhasePlaceholder
      icon={Users}
      title="Clientes"
      description="Contacto, mascotas, reservaciones e historial de pagos."
      emptyTitle="Aun no hay clientes registrados"
      emptyDescription="Cada cliente mostrara sus mascotas, sus reservaciones y su historial en un solo lugar."
      phase="Fase 3"
    />
  )
}
