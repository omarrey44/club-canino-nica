import {
  CalendarCheck,
  CalendarDays,
  Camera,
  ChevronRight,
  Clock3,
  Dog,
  Droplets,
  FileText,
  Footprints,
  Gamepad2,
  House,
  LogIn,
  LogOut,
  MessageSquareText,
  MoonStar,
  MoreHorizontal,
  PawPrint,
  Pill,
  Sparkles,
  Sun,
  TreePine,
  Utensils,
  type LucideIcon,
} from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'
import type { Metadata } from 'next'

import { EmptyState } from '@/components/ui/empty-state'
import { LinkButton } from '@/components/ui/button'
import { MetricCard } from '@/components/ui/metric-card'
import { PetAvatar } from '@/components/ui/pet-avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/ui/status-badge'
import { business } from '@/config/business'
import { activityTypeLabels, stayStatusLabels, stayStatusTones } from '@/lib/constants/labels'
import { CheckOutTime } from '@/components/stays/check-out-time'
import { formatTime, greeting } from '@/lib/datetime'
import { cn } from '@/lib/utils'
import {
  getAdminDashboardStats,
  getRecentAdminActivity,
  type AdminDashboardStats,
  type RecentAdminActivity,
} from '@/server/queries/admin-dashboard'
import { getActiveStays, type ActiveStayRow } from '@/server/queries/stays'
import { requireStaff } from '@/server/auth/session'
import type { ActivityType } from '@/generated/prisma/client'

export const metadata: Metadata = { title: 'Panel' }

const activityIcons: Record<ActivityType, LucideIcon> = {
  CHECK_IN: LogIn,
  FOOD: Utensils,
  WATER: Droplets,
  PLAY: Gamepad2,
  WALK: Footprints,
  REST: MoonStar,
  PHOTO: Camera,
  MEDICATION: Pill,
  GROOMING: Sparkles,
  NOTE: MessageSquareText,
  CHECK_OUT: LogOut,
}

const activityIconTones: Record<ActivityType, string> = {
  CHECK_IN: 'bg-success-soft text-success',
  FOOD: 'bg-warning-soft text-warning',
  WATER: 'bg-info-soft text-info',
  PLAY: 'bg-brand-50 text-brand-700',
  WALK: 'bg-success-soft text-success',
  REST: 'bg-navy-50 text-navy-700',
  PHOTO: 'bg-info-soft text-info',
  MEDICATION: 'bg-brand-50 text-brand-700',
  GROOMING: 'bg-warning-soft text-warning',
  NOTE: 'bg-navy-50 text-navy-700',
  CHECK_OUT: 'bg-brand-50 text-brand-700',
}

function WelcomeBanner() {
  return (
    <section className="relative overflow-hidden rounded-card border border-line bg-surface px-4 py-4 shadow-card sm:px-6 sm:py-4 lg:min-h-28 lg:px-8">
      <div className="relative z-10 flex items-center gap-4 sm:gap-5">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-full border border-brand-300 bg-brand-50 text-brand-700 sm:size-16">
          <Dog className="size-7 sm:size-8" aria-hidden />
        </span>

        <div>
          <p className="text-2xs font-extrabold tracking-[0.2em] text-brand-700 uppercase">
            Resumen operativo
          </p>
          <div className="mt-1 flex items-center gap-2">
            <h1 className="text-2xl leading-tight text-navy-900 sm:text-3xl lg:text-4xl">
              {greeting()}
            </h1>
            <Sun className="size-6 text-brand-500 sm:size-7" aria-hidden />
          </div>
          <p className="mt-1 text-sm text-ink-muted sm:text-base">
            Esto está ocurriendo hoy en {business.name}.
          </p>
        </div>
      </div>

      <div
        className="absolute inset-y-0 right-0 hidden w-[38%] overflow-hidden bg-brand-50/55 lg:block"
        aria-hidden
      >
        <Sun className="absolute top-4 right-12 size-8 text-brand-200" />
        <TreePine className="absolute right-42 bottom-3 size-14 text-brand-200" />
        <House className="absolute right-20 bottom-2 size-20 text-brand-300" strokeWidth={1.35} />
        <PawPrint className="absolute -right-5 -bottom-8 size-28 rotate-[-14deg] text-brand-100" />
      </div>
    </section>
  )
}

