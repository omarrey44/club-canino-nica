import { Bell } from 'lucide-react'
import Link from 'next/link'

import { cn } from '@/lib/utils'

/** Campana del panel. `className` ajusta el color segun el fondo de la cabecera. */
export function NotificationBell({ count, className }: { count: number; className?: string }) {
  return (
    <Link
      href="/admin/avisos"
      aria-label={count > 0 ? `Ver avisos, ${count} sin leer` : 'Ver avisos'}
      className={cn(
        'relative flex size-11 shrink-0 items-center justify-center rounded-full transition-colors',
        className
      )}
    >
      <Bell className="size-5" aria-hidden />
      {count > 0 && (
        <span className="absolute top-1 right-0.5 flex min-w-4.5 items-center justify-center rounded-full bg-brand-700 px-1 text-[0.625rem] leading-[1.125rem] font-extrabold text-white ring-2 ring-white">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </Link>
  )
}
