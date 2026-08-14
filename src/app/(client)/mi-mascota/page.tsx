import { Camera, Images, MapPin, PawPrint } from 'lucide-react'
import Image from 'next/image'
import type { Metadata } from 'next'

import { ActivityTimeline } from '@/components/stays/activity-timeline'
import { Button, LinkButton } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { LiveRefresh } from '@/components/stays/live-refresh'
import { PageHeader } from '@/components/ui/page-header'
import { PetAvatar } from '@/components/ui/pet-avatar'
import { StatusBadge } from '@/components/ui/status-badge'
import { formatDate, formatTime, relativeTime } from '@/lib/datetime'
import { getMyActiveStay, getMyLastStay } from '@/server/queries/stays'
import { requireUser } from '@/server/auth/session'

export const metadata: Metadata = { title: 'Mi mascota hoy' }

export default async function PetTodayPage() {
  const user = await requireUser()
  const stay = await getMyActiveStay(user)

  if (!stay) {
    const last = await getMyLastStay(user)

    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Hoy"
          title="Mi mascota hoy"
          description="El detalle de su día, minuto a minuto."
        />

        <EmptyState
          icon={PawPrint}
          title="Tu mascota no esta en el club ahora mismo"
          description={
            last
              ? `Su ultima visita fue el ${formatDate(last.checkOutAt ?? last.checkInAt)}. Durante su estancia veras aquí cada comida, paseo, descanso y fotografía.`
              : 'Durante su estancia veras aquí cada comida, paseo, descanso y fotografía del día.'
          }
          action={
            <LinkButton size="sm" href="/reservas/nueva">
              Reservar una estancia
            </LinkButton>
          }
        />
      </div>
    )
  }

  const isReady = stay.status === 'READY_FOR_PICKUP'
  const lastUpdate = stay.activities[0]?.occurredAt ?? stay.checkInAt

  return (
    <div className="space-y-6">
      {/* La pantalla se actualiza sola mientras la mascota esta en el club. */}
      <LiveRefresh />

      <header className="space-y-2">
        <p className="text-xs font-extrabold tracking-[0.14em] text-brand-600 uppercase">
          Hoy
        </p>
        <h1 className="text-2xl font-extrabold text-navy-900 sm:text-3xl">
          {isReady
            ? `${stay.pet.name} está listo para que pases por el`
            : `${stay.pet.name} está disfrutando su día`}
        </h1>
      </header>

      <Card>
        <CardContent className="flex flex-wrap items-center gap-4 pt-5">
          <PetAvatar name={stay.pet.name} photoUrl={stay.pet.photoUrl} size="lg" />

          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-extrabold text-navy-900">{stay.pet.name}</p>
              <StatusBadge tone={isReady ? 'brand' : 'success'}>
                {isReady ? 'Listo para recoger' : 'Todo está bien'}
              </StatusBadge>
            </div>

            {stay.currentLocation && (
              <p className="flex items-center gap-1.5 text-sm text-ink-muted">
                <MapPin className="size-3.5 shrink-0" aria-hidden />
                {stay.currentLocation}
              </p>
            )}

            <p className="text-sm text-ink-muted tabular-nums">
              Entró a las {formatTime(stay.checkInAt)} · Sale cerca de las{' '}
              {formatTime(stay.expectedCheckOutAt)}
            </p>

            <p className="text-sm text-ink-subtle">
              Última actualización: {relativeTime(lastUpdate)}
            </p>
          </div>

          {/* La cámara llega en la Fase 6; el boton ya ocupa su lugar. */}
          <Button variant="outline" size="sm" disabled>
            <Camera aria-hidden />
            Cámara en vivo
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Su día, paso a paso</CardTitle>
        </CardHeader>
        <CardContent>
          {stay.activities.length === 0 ? (
            <p className="text-sm text-ink-muted">
              Acaba de llegar. En cuanto el equipo registre algo, aparecera aquí.
            </p>
          ) : (
            <ActivityTimeline activities={stay.activities} />
          )}
        </CardContent>
      </Card>

      {stay.photos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              <span className="inline-flex items-center gap-2">
                <Images className="size-4" aria-hidden />
                Fotos de hoy
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid grid-cols-2 gap-3">
              {stay.photos.map((photo) => (
                <li key={photo.id} className="space-y-1.5">
                  <div className="relative aspect-square overflow-hidden rounded-field bg-navy-50">
                    <Image
                      src={photo.url}
                      alt={photo.caption ?? `Foto de ${stay.pet.name}`}
                      fill
                      sizes="(max-width: 640px) 45vw, 300px"
                      className="object-cover"
                    />
                  </div>
                  {photo.caption && (
                    <p className="text-sm text-ink-muted">{photo.caption}</p>
                  )}
                  <p className="text-2xs text-ink-subtle tabular-nums">
                    {formatTime(photo.takenAt)}
                  </p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
