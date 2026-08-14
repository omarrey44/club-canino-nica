import { ArrowLeft, History } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

import { ActivityTimeline } from '@/components/stays/activity-timeline'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DailyReportCard } from '@/components/reports/daily-report-card'
import { PageHeader } from '@/components/ui/page-header'
import { PhotoGrid } from '@/components/photos/photo-grid'
import { StatusBadge } from '@/components/ui/status-badge'
import { business, formatCurrency } from '@/config/business'
import { formatDate, formatDateTime } from '@/lib/datetime'
import { getPastStay } from '@/server/queries/history'
import { paymentStatusLabels, paymentStatusTones } from '@/lib/constants/labels'
import { requireUser } from '@/server/auth/session'

type Props = { params: Promise<{ id: string; stayId: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { stayId } = await params
  const user = await requireUser()
  const stay = await getPastStay(stayId, user)
  return {
    title: stay ? `${stay.pet.name} · ${formatDate(stay.checkInAt)}` : 'Estancia',
  }
}

export default async function PastStayPage({ params }: Props) {
  const { id, stayId } = await params
  const user = await requireUser()
  const stay = await getPastStay(stayId, user)

  // Tambien cubre pedir una estancia que no es de esta mascota.
  if (!stay || stay.pet.id !== id) notFound()

  const sameDay =
    !stay.checkOutAt || formatDate(stay.checkInAt) === formatDate(stay.checkOutAt)

  return (
    <div className="app-section-accent space-y-4 sm:space-y-5">
      <Link
        href={`/mascotas/${stay.pet.id}/historial`}
        className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Historial de {stay.pet.name}
      </Link>

      <PageHeader
        eyebrow={stay.reservation.service.name}
        icon={History}
        title={
          sameDay
            ? formatDate(stay.checkInAt)
            : `${formatDate(stay.checkInAt)} – ${formatDate(stay.checkOutAt!)}`
        }
        description={`Código ${stay.reservation.code}`}
      />

      {stay.reports.map((report) => (
        <DailyReportCard
          key={report.id}
          report={report}
          petName={stay.pet.name}
          photos={stay.photos.filter((photo) => photo.isFeatured)}
        />
      ))}

      <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
      {stay.activities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Su día, paso a paso</CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityTimeline activities={stay.activities} />
          </CardContent>
        </Card>
      )}

      {stay.photos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Fotos</CardTitle>
          </CardHeader>
          <CardContent>
            <PhotoGrid photos={stay.photos} petName={stay.pet.name} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Detalle</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="divide-y divide-line text-sm">
            <div className="flex justify-between gap-4 py-2.5">
              <dt className="text-ink-muted">Entrada</dt>
              <dd className="text-right font-semibold text-ink">
                {formatDateTime(stay.checkInAt)}
              </dd>
            </div>
            {stay.checkOutAt && (
              <div className="flex justify-between gap-4 py-2.5">
                <dt className="text-ink-muted">Salida</dt>
                <dd className="text-right font-semibold text-ink">
                  {formatDateTime(stay.checkOutAt)}
                </dd>
              </div>
            )}
            {stay.checkOutNotes && (
              <div className="flex justify-between gap-4 py-2.5">
                <dt className="text-ink-muted">Observaciones</dt>
                <dd className="text-right font-semibold text-ink">{stay.checkOutNotes}</dd>
              </div>
            )}
            <div className="flex justify-between gap-4 py-2.5">
              <dt className="text-ink-muted">{business.billing.taxLabel}</dt>
              <dd className="text-right font-semibold text-ink tabular-nums">
                {formatCurrency(String(stay.reservation.taxes))}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4 py-2.5">
              <dt className="text-ink-muted">Total</dt>
              <dd className="flex items-center gap-2">
                <span className="font-extrabold text-navy-900 tabular-nums">
                  {formatCurrency(String(stay.reservation.total))}
                </span>
                {stay.reservation.payment && (
                  <StatusBadge tone={paymentStatusTones[stay.reservation.payment.status]}>
                    {paymentStatusLabels[stay.reservation.payment.status]}
                  </StatusBadge>
                )}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
      </div>
    </div>
  )
}
