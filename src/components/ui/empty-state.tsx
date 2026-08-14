import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

/**
 * Estado vacio con salida.
 *
 * Regla del producto: ninguna pantalla se queda en blanco. Si no hay datos,
 * se explica por que y se ofrece la accion que los genera.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon
  title: string
  description?: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'relative flex flex-col items-center justify-center gap-3.5 overflow-hidden rounded-card border border-dashed border-brand-200 bg-canvas-warm px-5 py-9 text-center sm:px-6 sm:py-12',
        className
      )}
    >
      <span className="flex size-14 items-center justify-center rounded-[1.15rem] bg-white text-brand-500 shadow-card ring-1 ring-brand-100">
        <Icon className="size-7" aria-hidden />
      </span>
      <div className="space-y-1.5">
        <p className="font-display text-lg text-navy-900">{title}</p>
        {description && (
          <p className="mx-auto max-w-md text-sm leading-relaxed text-ink-muted">{description}</p>
        )}
      </div>
      {action}
    </div>
  )
}