function MetricsGrid({ stats }: { stats: AdminDashboardStats }) {
  return (
    <section aria-label="Indicadores de hoy" className="grid grid-cols-2 gap-3 lg:grid-cols-3">
      <MetricCard
        label="Mascotas presentes"
        value={stats.petsPresent}
        icon={Dog}
        hint="Perritos en el club ahora"
        emphasis
      />
      <MetricCard
        label="Guardería"
        value={stats.daycare}
        icon={House}
        hint="En guardería de día"
        tone="info"
      />
      <MetricCard
        label="Hospedaje"
        value={stats.boarding}
        icon={CalendarCheck}
        hint="En hospedaje"
        tone="navy"
      />
      <MetricCard
        label="Entradas pendientes"
        value={stats.pendingCheckIns}
        icon={LogIn}
        hint="Reservaciones confirmadas para hoy"
        tone="success"
        href="/admin/check-in"
      />
      <MetricCard
        label="Salidas pendientes"
        value={stats.pendingCheckOuts}
        icon={LogOut}
        hint={
          stats.overdueCheckOuts > 0
            ? `${stats.overdueCheckOuts} con la salida atrasada`
            : 'Estancias que terminan hoy'
        }
        tone={stats.overdueCheckOuts > 0 ? 'danger' : 'warning'}
        href="/admin/estancias"
      />
      <MetricCard
        label="Reportes pendientes"
        value={stats.pendingReports}
        icon={FileText}
        hint="Estancias de hoy sin reporte"
        tone="info"
        href="/admin/reportes"
      />
    </section>
  )
}

function MobileStayList({ stays }: { stays: ActiveStayRow[] }) {
  return (
    <ul className="divide-y divide-line md:hidden">
      {stays.map((stay) => (
        <li key={stay.id}>
          <Link
            href={`/admin/estancias/${stay.id}`}
            className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-canvas"
          >
            <PetAvatar name={stay.pet.name} photoUrl={stay.pet.photoUrl} size="sm" />
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-navy-900">{stay.pet.name}</span>
                <StatusBadge tone={stayStatusTones[stay.status]}>
                  {stayStatusLabels[stay.status]}
                </StatusBadge>
              </span>
              <span className="mt-0.5 block truncate text-xs text-ink-muted">
                {stay.reservation.client.fullName} · {stay.reservation.service.name}
              </span>
              <span className="mt-1 flex gap-3 text-xs text-ink-muted tabular-nums">
                <span>Entrada {formatTime(stay.checkInAt)}</span>
                <span>
                  Salida <CheckOutTime date={stay.expectedCheckOutAt} />
                </span>
              </span>
            </span>
            <ChevronRight className="size-4 shrink-0 text-ink-muted" aria-hidden />
          </Link>
        </li>
      ))}
    </ul>
  )
}

