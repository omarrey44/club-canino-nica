'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { clientNavItems } from './client-nav-items'
import { cn } from '@/lib/utils'

export function MobileBottomNav() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Navegacion principal"
      className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur md:hidden"
    >
      <ul className="mx-auto flex max-w-lg items-stretch">
        {clientNavItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`)

          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex min-h-14 flex-col items-center justify-center gap-1 pt-2 text-2xs font-medium transition-colors',
                  active ? 'text-brand-600' : 'text-ink-muted'
                )}
              >
                <Icon
                  className={cn('size-5', active && 'stroke-[2.25]')}
                  aria-hidden
                />
                {label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
