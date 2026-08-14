import { ShieldCheck } from 'lucide-react'
import type { Metadata } from 'next'

import { Alert } from '@/components/ui/alert'
import { CamerasManager } from '@/components/cameras/cameras-manager'
import { PageHeader } from '@/components/ui/page-header'
import { getActiveStays } from '@/server/queries/stays'
import { getOrganizationCameras } from '@/server/queries/cameras'
import { requireStaff } from '@/server/auth/session'

export const metadata: Metadata = { title: 'Cámaras' }

export default async function AdminCamerasPage() {
  // Todo el personal puede conceder y revocar accesos, porque es parte de la
  // operación diaria. Crear y editar cámaras queda restringido a ADMIN dentro
  // de la propia acción.
  const user = await requireStaff()

  const [cameras, stays] = await Promise.all([
    getOrganizationCameras(user.organizationId),
    getActiveStays(user.organizationId),
  ])

  const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN'

  return (
    <div className="space-y-4 sm:space-y-5">
      <PageHeader
        eyebrow="Transparencia"
        icon={ShieldCheck}
        title="Cámaras"
        description="Qué cámaras existen y quién puede verlas ahora mismo."
      />

      <Alert tone="info">
        <span className="flex items-start gap-1.5">
          <ShieldCheck className="sr-only" aria-hidden />
          El acceso se concede por estancia y termina con ella. Las credenciales de las
          cámaras nunca se guardan aquí: la plataforma solo conserva un identificador y
          resuelve el video en el servidor.
        </span>
      </Alert>

      <CamerasManager
        canEditCatalog={isAdmin}
        activeStays={stays.map((stay) => ({
          id: stay.id,
          label: `${stay.pet.name} · ${stay.reservation.client.fullName}`,
        }))}
        cameras={cameras.map((camera) => ({
          id: camera.id,
          name: camera.name,
          area: camera.area,
          description: camera.description,
          provider: camera.provider,
          providerRef: camera.providerRef,
          protocol: camera.protocol,
          status: camera.status,
          isActive: camera.isActive,
          access: camera.access.map((grant) => ({
            id: grant.id,
            petName: grant.stay.pet.name,
            stayId: grant.stay.id,
          })),
        }))}
      />
    </div>
  )
}