function DesktopStayTable({ stays }: { stays: ActiveStayRow[] }) {
  return (
    <div className="hidden md:block">
      <table className="w-full table-fixed text-left">
        <thead>
          <tr className="border-b border-line text-xs font-bold text-ink-muted">
            <th className="w-[25%] px-5 py-3">Mascota</th>
            <th className="w-[17%] px-3 py-3">Estado</th>
            <th className="w-[21%] px-3 py-3">Servicio</th>
            <th className="w-[14%] px-3 py-3">Entrada</th>
            <th className="w-[16%] px-3 py-3">Salida</th>
            <th className="w-[7%] px-3 py-3 text-center">Acción</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {stays.map((stay) => (
            <tr key={stay.id} className="transition-colors hover:bg-canvas/70">
              <td className="px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <PetAvatar name={stay.pet.name} photoUrl={stay.pet.photoUrl} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate font-bold text-navy-900">{stay.pet.name}</p>
                    <p className="truncate text-xs text-ink-muted">
                      {stay.reservation.client.fullName}
                    </p>
                  </div>
                </div>
              </td>
              <td className="px-3 py-3.5">
                <StatusBadge tone={stayStatusTones[stay.status]}>
                  {stayStatusLabels[stay.status]}
                </StatusBadge>
              </td>
              <td className="px-3 py-3.5 text-sm text-ink-muted">
                <span className="flex items-center gap-2">
                  <House className="size-4 shrink-0 text-info" aria-hidden />
                  <span className="truncate">{stay.reservation.service.name}</span>
                </span>
              </td>
              <td className="px-3 py-3.5 text-sm text-ink-muted tabular-nums">
                <span className="flex items-center gap-1.5">
                  <Clock3 className="size-4 shrink-0" aria-hidden />
                  {formatTime(stay.checkInAt)}
                </span>
              </td>
              <td className="px-3 py-3.5 text-sm text-ink-muted tabular-nums">
                <CheckOutTime date={stay.expectedCheckOutAt} />
              </td>
              <td className="px-3 py-3.5 text-center">
                <Link
                  href={`/admin/estancias/${stay.id}`}
                  aria-label={`Abrir estancia de ${stay.pet.name}`}
                  className="inline-flex size-11 items-center justify-center rounded-field border border-line text-navy-700 transition-colors hover:border-navy-300 hover:bg-navy-50"
                >
                  <MoreHorizontal className="size-5" aria-hidden />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function CurrentStays({ stays }: { stays: ActiveStayRow[] }) {
  return (
    <section className="overflow-hidden rounded-card border border-line bg-surface shadow-card">
      <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3.5 sm:px-5">
        <div>
          <h2 className="text-base text-navy-900 sm:text-lg">Mascotas actualmente en el club</h2>
          <p className="mt-0.5 text-xs text-ink-muted">Estado y horario de cada estancia activa.</p>
        </div>
        <LinkButton size="sm" href="/admin/check-in">
          <LogIn aria-hidden />
          {/* En movil solo cabe el icono, pero el nombre accesible no puede
              desaparecer con la etiqueta: `sr-only` en vez de `hidden`. */}
          <span className="sr-only sm:not-sr-only">Check-in</span>
        </LinkButton>
      </header>

      {stays.length === 0 ? (
        <EmptyState
          icon={Dog}
          title="Ninguna mascota en estancia"
          description="Cuando registres un check-in, aparecerá aquí con sus horas y estado."
          action={
            <LinkButton size="sm" href="/admin/check-in">
              Ir a check-in
            </LinkButton>
          }
        />
      ) : (
        <>
          <MobileStayList stays={stays} />
          <DesktopStayTable stays={stays} />
          <footer className="flex items-center gap-2 border-t border-line px-4 py-3 text-xs text-ink-muted sm:px-5">
            <PawPrint className="size-4" aria-hidden />
            Mostrando {stays.length} {stays.length === 1 ? 'mascota' : 'mascotas'} en el club
          </footer>
        </>
      )}
    </section>
  )
}

function RecentActivityPanel({ activities }: { activities: RecentAdminActivity[] }) {
  return (
    <section className="overflow-hidden rounded-card border border-line bg-surface shadow-card">
      <header className="border-b border-line px-4 py-3">
        <h2 className="text-base text-navy-900">Actividad reciente</h2>
      </header>

      {activities.length === 0 ? (
        <p className="px-4 py-6 text-sm text-ink-muted">Aún no hay movimientos registrados.</p>
      ) : (
        <ul className="divide-y divide-line">
          {activities.map((activity) => {
            const Icon = activityIcons[activity.type]
            return (
              <li key={activity.id}>
                <Link
                  href={`/admin/estancias/${activity.stayId}`}
                  className="flex min-h-16 items-center gap-3 px-4 py-2.5 transition-colors hover:bg-canvas"
                >
                  <span
                    className={cn(
                      'flex size-9 shrink-0 items-center justify-center rounded-full',
                      activityIconTones[activity.type]
                    )}
                    aria-hidden
                  >
                    <Icon className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-navy-900">
                      {activityTypeLabels[activity.type]}
                    </span>
                    <span className="block truncate text-xs text-ink-muted">
                      {activity.pet.name}
                      {activity.description ? ` · ${activity.description}` : ''}
                    </span>
                  </span>
                  <time className="shrink-0 text-2xs text-ink-muted tabular-nums">
                    {formatTime(activity.occurredAt)}
                  </time>
                </Link>
              </li>
            )
          })}
        </ul>
      )}

      <Link
        href="/admin/estancias"
        className="flex min-h-11 items-center justify-between border-t border-line px-4 text-xs font-bold text-info transition-colors hover:bg-info-soft"
      >
        Ver todas las estancias
        <ChevronRight className="size-4" aria-hidden />
      </Link>
    </section>
  )
}

function TodaySummary({ stats }: { stats: AdminDashboardStats }) {
  const rows = [
    ['Reservaciones del día', stats.totalReservations],
    ['Estancias activas', stats.petsPresent],
    ['Salidas pendientes', stats.pendingCheckOuts],
  ] as const

  return (
    <section className="rounded-card border border-line bg-surface px-4 py-3 shadow-card">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold text-navy-900">Resumen de hoy</h2>
        <CalendarDays className="size-4 text-ink-muted" aria-hidden />
      </div>
      <dl className="space-y-1.5">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-4 text-xs">
            <dt className="text-ink-muted">{label}</dt>
            <dd className="font-extrabold text-navy-900 tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

async function DashboardContent() {
  const user = await requireStaff()
  const [stats, stays, activities] = await Promise.all([
    getAdminDashboardStats(user.organizationId),
    getActiveStays(user.organizationId),
    getRecentAdminActivity(user.organizationId),
  ])

  return (
    <>
      <MetricsGrid stats={stats} />
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <CurrentStays stays={stays} />
        <aside className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
          <RecentActivityPanel activities={activities} />
          <TodaySummary stats={stats} />
        </aside>
      </div>
    </>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4" aria-label="Cargando dashboard">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-24 rounded-card sm:h-28" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <Skeleton className="h-72 rounded-card" />
        <Skeleton className="h-72 rounded-card" />
      </div>
    </div>
  )
}

export default function AdminDashboardPage() {
  return (
    <div className="space-y-4">
      <WelcomeBanner />
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  )
}
