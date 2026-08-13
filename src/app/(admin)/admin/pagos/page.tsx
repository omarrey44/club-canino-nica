import { CreditCard } from 'lucide-react'
import type { Metadata } from 'next'

import { PhasePlaceholder } from '@/components/layout/phase-placeholder'

export const metadata: Metadata = { title: 'Pagos' }

export default function AdminPaymentsPage() {
  return (
    <PhasePlaceholder
      icon={CreditCard}
      title="Pagos"
      description="Estado de cobro de cada reservacion."
      emptyTitle="No hay pagos registrados"
      emptyDescription="Se guarda solo el estado y la referencia del proveedor. Ningun dato de tarjeta pasa por la plataforma."
      phase="Fase 7"
    />
  )
}
