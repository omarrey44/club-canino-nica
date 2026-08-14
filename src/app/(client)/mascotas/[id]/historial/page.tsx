import { ArrowLeft, CalendarClock, ChevronRight, Images, FileText } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { StatusBadge } from '@/components/ui/status-badge'
import { formatCurrency } from '@/config/business'
import { formatDate } from '@/lib/datetime'
import { getPetHistory } from '@/server/queries/history'
import { getPetDetail } from '@/server/queries/pets'
import { paymentStatusLabels, paymentStatusTones } from '@/lib/constants/labels'
import { requireUser } from '@/server/auth/session'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const user = await requireUser()
  const pet = await getPetDetail(id, user)
  return { title: pet ? `Historial de ${pet.name}` : 'Historial' }
}

export default async function PetHistoryPage({ params }: Props) {
  const { id } = await params
  const user = await requireUser()

  const [pet, history] = await Promise.all([getPetDetail(id, user), getPetHistory(id, user)])
  if (!pet) notFound()

  return (
    <div className="space-y-6">
      <Link
        href={`/mascotas/${pet.id}`}
        className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {pet.name}
      </Link>

      <PageHeader
        eyebrow="Historial"
        title={`Estancias de ${pet.name}`}
        description="Cada visita, con sus actividades, fotos y reporte."
      />

      {history.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="Todavía no hay estancias finalizadas"
          description={`Cuando ${pet.name} termine su primera visita, quedará guardada aquí con todo lo que hizo.`}
        />
      ) : (
        <ul className="space-y-3">
          {history.map((stay) => {
            const sameDay =
              !stay.checkOutAt || formatDate(stay.checkInAt) === formatDate(stay.checkOutAt)

            return (
              <li key={stay.id}>
                <Link
                  href={`/mascotas/${pet.id}/historial/${stay.id}`}
                  className="flex items-center gap-3.5 rounded-card border border-line bg-surface p-4 shadow-card transition-colors hover:border-line-strong"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold text-navy-900">
                        {sameDay
                          ? formatDate(stay.checkInAt)
                          : `${formatDate(stay.checkInAt)} – ${formatDate(stay.checkOutAt!)}`}
                      </p>
                      <StatusBadge tone={stay.status === 'COMPLETED' ? 'neutral' : 'danger'}>
                        {stay.status === 'COMPLETED' ? 'Completada' : 'Cancelada'}
                      </StatusBadge>
                    </div>

                    <p className="text-sm text-ink-muted">
                      {stay.reservation.service.name} · {stay.reservation.code}
                    </p>

                    <p className="flex flex-wrap items-center gap-x-3 text-sm text-ink-muted">
                      <span>{stay._count.activities} actividades</span>
                      {stay._count.photos > 0 && (
                        <span className="inline-flex items-center gap-1">
                          <Images className="size-3.5" aria-hidden />
                          {stay._count.photos}
                        </span>
                      )}
                      {stay.reports.length > 0 && (
                        <span className="inline-flex items-center gap-1 text-brand-700">
                          <FileText className="size-3.5" aria-hidden />
                          Con reporte
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="shrink-0 space-y-1 text-right">
                    <p className="font-bold text-navy-900 tabular-nums">
                      {formatCurrency(String(stay.reservation.total))}
                    </p>
                    {stay.reservation.payment && (
                      <StatusBadge
                        tone={paymentStatusTones[stay.reservation.payment.status]}
                        showDot={false}
                      >
                        {paymentStatusLabels[stay.reservation.payment.status]}
                      </StatusBadge>
                    )}
                  </div>

                  <ChevronRight className="size-5 shrink-0 text-ink-subtle" aria-hidden />
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
