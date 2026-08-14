import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

import { ActivityTimeline } from '@/components/stays/activity-timeline'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { PetAvatar } from '@/components/ui/pet-avatar'
import { PhotoGrid } from '@/components/photos/photo-grid'
import { ReportForm } from '@/components/reports/report-form'
import { formatTime } from '@/lib/datetime'
import { getReportContext } from '@/server/queries/reports'
import { requireStaff } from '@/server/auth/session'

type Props = { params: Promise<{ stayId: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { stayId } = await params
  const user = await requireStaff()
  const context = await getReportContext(stayId, user.organizationId)
  return { title: context ? `Reporte de ${context.stay.pet.name}` : 'Reporte' }
}

export default async function ReportEditorPage({ params }: Props) {
  const { stayId } = await params
  const user = await requireStaff()
  const context = await getReportContext(stayId, user.organizationId)

  if (!context) notFound()

  const { stay, existing, suggestions } = context

  return (
    <div className="space-y-6">
      <Link
        href="/admin/reportes"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Reportes
      </Link>

      <header className="flex flex-wrap items-center gap-4">
        <PetAvatar name={stay.pet.name} photoUrl={stay.pet.photoUrl} size="lg" />
        <div className="min-w-0 flex-1">
          <PageHeader
            title={existing ? `Editar el reporte de ${stay.pet.name}` : `Reporte de ${stay.pet.name}`}
            description={`${stay.reservation.client.fullName} · ${stay.reservation.service.name} · entró ${formatTime(stay.checkInAt)}`}
          />
        </div>
      </header>

      <ReportForm
        stayId={stay.id}
        petName={stay.pet.name}
        isUpdate={Boolean(existing)}
        registered={suggestions.activitiesSummary}
        defaults={{
          foodIntake: existing?.foodIntake ?? 'ALL',
          waterIntake: existing?.waterIntake ?? 'NORMAL',
          energy: existing?.energy ?? 'NORMAL',
          mood: existing?.mood ?? 'HAPPY',
          walkCount: existing?.walkCount ?? suggestions.walkCount,
          restMinutes: existing?.restMinutes ?? suggestions.restMinutes,
          activitiesSummary: existing?.activitiesSummary ?? suggestions.activitiesSummary,
          caregiverNotes: existing?.caregiverNotes ?? '',
        }}
      />

      {stay.activities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Lo registrado durante el día</CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityTimeline activities={stay.activities} showInternal />
          </CardContent>
        </Card>
      )}

      {stay.photos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Fotos de la estancia</CardTitle>
          </CardHeader>
          <CardContent>
            <PhotoGrid photos={stay.photos} petName={stay.pet.name} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
