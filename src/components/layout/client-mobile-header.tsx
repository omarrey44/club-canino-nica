import { Bell } from 'lucide-react'
import Link from 'next/link'

import { BrandLogo } from '@/components/ui/brand-logo'
import { business } from '@/config/business'

/** Cabecera compacta para que el portal conserve identidad fuera del login. */
export function ClientMobileHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-line/80 bg-canvas/90 px-4 py-2 backdrop-blur-xl md:hidden">
      <div className="mx-auto flex max-w-lg items-center justify-between">
        <Link href="/inicio" className="flex min-h-11 items-center gap-2.5 rounded-field">
          <BrandLogo decorative sizes="40px" className="w-10 shrink-0" />
          <span>
            <span className="block font-display text-sm leading-tight text-navy-900">
              {business.shortName}
            </span>
            <span className="block text-[0.58rem] font-extrabold tracking-[0.13em] text-brand-600 uppercase">
              Portal familiar
            </span>
          </span>
        </Link>

        <Link
          href="/notificaciones"
          aria-label="Ver notificaciones"
          className="relative flex size-11 items-center justify-center rounded-full border border-line bg-surface text-navy-700 shadow-card transition-colors hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
        >
          <Bell className="size-5" aria-hidden />
        </Link>
      </div>
    </header>
  )
}
