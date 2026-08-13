import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react'
import type { ComponentType } from 'react'

import { cn } from '@/lib/utils'

type AlertTone = 'info' | 'success' | 'warning' | 'danger'

const config: Record<AlertTone, { icon: ComponentType<{ className?: string }>; classes: string }> = {
  info: { icon: Info, classes: 'bg-info-soft text-info' },
  success: { icon: CheckCircle2, classes: 'bg-success-soft text-success' },
  warning: { icon: AlertTriangle, classes: 'bg-warning-soft text-warning' },
  danger: { icon: XCircle, classes: 'bg-danger-soft text-danger' },
}

export function Alert({
  tone = 'info',
  children,
  className,
}: {
  tone?: AlertTone
  children: React.ReactNode
  className?: string
}) {
  const { icon: Icon, classes } = config[tone]

  return (
    <div
      // `alert` para errores (se anuncia de inmediato), `status` para el resto.
      role={tone === 'danger' ? 'alert' : 'status'}
      className={cn('flex items-start gap-2.5 rounded-field p-3 text-sm', classes, className)}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="flex-1">{children}</div>
    </div>
  )
}
