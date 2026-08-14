import { Bell } from 'lucide-react'
import Link from 'next/link'

import { BrandLogo } from '@/components/ui/brand-logo'
import { business } from '@/config/business'

/** Cabecera compacta para que el portal conserve identidad fuera del login. */
export function ClientMobileHeader({
  fullName,
  unreadCount,
}: {
  fullName: string
  unreadCount: number
}) {
  const initials = fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

  return (
    <header className="sticky top-0 z-30 border-b border-line/80 bg-canvas/90 px-4 pt-[calc(env(safe-area-inset-top)+0.5rem)] pb-2 backdrop-blur-xl md:hidden">
      <div className="mx-auto flex max-w-lg items-center justify-between">
        <Link href="/inicio" className="flex min-h-11 items-center gap-2.5 rounded-field">
          <BrandLogo decorative sizes="40px" className="w-10 shrink-0" />
          <span>
            <span className="block font-display text-sm leading-tight text-navy-900">
              {business.shortName}
            </span>
            <span className="block text-xs font-extrabold tracking-[0.1em] text-brand-700 uppercase">
              Portal familiar
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-1">
          <Link
            href="/notificaciones"
            aria-label={
              unreadCount > 0
                ? `Ver notificaciones, ${unreadCount} sin leer`
                : 'Ver notificaciones'
            }
            className="relative flex size-11 items-center justify-center rounded-full text-navy-700 transition-colors hover:bg-brand-50 hover:text-brand-700"
          >
            <Bell className="size-5" aria-hidden />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex min-w-4 items-center justify-center rounded-full bg-brand-700 px-1 text-[0.6rem] leading-4 font-extrabold text-white ring-2 ring-canvas">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>
          <Link
            href="/perfil"
            aria-label={`Abrir perfil de ${fullName}`}
            className="flex size-11 items-center justify-center rounded-full bg-navy-800 text-xs font-extrabold text-white shadow-card"
          >
            {initials}
          </Link>
        </div>
      </div>
    </header>
  )
}
