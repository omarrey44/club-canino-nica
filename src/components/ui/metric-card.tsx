import type { LucideIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

/**
 * KPI operativo. Sin graficos: en recepcion importa el numero y que se lea de
 * lejos, no una tendencia decorativa.
 */
export function MetricCard({
  label,
  value,
  icon: Icon,
  hint,
  emphasis = false,
}: {
  label: string
  value: number | string
  icon: LucideIcon
  hint?: string
  emphasis?: boolean
}) {
  return (
    <div
      className={cn(
        'rounded-card border bg-surface p-4 shadow-card',
        emphasis ? 'border-brand-200 bg-brand-50/60' : 'border-line'
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-ink-muted">{label}</p>
        <Icon
          className={cn('size-4', emphasis ? 'text-brand-500' : 'text-ink-subtle')}
          aria-hidden
        />
      </div>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-navy-800 tabular-nums">
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-ink-muted">{hint}</p>}
    </div>
  )
}
