import { CalendarCheck, Dog, FileText, Home, LogIn, LogOut } from 'lucide-react'
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
import { formatTime, greeting } from '@/lib/datetime'
import { stayStatusLabels, stayStatusTones } from '@/lib/constants/labels'
import { getActiveStays } from '@/server/queries/stays'
import { getAdminDashboardStats } from '@/server/queries/admin-dashboard'
import { requireStaff } from '@/server/auth/session'

export const metadata: Metadata = { title: 'Panel' }

async function TodayMetrics() {
  const user = await requireStaff()
  const stats = await getAdminDashboardStats(user.organizationId)

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
      <MetricCard
        label="Mascotas presentes"
        value={stats.petsPresent}
        icon={Dog}
        emphasis
      />
      <MetricCard label="Guardería" value={stats.daycare} icon={Home} />
      <MetricCard label="Hospedaje" value={stats.boarding} icon={CalendarCheck} />
      <MetricCard
        label="Entradas pendientes"
        value={stats.pendingCheckIns}
        icon={LogIn}
        hint="Reservaciones confirmadas para hoy"
      />
      <MetricCard
        label="Salidas pendientes"
        value={stats.pendingCheckOuts}
        icon={LogOut}
        hint="Estancias que terminan hoy"
      />
      <MetricCard
        label="Reportes pendientes"
        value={stats.pendingReports}
        icon={FileText}
        hint="Estancias de hoy sin reporte"
      />
    </div>
  )
}

function MetricsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
      {Array.from({ length: 6 }, (_, index) => (
        <Skeleton key={index} className="h-28 rounded-card" />
      ))}
    </div>
  )
}

/** Quien esta en el club ahora, con la ficha de estancia a un toque. */
async function CurrentStays() {
  const user = await requireStaff()
  const stays = await getActiveStays(user.organizationId)

  if (stays.length === 0) {
    return (
      <EmptyState
        icon={Dog}
        title="Ninguna mascota en estancia"
        description="Cuando registres un check-in, la mascota aparecera aquí con sus horas y su estado."
        action={
          <LinkButton size="sm" href="/admin/check-in">
            Ir a check-in
          </LinkButton>
        }
      />
    )
  }

  return (
    <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
      {stays.map((stay) => (
        <li key={stay.id}>
          <Link
            href={`/admin/estancias/${stay.id}`}
            className="flex items-center gap-3 p-4 transition-colors hover:bg-canvas"
          >
            <PetAvatar name={stay.pet.name} photoUrl={stay.pet.photoUrl} />

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-bold text-navy-900">{stay.pet.name}</p>
                <StatusBadge tone={stayStatusTones[stay.status]}>
                  {stayStatusLabels[stay.status]}
                </StatusBadge>
              </div>
              <p className="truncate text-sm text-ink-muted">
                {stay.reservation.client.fullName} · {stay.reservation.service.name}
              </p>
            </div>

            <div className="shrink-0 text-right text-sm text-ink-muted tabular-nums">
              <p>{formatTime(stay.checkInAt)}</p>
              <p>{formatTime(stay.expectedCheckOutAt)}</p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  )
}

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-navy-800">{greeting()}</h1>
        <p className="text-ink-muted">Esto esta ocurriendo hoy en {business.name}.</p>
      </header>

      {/* Los KPIs consultan la base; el resto de la pantalla no espera por ellos. */}
      <Suspense fallback={<MetricsSkeleton />}>
        <TodayMetrics />
      </Suspense>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-ink">Mascotas actualmente en el club</h2>
          <LinkButton size="sm" variant="outline" href="/admin/check-in">
            <LogIn aria-hidden />
            Check-in
          </LinkButton>
        </div>

        <Suspense fallback={<Skeleton className="h-40 rounded-card" />}>
          <CurrentStays />
        </Suspense>
      </section>
    </div>
  )
}
