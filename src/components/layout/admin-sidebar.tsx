'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { PawPrint } from 'lucide-react'

import { business } from '@/config/business'
import { adminNavItems } from './admin-nav-items'
import { cn } from '@/lib/utils'

function useActiveHref() {
  const pathname = usePathname()
  return (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)
}

/** Sidebar de escritorio. Navy oscuro: separa visualmente operacion de portal. */
export function AdminSidebar() {
  const isActive = useActiveHref()

  return (
    <aside className="hidden w-64 shrink-0 bg-navy-800 lg:block">
      <div className="sticky top-0 flex h-dvh flex-col gap-6 p-4">
        <Link href="/admin" className="flex items-center gap-2.5 px-2 py-1">
          <span className="flex size-9 items-center justify-center rounded-field bg-brand-500 text-white">
            <PawPrint className="size-4.5" aria-hidden />
          </span>
          <span className="text-sm font-semibold text-white">{business.shortName}</span>
        </Link>

        <nav aria-label="Navegacion del panel" className="min-h-0 flex-1 overflow-y-auto">
          <ul className="space-y-0.5">
            {adminNavItems.map(({ href, label, icon: Icon }) => {
              const active = isActive(href)

              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex items-center gap-3 rounded-field px-3 py-2.5 text-sm font-medium transition-colors',
                      active
                        ? 'bg-navy-700 text-white'
                        : 'text-navy-200 hover:bg-navy-700/60 hover:text-white'
                    )}
                  >
                    <Icon className="size-4.5" aria-hidden />
                    {label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
      </div>
    </aside>
  )
}

/**
 * En movil el sidebar se vuelve una tira horizontal fija arriba.
 * El personal usa tablet/celular de pie: una gaveta con dos toques costaria
 * mas que deslizar.
 */
export function AdminMobileNav() {
  const isActive = useActiveHref()

  return (
    <nav
      aria-label="Navegacion del panel"
      className="sticky top-0 z-30 border-b border-navy-700 bg-navy-800 lg:hidden"
    >
      <ul className="flex gap-1 overflow-x-auto px-3 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {adminNavItems.map(({ href, label, icon: Icon }) => {
          const active = isActive(href)

          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex min-h-11 items-center gap-2 rounded-pill px-3.5 text-sm font-medium whitespace-nowrap transition-colors',
                  active ? 'bg-brand-500 text-white' : 'text-navy-200 hover:bg-navy-700'
                )}
              >
                <Icon className="size-4" aria-hidden />
                {label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
