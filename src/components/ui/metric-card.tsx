import type { LucideIcon } from 'lucide-react'
import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import type { Route } from 'next'

import { cn } from '@/lib/utils'

/**
 * KPI operativo. Sin graficos: en recepción importa el numero y que se lea de
 * lejos, no una tendencia decorativa.
 */
export function MetricCard({
  label,
  value,
  icon: Icon,
  hint,
  emphasis = false,
  tone = 'navy',
  href,
}: {
  label: string
  value: number | string
  icon: LucideIcon
  hint?: string
  emphasis?: boolean
  tone?: 'brand' | 'navy' | 'info' | 'success' | 'warning' | 'danger'
  href?: Route
}) {
  const iconTones = {
    brand: 'bg-brand-50 text-brand-700',
    navy: 'bg-navy-50 text-navy-700',
    info: 'bg-info-soft text-info',
    success: 'bg-success-soft text-success',
    warning: 'bg-warning-soft text-warning',
    danger: 'bg-danger-soft text-danger',
  }

  const content = (
    <>
      <span
        className={cn(
          'flex size-10 shrink-0 items-center justify-center rounded-[0.8rem] sm:size-12',
          iconTones[emphasis ? 'brand' : tone]
        )}
        aria-hidden
      >
        <Icon className="size-5 sm:size-6" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-xs leading-tight font-semibold text-ink-muted sm:text-sm">
          {label}
        </span>
        <span className="mt-0.5 block text-2xl leading-none font-extrabold tracking-tight text-navy-900 tabular-nums sm:text-3xl">
          {value}
        </span>
        {hint && (
          <span className="mt-1 hidden text-xs leading-snug text-ink-muted sm:block">{hint}</span>
        )}
      </span>

      {href && <ChevronRight className="size-4 shrink-0 text-ink-muted" aria-hidden />}
    </>
  )

  const classes = cn(
    'flex min-h-24 items-center gap-3 rounded-card border bg-surface p-3 shadow-card transition-[border-color,box-shadow,background-color] sm:p-3.5',
    emphasis ? 'border-brand-300 bg-brand-50/45' : 'border-line',
    href && 'hover:border-brand-200 hover:bg-canvas-warm hover:shadow-raised'
  )

  return href ? (
    <Link href={href} className={classes}>
      {content}
    </Link>
  ) : (
    <div className={classes}>{content}</div>
  )
}
