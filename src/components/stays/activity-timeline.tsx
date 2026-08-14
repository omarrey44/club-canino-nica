import Image from 'next/image'

import type { ActivityType } from '@/generated/prisma/client'
import {
  Bone,
  Camera,
  CircleCheckBig,
  ClipboardPen,
  Droplets,
  Footprints,
  LogOut,
  MoonStar,
  Pill,
  Sparkles,
  Utensils,
  type LucideIcon,
} from 'lucide-react'

import { activityTypeLabels } from '@/lib/constants/labels'
import { formatTime } from '@/lib/datetime'
import { cn } from '@/lib/utils'

export type TimelineActivity = {
  id: string
  type: ActivityType
  occurredAt: Date
  description: string | null
  photoUrl?: string | null
  /** Solo llega en la vista del personal; el cliente nunca ve las internas. */
  isVisibleToOwner?: boolean
  recordedBy?: { fullName: string } | null
}

const activityIcons: Record<ActivityType, LucideIcon> = {
  CHECK_IN: CircleCheckBig,
  FOOD: Utensils,
  WATER: Droplets,
  PLAY: Bone,
  WALK: Footprints,
  REST: MoonStar,
  PHOTO: Camera,
  MEDICATION: Pill,
  GROOMING: Sparkles,
  NOTE: ClipboardPen,
  CHECK_OUT: LogOut,
}

const activityTones: Record<ActivityType, string> = {
  CHECK_IN: 'border-success/10 bg-success-soft text-success',
  FOOD: 'border-warning/10 bg-warning-soft text-warning',
  WATER: 'border-info/10 bg-info-soft text-info',
  PLAY: 'border-brand-100 bg-brand-50 text-brand-700',
  WALK: 'border-success/10 bg-success-soft text-success',
  REST: 'border-navy-100 bg-navy-50 text-navy-700',
  PHOTO: 'border-info/10 bg-info-soft text-info',
  MEDICATION: 'border-brand-100 bg-brand-50 text-brand-700',
  GROOMING: 'border-warning/10 bg-warning-soft text-warning',
  NOTE: 'border-navy-100 bg-navy-50 text-navy-700',
  CHECK_OUT: 'border-brand-100 bg-brand-50 text-brand-700',
}

/**
 * Linea de tiempo del día.
 *
 * Es una lista ordenada de verdad (`<ol>`): para quien navega con lector de
 * pantalla, el orden cronologico es la información principal.
 */
export function ActivityTimeline({
  activities,
  className,
  compact = false,
  /** Vista del personal: agrega autor y marca lo que el propietario no ve. */
  showInternal = false,
}: {
  activities: TimelineActivity[]
  className?: string
  /** Resumen para tableros: conserva la información con menos altura. */
  compact?: boolean
  showInternal?: boolean
}) {
  return (
    <ol className={cn('space-y-0', className)}>
      {activities.map((activity, index) => {
        const isLast = index === activities.length - 1
        const Icon = activityIcons[activity.type]

        return (
          <li key={activity.id} className={cn('flex', compact ? 'gap-2.5' : 'gap-3')}>
            {/* Columna del hilo: icono + linea que conecta con el siguiente. */}
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  'flex shrink-0 items-center justify-center border',
                  activityTones[activity.type],
                  compact ? 'size-9 rounded-[0.7rem]' : 'size-10 rounded-[0.8rem]'
                )}
                aria-hidden
              >
                <Icon className={compact ? 'size-4' : 'size-4.5'} />
              </span>
              {!isLast && <span className="w-px flex-1 bg-line-strong" aria-hidden />}
            </div>

            <div className={cn('min-w-0 flex-1', isLast ? 'pb-0' : compact ? 'pb-3.5' : 'pb-4')}>
              <div className="flex flex-wrap items-baseline gap-x-2">
                <p className="font-extrabold text-navy-900">{activityTypeLabels[activity.type]}</p>
                <time
                  dateTime={activity.occurredAt.toISOString()}
                  className="text-sm font-semibold text-ink-muted tabular-nums"
                >
                  {formatTime(activity.occurredAt)}
                </time>
                {showInternal && activity.isVisibleToOwner === false && (
                  <span className="rounded-pill bg-navy-100 px-2 py-0.5 text-2xs font-bold text-navy-600">
                    Solo interno
                  </span>
                )}
              </div>

              {activity.description && (
                <p className={cn('text-sm text-ink-muted', compact ? 'mt-0.5 leading-snug' : 'mt-1 leading-relaxed')}>{activity.description}</p>
              )}

              {activity.photoUrl && (
                <div className={cn(
                  'relative mt-2 overflow-hidden rounded-field bg-navy-50',
                  compact ? 'aspect-video max-w-48' : 'aspect-[4/3] max-w-64'
                )}>
                  <Image
                    src={activity.photoUrl}
                    alt={activity.description ?? activityTypeLabels[activity.type]}
                    fill
                    sizes="(max-width: 640px) 90vw, 320px"
                    className="object-cover"
                  />
                </div>
              )}

              {showInternal && activity.recordedBy && (
                <p className="mt-1 text-2xs text-ink-subtle">
                  Registrado por {activity.recordedBy.fullName}
                </p>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
