import type { ActivityType } from '@/generated/prisma/client'
import { activityTypeIcons, activityTypeLabels } from '@/lib/constants/labels'
import { formatTime } from '@/lib/datetime'
import { cn } from '@/lib/utils'

export type TimelineActivity = {
  id: string
  type: ActivityType
  occurredAt: Date
  description: string | null
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

        return (
          <li key={activity.id} className="flex gap-3">
            {/* Columna del hilo: icono + linea que conecta con el siguiente. */}
            <div className="flex flex-col items-center">
              <span
                className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-base"
                aria-hidden
              >
                {activityTypeIcons[activity.type]}
              </span>
              {!isLast && <span className="w-px flex-1 bg-line" aria-hidden />}
            </div>

            <div className={cn('min-w-0 flex-1', isLast ? 'pb-0' : 'pb-5')}>
              <div className="flex flex-wrap items-baseline gap-x-2">
                <p className="font-medium text-ink">{activityTypeLabels[activity.type]}</p>
                <time
                  dateTime={activity.occurredAt.toISOString()}
                  className="text-sm text-ink-muted tabular-nums"
                >
                  {formatTime(activity.occurredAt)}
                </time>
              </div>
              {activity.description && (
                <p className="mt-0.5 text-sm text-ink-muted">{activity.description}</p>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
