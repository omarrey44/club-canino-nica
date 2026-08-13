import { Sparkles } from 'lucide-react'
import type { Metadata } from 'next'

import { PhasePlaceholder } from '@/components/layout/phase-placeholder'

export const metadata: Metadata = { title: 'Servicios' }

export default function AdminServicesPage() {
  return (
    <PhasePlaceholder
      icon={Sparkles}
      title="Servicios"
      description="Catalogo, precios, duracion y disponibilidad."
      emptyTitle="Aun no hay servicios configurados"
      emptyDescription="Los precios viven en base de datos: cambiarlos aqui actualiza el flujo de reserva sin desplegar."
      phase="Fase 3"
    />
  )
}
