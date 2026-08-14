import { Video } from 'lucide-react'
import type { Metadata } from 'next'

import { CameraPlayer } from '@/components/cameras/camera-player'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { LinkButton } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/page-header'
import { StatusBadge } from '@/components/ui/status-badge'
import { getViewableCameras } from '@/server/queries/cameras'
import { requireUser } from '@/server/auth/session'

export const metadata: Metadata = { title: 'Cámaras en vivo' }

export default async function CamerasPage() {
  const user = await requireUser()
  const cameras = await getViewableCameras(user)

  return (
    <div className="space-y-4 sm:space-y-5">
      <PageHeader
        eyebrow="En vivo"
        icon={Video}
        title="Cámaras"
        description="Solo las áreas donde está tu mascota durante su estancia."
      />

      {cameras.length === 0 ? (
        <EmptyState
          icon={Video}
          title="No hay cámaras disponibles ahora"
          description="El acceso a las cámaras se habilita mientras tu mascota está en el club, y solo para las áreas donde se encuentra."
          action={
            <LinkButton size="sm" variant="outline" href="/mi-mascota">
              Ver cómo va su día
            </LinkButton>
          }
        />
      ) : (
        <ul className="grid gap-4 xl:grid-cols-2">
          {cameras.map((camera) => (
            <li key={camera.id}>
              <Card>
                <CardHeader className="flex-row items-start justify-between gap-3">
                  <div className="min-w-0">
                    <CardTitle>{camera.name}</CardTitle>
                    <p className="text-sm text-ink-muted">{camera.area}</p>
                    {camera.petsHere.length > 0 && (
                      <p className="mt-1 text-sm font-semibold text-brand-700">
                        {camera.petsHere.join(' y ')}{' '}
                        {camera.petsHere.length === 1 ? 'está' : 'están'} en esta área ahora.
                      </p>
                    )}
                  </div>

                  <StatusBadge
                    tone={camera.status === 'ONLINE' ? 'success' : 'neutral'}
                  >
                    {camera.status === 'ONLINE' ? 'En línea' : 'Fuera de línea'}
                  </StatusBadge>
                </CardHeader>

                <CardContent>
                  <CameraPlayer
                    cameraId={camera.id}
                    cameraName={camera.name}
                    area={camera.area}
                  />
                  {camera.description && (
                    <p className="mt-3 text-sm text-ink-muted">{camera.description}</p>
                  )}
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <p className="text-center text-xs text-ink-subtle">
        El acceso termina cuando termina la estancia de tu mascota.
      </p>
    </div>
  )
}
