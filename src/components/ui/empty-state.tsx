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
        'flex flex-col items-center justify-center gap-3 rounded-card border border-dashed border-line-strong bg-surface px-6 py-12 text-center',
        className
      )}
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-brand-50 text-brand-500">
        <Icon className="size-6" aria-hidden />
      </span>
      <div className="space-y-1">
        <p className="font-semibold text-ink">{title}</p>
        {description && (
          <p className="mx-auto max-w-sm text-sm text-ink-muted">{description}</p>
        )}
      </div>
      {action}
    </div>
  )
}
