import { AlertTriangle, ArrowLeft, Phone } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

import { ActivityTimeline } from '@/components/stays/activity-timeline'
import { Alert } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PetAvatar } from '@/components/ui/pet-avatar'
import { QuickActivityForm } from '@/components/stays/quick-activity-form'
import { StatusBadge } from '@/components/ui/status-badge'
import {
  CheckOutForm,
  ReadyForPickupButton,
  StayLocationForm,
} from '@/components/stays/stay-controls'
import { formatTime, relativeTime } from '@/lib/datetime'
import { stayStatusLabels, stayStatusTones } from '@/lib/constants/labels'
import { getStayDetail } from '@/server/queries/stays'
import { requireStaff } from '@/server/auth/session'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const user = await requireStaff()
  const stay = await getStayDetail(id, user)
  return { title: stay ? `Estancia de ${stay.pet.name}` : 'Estancia' }
}

export default async function StayDetailPage({ params }: Props) {
  const { id } = await params
  const user = await requireStaff()
  const stay = await getStayDetail(id, user)

  if (!stay) notFound()

  const medical = stay.pet.medicalInfo
  const alerts = [
    medical?.allergies && `Alergias: ${medical.allergies}`,
    medical?.medications && `Medicamentos: ${medical.medications}`,
    medical?.specialNotes,
  ].filter((value): value is string => Boolean(value))

  const isOpen = stay.status === 'ACTIVE' || stay.status === 'READY_FOR_PICKUP'
  const lastActivity = stay.activities[0]

  return (
    <div className="space-y-6">
      <Link
        href="/admin/estancias"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Estancias
      </Link>

      <header className="flex flex-wrap items-center gap-4">
        <PetAvatar name={stay.pet.name} photoUrl={stay.pet.photoUrl} size="xl" />

        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-extrabold text-navy-900">{stay.pet.name}</h1>
            <StatusBadge tone={stayStatusTones[stay.status]}>
              {stayStatusLabels[stay.status]}
            </StatusBadge>
          </div>

          <p className="text-ink-muted">
            {stay.reservation.client.fullName} · {stay.reservation.service.name} ·{' '}
            {stay.reservation.code}
          </p>

          <p className="text-sm text-ink-muted tabular-nums">
            Entrada {formatTime(stay.checkInAt)} · Salida prevista{' '}
            {formatTime(stay.expectedCheckOutAt)}
            {lastActivity && ` · Último registro ${relativeTime(lastActivity.occurredAt)}`}
          </p>
        </div>

        {stay.reservation.client.phone && (
          <a
            href={`tel:${stay.reservation.client.phone}`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:underline"
          >
            <Phone className="size-4" aria-hidden />
            {stay.reservation.client.phone}
          </a>
        )}
      </header>

      {alerts.length > 0 && (
        <Alert tone="warning">
          <span className="flex items-start gap-1.5">
            <AlertTriangle className="sr-only" aria-hidden />
            <span>
              {alerts.map((alert) => (
                <span key={alert} className="block">
                  {alert}
                </span>
              ))}
            </span>
          </span>
        </Alert>
      )}

      {isOpen && (
        <Card>
          <CardHeader>
            <CardTitle>Registrar actividad</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <QuickActivityForm stayId={stay.id} />
            <div className="border-t border-line pt-4">
              <StayLocationForm stayId={stay.id} currentLocation={stay.currentLocation} />
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            El día de {stay.pet.name}
            <span className="ml-2 text-sm font-semibold text-ink-muted">
              {stay.activities.length}{' '}
              {stay.activities.length === 1 ? 'registro' : 'registros'}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stay.activities.length === 0 ? (
            <p className="text-sm text-ink-muted">
              Aún no hay registros. Usa los botones de arriba para anotar el primero.
            </p>
          ) : (
            <ActivityTimeline activities={stay.activities} showInternal />
          )}
        </CardContent>
      </Card>

      {(medical?.dietNotes || medical?.feedingSchedule) && (
        <Card>
          <CardHeader>
            <CardTitle>Alimentación</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="divide-y divide-line text-sm">
              {medical.dietNotes && (
                <div className="flex justify-between gap-4 py-2.5">
                  <dt className="text-ink-muted">Qué come</dt>
                  <dd className="text-right font-semibold text-ink">{medical.dietNotes}</dd>
                </div>
              )}
              {medical.feedingSchedule && (
                <div className="flex justify-between gap-4 py-2.5">
                  <dt className="text-ink-muted">Horario</dt>
                  <dd className="text-right font-semibold text-ink">
                    {medical.feedingSchedule}
                  </dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>
      )}

      {stay.checkInNotes && (
        <Card>
          <CardHeader>
            <CardTitle>Observaciones de llegada</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-ink-muted">{stay.checkInNotes}</p>
          </CardContent>
        </Card>
      )}

      {isOpen && (
        <div className="flex flex-wrap items-start gap-3">
          {stay.status === 'ACTIVE' && <ReadyForPickupButton stayId={stay.id} />}
          <CheckOutForm stayId={stay.id} petName={stay.pet.name} />
        </div>
      )}
    </div>
  )
}
