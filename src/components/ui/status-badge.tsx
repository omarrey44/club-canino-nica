import { cn } from '@/lib/utils'
import type { Tone } from '@/lib/constants/labels'

const toneClasses: Record<Tone, string> = {
  neutral: 'bg-navy-50 text-navy-600',
  info: 'bg-info-soft text-info',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
  brand: 'bg-brand-50 text-brand-700',
}

const dotClasses: Record<Tone, string> = {
  neutral: 'bg-navy-400',
  info: 'bg-info',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  brand: 'bg-brand-500',
}

/**
 * Estado en texto + punto de color.
 *
 * El punto nunca va solo: el color no puede ser el unico portador de la
 * informacion para quien no distingue matices.
 */
export function StatusBadge({
  tone = 'neutral',
  children,
  showDot = true,
  className,
}: {
  tone?: Tone
  children: React.ReactNode
  showDot?: boolean
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-pill border border-current/10 px-2.5 py-1 text-xs font-bold',
        toneClasses[tone],
        className
      )}
    >
      {showDot && <span className={cn('size-1.5 rounded-full', dotClasses[tone])} aria-hidden />}
      {children}
    </span>
  )
}
