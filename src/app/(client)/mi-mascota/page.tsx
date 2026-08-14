import {
  Activity,
  Camera,
  Clock3,
  Footprints,
  Images,
  LogIn,
  LogOut,
  MapPin,
  PawPrint,
  Utensils,
  UserRound,
  type LucideIcon,
} from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

import { ActivityTimeline } from '@/components/stays/activity-timeline'
import { LinkButton } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { DailyReportCard } from '@/components/reports/daily-report-card'
import { EmptyState } from '@/components/ui/empty-state'
import { LiveRefresh } from '@/components/stays/live-refresh'
import { PageHeader } from '@/components/ui/page-header'
import { PetAvatar } from '@/components/ui/pet-avatar'
import { PhotoGrid } from '@/components/photos/photo-grid'
import { StatusBadge } from '@/components/ui/status-badge'
import { business } from '@/config/business'
import { formatDate, formatTime, relativeTime } from '@/lib/datetime'
import { cn } from '@/lib/utils'
import { getPublishedReport } from '@/server/queries/reports'
import { getMyActiveStay, getMyLastStay } from '@/server/queries/stays'
import { requireUser } from '@/server/auth/session'

export const metadata: Metadata = { title: 'Mi mascota hoy' }

type DaySummaryItem = {
  label: string
  value: number
  hint: string
  icon: LucideIcon
  tone: string
}

function StayFact({
  icon: Icon,
  label,
  value,
  detail,
  tone,
  className,
}: {
  icon: LucideIcon
  label: string
  value: string
  detail?: string
  tone: string
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex min-w-0 items-center gap-2.5 lg:border-l lg:border-line lg:pl-4',
        className
      )}
    >
      <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-[0.7rem]', tone)}>
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-2xs font-bold tracking-wide text-ink-muted uppercase">{label}</p>
        <p className="text-sm font-extrabold whitespace-nowrap text-navy-900 tabular-nums">{value}</p>
        {detail && <p className="truncate text-2xs text-ink-muted">{detail}</p>}
      </div>
    </div>
  )
}

