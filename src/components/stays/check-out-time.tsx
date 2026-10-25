import { StatusBadge } from '@/components/ui/status-badge'
import { formatTimeOrDate, isPast } from '@/lib/datetime'

/**
 * Salida prevista para el personal. Si ya paso, lo dice: una estancia que nadie
 * cerro no debe verse igual que una que termina mas tarde.
 */
export function CheckOutTime({ date }: { date: Date }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-x-1.5 gap-y-1">
      {formatTimeOrDate(date)}
      {isPast(date) && <StatusBadge tone="danger">Atrasada</StatusBadge>}
    </span>
  )
}
