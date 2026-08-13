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

/**
 * Linea de tiempo del dia.
 *
 * Es una lista ordenada de verdad (`<ol>`): para quien navega con lector de
 * pantalla, el orden cronologico es la informacion principal.
 */
export function ActivityTimeline({
  activities,
  className,
}: {
  activities: TimelineActivity[]
  className?: string
}) {
  return (
    <ol className={cn('space-y-0', className)}>
      {activities.map((activity, index) => {
        const isLast = index === activities.length - 1
        const Icon = activityIcons[activity.type]

        return (
          <li key={activity.id} className="flex gap-3">
            {/* Columna del hilo: icono + linea que conecta con el siguiente. */}
            <div className="flex flex-col items-center">
              <span
                className="flex size-10 shrink-0 items-center justify-center rounded-[0.8rem] border border-brand-100 bg-brand-50 text-brand-600"
                aria-hidden
              >
                <Icon className="size-4.5" />
              </span>
              {!isLast && <span className="w-px flex-1 bg-brand-100" aria-hidden />}
            </div>

            <div className={cn('min-w-0 flex-1', isLast ? 'pb-0' : 'pb-5')}>
              <div className="flex flex-wrap items-baseline gap-x-2">
                <p className="font-extrabold text-navy-900">{activityTypeLabels[activity.type]}</p>
                <time
                  dateTime={activity.occurredAt.toISOString()}
                  className="text-sm font-semibold text-ink-muted tabular-nums"
                >
                  {formatTime(activity.occurredAt)}
                </time>
              </div>
              {activity.description && (
                <p className="mt-1 text-sm leading-relaxed text-ink-muted">{activity.description}</p>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