export default async function PetTodayPage() {
  const user = await requireUser()
  const stay = await getMyActiveStay(user)
  const report = stay ? await getPublishedReport(stay.id, user) : null

  if (!stay) {
    const last = await getMyLastStay(user)

    return (
      <div className="app-section-accent space-y-4 sm:space-y-5">
        <PageHeader
          eyebrow="Hoy"
          icon={PawPrint}
          title="Mi mascota hoy"
          description="El detalle de su día, minuto a minuto."
          action={
            <LinkButton size="sm" variant="outline" href="/mascotas">
              <PawPrint aria-hidden />
              Mis mascotas
            </LinkButton>
          }
        />

        <EmptyState
          icon={PawPrint}
          title="Tu mascota no está en el club ahora mismo"
          description={
            last
              ? `Su última visita fue el ${formatDate(last.checkOutAt ?? last.checkInAt)}. Durante su estancia verás aquí cada comida, paseo, descanso y fotografía.`
              : 'Durante su estancia verás aquí cada comida, paseo, descanso y fotografía del día.'
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
  const caregiver = stay.activities.find((activity) => activity.recordedBy)?.recordedBy?.fullName
  const chronologicalActivities = [...stay.activities].reverse()

  const summary: DaySummaryItem[] = [
    {
      label: 'Actividades',
      value: stay.activities.length,
      hint: 'Registradas hoy',
      icon: Activity,
      tone: 'bg-success-soft text-success',
    },
    {
      label: 'Paseos',
      value: stay.activities.filter((activity) => activity.type === 'WALK').length,
      hint: 'Salidas registradas',
      icon: Footprints,
      tone: 'bg-info-soft text-info',
    },
    {
      label: 'Comidas',
      value: stay.activities.filter((activity) => activity.type === 'FOOD').length,
      hint: 'Momentos de alimento',
      icon: Utensils,
      tone: 'bg-warning-soft text-warning',
    },
    {
      label: 'Fotos',
      value: stay.photos.length,
      hint: 'Recuerdos de hoy',
      icon: Images,
      tone: 'bg-brand-50 text-brand-700',
    },
  ]

  return (
    <div className="app-section-accent space-y-4">
      {/* La pantalla se actualiza sola mientras la mascota está en el club. */}
      <LiveRefresh />

      {/* El titular vive dentro de la tarjeta de estado: un encabezado aparte
          repetia el nombre y el estado de la mascota dos veces seguidas y
          empujaba el timeline fuera de una ventana de portatil. */}
      <Card className="overflow-hidden">
        <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(14rem,1.2fr)_repeat(3,minmax(5rem,0.65fr))] lg:items-center xl:grid-cols-[minmax(0,1.35fr)_repeat(3,minmax(0,0.72fr))_auto]">
          <div className="flex min-w-0 items-center gap-4 lg:pr-2">
            <div className="relative">
              <PetAvatar
                name={stay.pet.name}
                photoUrl={stay.pet.photoUrl}
                size="xl"
                className="lg:size-20 xl:size-24"
              />
              {/* `aria-label` sobre un `span` sin rol no lo lee nadie: el punto
                  es decorativo y el estado ya lo dice la insignia de al lado. */}
              <span
                className="absolute right-0 bottom-1 size-4 rounded-full border-2 border-white bg-success"
                aria-hidden
              />
            </div>

            <div className="min-w-0">
              <p className="text-2xs font-extrabold tracking-[0.14em] text-brand-700 uppercase">
                Hoy en {business.shortName}
              </p>

              <div className="mt-0.5 flex flex-wrap items-center gap-2">
                <h1 className="text-2xl leading-tight text-navy-900">{stay.pet.name}</h1>
                <StatusBadge tone={isReady ? 'brand' : 'success'}>
                  {isReady ? 'Listo para recoger' : 'Todo está bien'}
                </StatusBadge>
              </div>

              <p className="mt-1.5 flex items-center gap-1.5 text-sm font-semibold text-ink-muted">
                <MapPin className="size-4 shrink-0 text-info" aria-hidden />
                {stay.currentLocation ?? 'Área principal del club'}
              </p>

              {caregiver && (
                <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-muted">
                  <UserRound className="size-4 shrink-0" aria-hidden />
                  Atendido por {caregiver}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:contents">
            <StayFact
              icon={LogIn}
              label="Entrada"
              value={formatTime(stay.checkInAt)}
              tone="bg-success-soft text-success"
            />
            <StayFact
              icon={LogOut}
              label="Salida"
              value={formatTime(stay.expectedCheckOutAt)}
              detail="Programada"
              tone="bg-warning-soft text-warning"
            />
            <StayFact
              icon={Clock3}
              label="Actualizado"
              value={formatTime(lastUpdate)}
              detail={relativeTime(lastUpdate)}
              tone="bg-navy-50 text-navy-700"
              className="col-span-2 sm:col-span-1"
            />
          </div>

          {/* El listado de mascotas (donde se agrega una nueva) no esta en la
              navegacion, asi que se alcanza desde aqui: es la pantalla donde el
              propietario ya esta pensando en su perro. */}
          <div className="grid gap-2 sm:grid-cols-2 lg:col-span-4 xl:col-span-1 xl:grid-cols-1">
            <LinkButton variant="secondary" size="sm" href="/camaras">
              <Camera aria-hidden />
              Cámara en vivo
            </LinkButton>
            <LinkButton variant="outline" size="sm" href="/mascotas">
              <PawPrint aria-hidden />
              Mis mascotas
            </LinkButton>
          </div>
        </div>
      </Card>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(17rem,0.78fr)_minmax(0,1.22fr)]">
        <Card className="overflow-hidden">
          <div className="border-b border-line px-4 py-3.5 sm:px-5">
            <h2 className="flex items-center gap-2 text-lg text-navy-900">
              <Activity className="size-5 text-brand-600" aria-hidden />
              Su día, paso a paso
            </h2>
            <p className="mt-0.5 text-xs text-ink-muted">Actividades registradas hoy.</p>
          </div>
          <div className="p-4 sm:p-5">
            {chronologicalActivities.length === 0 ? (
              <p className="text-sm text-ink-muted">
                Acaba de llegar. En cuanto el equipo registre algo, aparecerá aquí.
              </p>
            ) : (
              <ActivityTimeline activities={chronologicalActivities} compact />
            )}
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="overflow-hidden">
            <div className="border-b border-line px-4 py-3.5 sm:px-5">
              <h2 className="flex items-center gap-2 text-lg text-navy-900">
                <Images className="size-5 text-brand-600" aria-hidden />
                Fotos de hoy
              </h2>
              <p className="mt-0.5 text-xs text-ink-muted">
                Los mejores momentos de {stay.pet.name}.
              </p>
            </div>
            <div className="p-4 sm:p-5">
              {stay.photos.length > 0 ? (
                <PhotoGrid photos={stay.photos} petName={stay.pet.name} variant="wide" />
              ) : (
                <div className="flex min-h-24 items-center justify-center rounded-field bg-canvas px-4 text-center text-sm text-ink-muted">
                  Cuando el equipo comparta una foto, aparecerá aquí.
                </div>
              )}
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="border-b border-line px-4 py-3 sm:px-5">
              <h2 className="flex items-center gap-2 text-base text-navy-900">
                <Activity className="size-5 text-brand-600" aria-hidden />
                Resumen de su día
              </h2>
              <p className="mt-0.5 text-xs text-ink-muted">Datos registrados por el equipo.</p>
            </div>
            <dl className="grid grid-cols-2 gap-px bg-line sm:grid-cols-4">
              {summary.map((item) => {
                const Icon = item.icon
                return (
                  // Reja plana en vez de un div anidado: dentro de un `dl` el
                  // div hijo solo puede contener `dt` y `dd`, en ese orden. La
                  // reja coloca el numero arriba sin invertir el marcado.
                  <div
                    key={item.label}
                    className="grid grid-cols-[auto_1fr] grid-rows-2 items-center gap-x-2.5 bg-surface p-3.5"
                  >
                    <span
                      className={cn(
                        'row-span-2 flex size-10 shrink-0 items-center justify-center rounded-[0.75rem]',
                        item.tone
                      )}
                      aria-hidden
                    >
                      <Icon className="size-4.5" />
                    </span>
                    <dt className="col-start-2 row-start-2 truncate text-xs font-bold text-ink-muted">
                      {item.label}
                      <span className="sr-only"> · {item.hint}</span>
                    </dt>
                    <dd className="col-start-2 row-start-1 text-xl font-extrabold text-navy-900 tabular-nums">
                      {item.value}
                    </dd>
                  </div>
                )
              })}
            </dl>
          </Card>

          {/* El reporte solo aparece cuando el equipo lo publica, al cerrar el día. */}
          {report && (
            <DailyReportCard
              report={report}
              petName={stay.pet.name}
              photos={stay.photos.filter((photo) => photo.isFeatured)}
            />
          )}

          <Link
            href={`/mascotas/${stay.pet.id}/historial`}
            className="inline-flex min-h-11 items-center text-sm font-bold text-info transition-colors hover:text-navy-800"
          >
            Ver historial completo de {stay.pet.name}
          </Link>
        </div>
      </div>
    </div>
  )
}
