import { Check, ChevronRight, FileText } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

import { Alert } from '@/components/ui/alert'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { PetAvatar } from '@/components/ui/pet-avatar'
import { StatusBadge } from '@/components/ui/status-badge'
import { formatTime, relativeTime } from '@/lib/datetime'
import { getPendingReports, getTodayReports } from '@/server/queries/reports'
import { requireStaff } from '@/server/auth/session'

export const metadata: Metadata = { title: 'Reportes diarios' }

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ guardado?: string }>
}) {
  const user = await requireStaff()
  const { guardado } = await searchParams

  const [pending, done] = await Promise.all([
    getPendingReports(user.organizationId),
    getTodayReports(user.organizationId),
  ])

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Cierre del día"
        title="Reportes diarios"
        description="El resumen que recibe cada propietario al final del día."
      />

      {guardado && <Alert tone="success">Reporte guardado y publicado.</Alert>}

      <section className="space-y-3">
        <h2 className="text-base font-bold text-navy-900">
          Pendientes
          {pending.length > 0 && (
            <span className="ml-2 text-sm font-semibold text-ink-muted">{pending.length}</span>
          )}
        </h2>

        {pending.length === 0 ? (
          <EmptyState
            icon={Check}
            title="No hay reportes pendientes"
            description="Todas las estancias de hoy ya tienen su reporte publicado."
          />
        ) : (
          <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
            {pending.map((stay) => (
              <li key={stay.id}>
                <Link
                  href={`/admin/reportes/${stay.id}`}
                  className="flex items-center gap-3 p-4 transition-colors hover:bg-canvas"
                >
                  <PetAvatar name={stay.pet.name} photoUrl={stay.pet.photoUrl} />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold text-navy-900">{stay.pet.name}</p>
                      {stay.checkOutAt ? (
                        <StatusBadge tone="neutral">Ya salió</StatusBadge>
                      ) : (
                        <StatusBadge tone="success">En el club</StatusBadge>
                      )}
                    </div>
                    <p className="truncate text-sm text-ink-muted">
                      {stay.reservation.client.fullName}
                    </p>
                    <p className="text-sm text-ink-muted tabular-nums">
                      Entró {formatTime(stay.checkInAt)} · {stay._count.activities} registros ·{' '}
                      {stay._count.photos} fotos
                    </p>
                  </div>

                  <ChevronRight className="size-5 shrink-0 text-ink-subtle" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {done.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-base font-bold text-navy-900">Publicados hoy</h2>
          <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
            {done.map((report) => (
              <li key={report.id}>
                <Link
                  href={`/admin/reportes/${report.stayId}`}
                  className="flex items-center gap-3 p-4 transition-colors hover:bg-canvas"
                >
                  <PetAvatar
                    name={report.stay.pet.name}
                    photoUrl={report.stay.pet.photoUrl}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-ink">{report.stay.pet.name}</p>
                    <p className="text-sm text-ink-muted">
                      {report.author?.fullName ?? 'Equipo'} ·{' '}
                      {relativeTime(report.updatedAt)}
                    </p>
                  </div>
                  <FileText className="size-4 shrink-0 text-ink-subtle" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
