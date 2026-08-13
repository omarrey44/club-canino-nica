'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

import { business } from '@/config/business'
import { adminNavGroups, adminNavItems } from './admin-nav-items'
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
    <aside className="hidden w-68 shrink-0 bg-navy-900 lg:block">
      <div className="sticky top-0 flex h-dvh flex-col p-4">
        <Link href="/admin" className="flex items-center gap-3 rounded-field px-2 py-2">
          <Image src="/brand/icon.svg" width={42} height={42} alt="" className="size-10.5 rounded-[0.8rem] shadow-card" priority />
          <span>
            <span className="block font-display text-sm leading-tight text-white">{business.shortName}</span>
            <span className="block text-[0.6rem] font-extrabold tracking-[0.13em] text-brand-300 uppercase">Panel operativo</span>
          </span>
        </Link>

        <nav aria-label="Navegación del panel" className="mt-6 min-h-0 flex-1 overflow-y-auto">
          <div className="space-y-5">
            {adminNavGroups.map((group) => (
              <div key={group.label}>
                <p className="px-3 text-[0.62rem] font-extrabold tracking-[0.15em] text-navy-400 uppercase">
                  {group.label}
                </p>
                <ul className="mt-1.5 space-y-0.5">
                  {group.items.map(({ href, label, icon: Icon }) => {
                    const active = isActive(href)

                    return (
                      <li key={href}>
                        <Link
                          href={href}
                          aria-current={active ? 'page' : undefined}
                          className={cn(
                            'flex min-h-10.5 items-center gap-3 rounded-[0.8rem] px-3 py-2 text-sm font-bold transition-colors',
                            active
                              ? 'bg-white/10 text-white ring-1 ring-white/10'
                              : 'text-navy-200 hover:bg-white/[0.06] hover:text-white'
                          )}
                        >
                          <Icon className={cn('size-4.5', active && 'text-brand-300')} aria-hidden />
                          {label}
                          {active && <span className="ml-auto size-1.5 rounded-full bg-brand-400" aria-hidden />}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </div>
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
      aria-label="Navegación del panel"
      className="sticky top-0 z-30 border-b border-navy-700 bg-navy-900 shadow-raised lg:hidden"
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
