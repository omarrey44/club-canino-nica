import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export function PageHeader({
  title,
  description,
  eyebrow,
  icon: Icon,
  action,
  className,
}: {
  title: string
  description?: string
  eyebrow?: string
  icon?: LucideIcon
  action?: ReactNode
  className?: string
}) {
  return (
    <header
      className={cn(
        'flex flex-col gap-2.5 sm:flex-row sm:items-end sm:justify-between',
        className
      )}
    >
      <div className="min-w-0 space-y-1">
        {eyebrow && (
          <div className="flex items-center gap-2 text-xs font-extrabold tracking-[0.13em] text-brand-700 uppercase">
            {Icon && (
              <span className="flex size-6 items-center justify-center rounded-[0.45rem] bg-brand-50 text-brand-700" aria-hidden>
                <Icon className="size-3.5" />
              </span>
            )}
            <span>{eyebrow}</span>
          </div>
        )}
        <h1 className="text-2xl leading-tight text-navy-900 sm:text-[2rem]">{title}</h1>
        {description && <p className="max-w-xl text-sm leading-snug text-ink-muted sm:text-base">{description}</p>}
      </div>
      {action && <div className="shrink-0 self-start sm:self-auto">{action}</div>}
    </header>
  )
}
