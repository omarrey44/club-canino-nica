import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export function PageHeader({
  title,
  description,
  eyebrow,
  action,
  className,
}: {
  title: string
  description?: string
  eyebrow?: string
  action?: ReactNode
  className?: string
}) {
  return (
    <header
      className={cn(
        'flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between',
        className
      )}
    >
      <div className="space-y-1.5">
        {eyebrow && (
          <p className="text-xs font-extrabold tracking-[0.14em] text-brand-600 uppercase">
            {eyebrow}
          </p>
        )}
        <h1 className="text-2xl text-navy-900 sm:text-3xl">{title}</h1>
        {description && <p className="max-w-xl text-sm leading-relaxed text-ink-muted sm:text-base">{description}</p>}
      </div>
      {action && <div className="shrink-0 self-start sm:self-auto">{action}</div>}
    </header>
  )
}
