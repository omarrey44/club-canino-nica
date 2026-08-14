import type { Metadata } from 'next'
import { Sparkles } from 'lucide-react'

import { Alert } from '@/components/ui/alert'
import { PageHeader } from '@/components/ui/page-header'
import { ServicesManager } from '@/components/services/services-manager'
import { business } from '@/config/business'
import { getAllServices } from '@/server/queries/services'
import { requireRole } from '@/server/auth/session'

export const metadata: Metadata = { title: 'Servicios' }

export default async function AdminServicesPage() {
  // El catalogo y los precios son decision de administracion.
  const user = await requireRole('ADMIN', 'SUPER_ADMIN')
  const services = await getAllServices(user.organizationId)

  return (
    <div className="space-y-4 sm:space-y-5">
      <PageHeader
        eyebrow="Catálogo"
        icon={Sparkles}
        title="Servicios"
        description="Precios, duración y cupos. Lo que se cambia aquí aplica a las reservas nuevas."
      />

      <Alert tone="warning">
        Los precios cargados son <strong>DEMO</strong>. No son las tarifas oficiales de{' '}
        {business.name} y deben confirmarse antes de mostrar la plataforma a clientes.
      </Alert>

      <ServicesManager
        services={services.map((service) => ({
          id: service.id,
          name: service.name,
          description: service.description,
          kind: service.kind,
          basePrice: String(service.basePrice),
          priceUnit: service.priceUnit,
          durationMinutes: service.durationMinutes,
          dailyCapacity: service.dailyCapacity,
          isActive: service.isActive,
          reservationCount: service._count.reservations,
        }))}
      />
    </div>
  )
}
