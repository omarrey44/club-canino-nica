'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { clientNavItems } from './client-nav-items'
import { cn } from '@/lib/utils'

export function MobileBottomNav() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Navegación principal"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] md:hidden"
    >
      <ul className="pointer-events-auto mx-auto flex max-w-lg items-stretch rounded-[1.4rem] border border-line/90 bg-surface/95 px-1.5 shadow-overlay backdrop-blur-xl">
        {clientNavItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`)

          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex min-h-14 flex-col items-center justify-center gap-0.5 text-[0.65rem] font-extrabold transition-colors',
                  active ? 'text-brand-700' : 'text-ink-muted'
                )}
              >
                <span className={cn('flex size-8 items-center justify-center rounded-full transition-colors', active && 'bg-brand-500 text-white shadow-[0_5px_12px_rgb(249_115_22_/_0.24)]')}>
                  <Icon className={cn('size-[1.15rem]', active && 'stroke-[2.4]')} aria-hidden />
                </span>
                {label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
