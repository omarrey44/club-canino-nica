import { CalendarCheck, Dog, FileText, Home, LogIn, LogOut } from 'lucide-react'
import { Suspense } from 'react'
import type { Metadata } from 'next'

import { EmptyState } from '@/components/ui/empty-state'
import { MetricCard } from '@/components/ui/metric-card'
import { Skeleton } from '@/components/ui/skeleton'
import { business } from '@/config/business'
import { greeting } from '@/lib/datetime'
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
      <MetricCard label="Guarderia" value={stats.daycare} icon={Home} />
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
        <h2 className="text-base font-semibold text-ink">Mascotas actualmente en el club</h2>
        {/* FASE 4: tabla con propietario, servicio, horas y acciones rapidas. */}
        <EmptyState
          icon={Dog}
          title="Ninguna mascota en estancia"
          description="Cuando registres un check-in, la mascota aparecera aqui con sus horas y su estado."
        />
      </section>
    </div>
  )
}
