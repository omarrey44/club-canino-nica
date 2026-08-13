'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { PawPrint } from 'lucide-react'

import { business } from '@/config/business'
import { clientNavItems } from './client-nav-items'
import { cn } from '@/lib/utils'

/**
 * Navegacion lateral en escritorio. No es la barra inferior estirada:
 * aprovecha el espacio para mostrar marca y etiquetas completas.
 */
export function ClientSidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden w-60 shrink-0 border-r border-line bg-surface md:block">
      <div className="sticky top-0 flex h-dvh flex-col gap-6 p-5">
        <Link href="/inicio" className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-field bg-brand-500 text-white">
            <PawPrint className="size-4.5" aria-hidden />
          </span>
          <span className="font-semibold text-navy-800">{business.shortName}</span>
        </Link>

        <nav aria-label="Navegacion principal">
          <ul className="space-y-0.5">
            {clientNavItems.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(`${href}/`)

              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex items-center gap-3 rounded-field px-3 py-2.5 text-sm font-medium transition-colors',
                      active
                        ? 'bg-brand-50 text-brand-700'
                        : 'text-ink-muted hover:bg-navy-50 hover:text-ink'
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
