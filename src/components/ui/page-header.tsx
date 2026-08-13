import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export function PageHeader({
  title,
  description,
  action,
  className,
}: {
  title: string
  description?: string
  action?: ReactNode
  className?: string
}) {
  return (
    <header
      className={cn(
        'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
        className
      )}
    >
      <div className="space-y-1">
        <h1 className="text-xl font-semibold text-ink sm:text-2xl">{title}</h1>
        {description && <p className="text-sm text-ink-muted">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  )
}
