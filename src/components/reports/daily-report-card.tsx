import {
  Battery,
  Droplets,
  Footprints,
  MoonStar,
  Smile,
  Utensils,
  type LucideIcon,
} from 'lucide-react'
import Image from 'next/image'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate } from '@/lib/datetime'
import {
  energyLabels,
  foodIntakeLabels,
  moodLabels,
  waterIntakeLabels,
} from '@/lib/constants/labels'
import { cn } from '@/lib/utils'
import type { EnergyLevel, FoodIntake, Mood, WaterIntake } from '@/generated/prisma/client'

export type DailyReportView = {
  reportDate: Date
  foodIntake: FoodIntake
  waterIntake: WaterIntake
  energy: EnergyLevel
  mood: Mood
  walkCount: number
  restMinutes: number
  activitiesSummary: string | null
  caregiverNotes: string | null
  author?: { fullName: string } | null
}

export type ReportPhoto = {
  id: string
  url: string
  caption: string | null
}

/**
 * Tono de cada valor.
 *
 * "Poco" o "Nada" de comida se marca en ambar, no en rojo: es informacion que
 * el propietario debe notar, pero la plataforma no diagnostica nada. Un perro
 * que come poco un dia no es una urgencia medica.
 */
const foodTone: Record<FoodIntake, 'success' | 'neutral' | 'warning'> = {
  ALL: 'success',
  MOST: 'success',
  HALF: 'neutral',
  LITTLE: 'warning',
  NONE: 'warning',
}

const levelTone: Record<'LOW' | 'NORMAL' | 'HIGH', 'success' | 'neutral' | 'warning'> = {
  LOW: 'warning',
  NORMAL: 'success',
  HIGH: 'neutral',
}

const moodTone: Record<Mood, 'success' | 'neutral' | 'warning'> = {
  HAPPY: 'success',
  CALM: 'success',
  TIRED: 'neutral',
  NERVOUS: 'warning',
}

const toneClasses = {
  success: 'bg-success-soft text-success',
  neutral: 'bg-navy-50 text-navy-600',
  warning: 'bg-warning-soft text-warning',
} as const

function Metric({
  icon: Icon,
  label,
  value,
  tone = 'neutral',
}: {
  icon: LucideIcon
  label: string
  value: string
  tone?: keyof typeof toneClasses
}) {
  return (
    <div className="rounded-card border border-line bg-surface p-4">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            'flex size-8 shrink-0 items-center justify-center rounded-[0.7rem]',
            toneClasses[tone]
          )}
          aria-hidden
        >
          <Icon className="size-4" />
        </span>
        <p className="text-sm font-semibold text-ink-muted">{label}</p>
      </div>
      <p className="mt-2 text-lg font-extrabold text-navy-900">{value}</p>
    </div>
  )
}

function formatRest(minutes: number): string {
  if (minutes === 0) return 'Sin registro'
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`
}

/** El reporte tal como lo lee el propietario. */
export function DailyReportCard({
  report,
  petName,
  photos = [],
}: {
  report: DailyReportView
  petName: string
  photos?: ReportPhoto[]
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Reporte de {petName}</CardTitle>
        <p className="text-sm text-ink-muted">
          {formatDate(report.reportDate)}
          {report.author && ` · por ${report.author.fullName}`}
        </p>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          <Metric
            icon={Utensils}
            label="Comida"
            value={foodIntakeLabels[report.foodIntake]}
            tone={foodTone[report.foodIntake]}
          />
          <Metric
            icon={Droplets}
            label="Agua"
            value={waterIntakeLabels[report.waterIntake]}
            tone={levelTone[report.waterIntake]}
          />
          <Metric
            icon={Battery}
            label="Energía"
            value={energyLabels[report.energy]}
            tone={levelTone[report.energy]}
          />
          <Metric
            icon={Smile}
            label="Ánimo"
            value={moodLabels[report.mood]}
            tone={moodTone[report.mood]}
          />
          <Metric
            icon={Footprints}
            label="Paseos"
            value={report.walkCount === 1 ? '1 paseo' : `${report.walkCount} paseos`}
          />
          <Metric icon={MoonStar} label="Descanso" value={formatRest(report.restMinutes)} />
        </div>

        {report.activitiesSummary && (
          <div className="rounded-card bg-canvas-warm p-4">
            <p className="text-sm font-bold text-navy-900">Qué hizo</p>
            <p className="mt-1 text-sm leading-relaxed text-ink-muted">
              {report.activitiesSummary}
            </p>
          </div>
        )}

        {report.caregiverNotes && (
          <div className="rounded-card border border-brand-100 bg-brand-50/50 p-4">
            <p className="text-sm font-bold text-brand-700">Del cuidador</p>
            <p className="mt-1 text-sm leading-relaxed text-ink">{report.caregiverNotes}</p>
          </div>
        )}

        {photos.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-bold text-navy-900">Fotos del día</p>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {photos.map((photo) => (
                <li key={photo.id}>
                  <div className="relative aspect-square overflow-hidden rounded-field bg-navy-50">
                    <Image
                      src={photo.url}
                      alt={photo.caption ?? `Foto de ${petName}`}
                      fill
                      sizes="(max-width: 640px) 45vw, 240px"
                      className="object-cover"
                    />
                  </div>
                  {photo.caption && (
                    <p className="mt-1 text-2xs text-ink-muted">{photo.caption}</p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
