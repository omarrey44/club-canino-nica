'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { BrandLogo } from '@/components/ui/brand-logo'
import { clientNavItems } from './client-nav-items'
import { cn } from '@/lib/utils'

/**
 * Navegacion lateral en escritorio. No es la barra inferior estirada:
 * aprovecha el espacio para mostrar marca y etiquetas completas.
 */
export function ClientSidebar() {
  const pathname = usePathname()
  const primaryItems = clientNavItems.slice(0, 4)
  const accountItems = clientNavItems.slice(4)

  function renderItems(items: typeof clientNavItems) {
    return items.map(({ href, label, icon: Icon }) => {
      const active = pathname === href || pathname.startsWith(`${href}/`)

      return (
        <li key={href}>
          <Link
            href={href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'group flex min-h-12 items-center gap-3 rounded-[0.9rem] px-3.5 py-2.5 text-sm font-bold transition-[color,background-color,transform] duration-200',
              active
                ? 'bg-brand-50 text-brand-700'
                : 'text-ink-muted hover:translate-x-0.5 hover:bg-navy-50 hover:text-navy-800'
            )}
          >
            <span
              className={cn(
                'flex size-8 items-center justify-center rounded-[0.65rem] transition-colors',
                active ? 'bg-white text-brand-600 shadow-card' : 'text-navy-500 group-hover:bg-white'
              )}
            >
              <Icon className="size-4.5" aria-hidden />
            </span>
            {label}
            {active && <span className="ml-auto size-1.5 rounded-full bg-brand-500" aria-hidden />}
          </Link>
        </li>
      )
    })
  }

  return (
    <aside className="hidden w-68 shrink-0 border-r border-line bg-surface md:block">
      <div className="sticky top-0 flex h-dvh flex-col p-5">
        <Link href="/inicio" className="mx-auto flex rounded-field" aria-label="Ir al inicio">
          <BrandLogo decorative priority sizes="160px" className="w-40" />
        </Link>

        <nav aria-label="Navegación principal" className="mt-5 flex-1">
          <div>
            <p className="px-3.5 text-[0.65rem] font-extrabold tracking-[0.15em] text-ink-subtle uppercase">Tu club</p>
            <ul className="mt-2 space-y-1">{renderItems(primaryItems)}</ul>
          </div>
          <div className="mt-7 border-t border-line pt-6">
            <p className="px-3.5 text-[0.65rem] font-extrabold tracking-[0.15em] text-ink-subtle uppercase">Tu cuenta</p>
            <ul className="mt-2 space-y-1">{renderItems(accountItems)}</ul>
          </div>
        </nav>

        <div className="rounded-card border border-brand-100 bg-canvas-warm p-4">
          <p className="text-sm font-extrabold text-navy-900">Todo sobre tu mascota</p>
          <p className="mt-1 text-xs leading-relaxed text-ink-muted">Fotos, avisos y reservas, siempre a la mano.</p>
        </div>
      </div>
    </aside>
  )
}
