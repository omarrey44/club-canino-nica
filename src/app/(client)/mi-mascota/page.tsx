import { Camera, Images, MapPin, PawPrint } from 'lucide-react'
import type { Metadata } from 'next'

import { ActivityTimeline } from '@/components/stays/activity-timeline'
import { LinkButton } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DailyReportCard } from '@/components/reports/daily-report-card'
import { EmptyState } from '@/components/ui/empty-state'
import { LiveRefresh } from '@/components/stays/live-refresh'
import { PageHeader } from '@/components/ui/page-header'
import { PetAvatar } from '@/components/ui/pet-avatar'
import { PhotoGrid } from '@/components/photos/photo-grid'
import { StatusBadge } from '@/components/ui/status-badge'
import { formatDate, formatTime, relativeTime } from '@/lib/datetime'
import { getPublishedReport } from '@/server/queries/reports'
import { getMyActiveStay, getMyLastStay } from '@/server/queries/stays'
import { requireUser } from '@/server/auth/session'

export const metadata: Metadata = { title: 'Mi mascota hoy' }

export default async function PetTodayPage() {
  const user = await requireUser()
  const stay = await getMyActiveStay(user)
  const report = stay ? await getPublishedReport(stay.id, user) : null

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
    <div className="space-y-5">
      {/* La pantalla se actualiza sola mientras la mascota esta en el club. */}
      <LiveRefresh />

      <header className="space-y-1.5">
        <p className="text-xs font-extrabold tracking-[0.14em] text-brand-700 uppercase">
          Hoy
        </p>
        <h1 className="text-2xl font-extrabold text-navy-900 sm:text-3xl">
          {isReady
            ? `${stay.pet.name} está listo para que pases por el`
            : `${stay.pet.name} está disfrutando su día`}
        </h1>
      </header>

      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 pt-4">
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

          <LinkButton variant="outline" size="sm" href="/camaras">
            <Camera aria-hidden />
            Cámara en vivo
          </LinkButton>
        </CardContent>
      </Card>

      {/* El reporte solo aparece cuando el equipo lo publica, al cerrar el día. */}
      {report && (
        <DailyReportCard
          report={report}
          petName={stay.pet.name}
          photos={stay.photos.filter((photo) => photo.isFeatured)}
        />
      )}

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
            <PhotoGrid photos={stay.photos} petName={stay.pet.name} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
