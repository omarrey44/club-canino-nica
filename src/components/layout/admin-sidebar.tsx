'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'

import { BrandLogo } from '@/components/ui/brand-logo'
import { adminNavGroupsFor, adminNavItems } from './admin-nav-items'
import type { Role } from '@/generated/prisma/client'
import { roleLabels } from '@/lib/constants/labels'
import { cn } from '@/lib/utils'

function useActiveHref() {
  const pathname = usePathname()
  return (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)
}

/** Sidebar de escritorio. Navy oscuro: separa visualmente operacion de portal. */
export function AdminSidebar({ role }: { role: Role }) {
  const isActive = useActiveHref()
  const navGroups = adminNavGroupsFor(role)

  return (
    <aside className="hidden w-64 shrink-0 bg-navy-900 lg:block">
      <div className="sticky top-0 flex h-dvh flex-col p-4">
        <Link href="/admin" className="mx-auto flex rounded-field" aria-label="Ir al dashboard">
          <BrandLogo decorative priority sizes="128px" className="w-32" />
        </Link>

        <nav aria-label="Navegación del panel" className="mt-2 min-h-0 flex-1 overflow-y-auto">
          <div className="space-y-4">
            {navGroups.map((group) => (
              <div key={group.label}>
                <p className="px-3 text-2xs font-extrabold tracking-[0.14em] text-navy-300 uppercase">
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
 * En móvil la navegación usa una gaveta: 11 destinos en una tira horizontal
 * escondían módulos y obligaban a deslizar sin saber qué faltaba.
 */
export function AdminMobileNav({
  userName,
  role,
  footer,
}: {
  userName: string
  role: Role
  footer: ReactNode
}) {
  const isActive = useActiveHref()
  const navGroups = adminNavGroupsFor(role)
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLElement>(null)
  const previousPathname = useRef(pathname)
  const current = [...adminNavItems]
    .sort((a, b) => String(b.href).length - String(a.href).length)
    .find(({ href }) =>
      href === '/admin' ? pathname === '/admin' : pathname.startsWith(`${href}/`) || pathname === href
    )

  function closeMenu() {
    setMenuOpen(false)
  }

  useEffect(() => {
    if (previousPathname.current !== pathname) {
      closeMenu()
      previousPathname.current = pathname
    }
  }, [pathname])

  useEffect(() => {
    if (!menuOpen) return

    const trigger = triggerRef.current
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const focusable = panelRef.current?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])'
    )
    focusable?.[0]?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeMenu()
        return
      }

      if (event.key !== 'Tab' || !focusable?.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
      trigger?.focus()
    }
  }, [menuOpen])

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-navy-700 bg-navy-900 px-3 pt-[calc(env(safe-area-inset-top)+0.375rem)] pb-1.5 text-white shadow-raised lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/admin"
            aria-label="Ir al dashboard"
            className="flex min-h-11 min-w-0 items-center gap-2.5 rounded-field"
          >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-[0.75rem] bg-white">
            <BrandLogo decorative sizes="36px" className="w-9" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-xs font-bold text-navy-300">Panel administrativo</span>
            <span className="block truncate text-sm font-extrabold text-white">{current?.label ?? 'Dashboard'}</span>
          </span>
        </Link>
        <button
          ref={triggerRef}
          type="button"
          aria-label="Abrir menú de navegación"
          aria-haspopup="dialog"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(true)}
          className="flex size-11 shrink-0 items-center justify-center rounded-field border border-white/15 bg-white/10 text-white transition-colors hover:bg-white/15"
        >
          <Menu className="size-5" aria-hidden />
        </button>
        </div>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            tabIndex={-1}
            aria-label="Cerrar menú"
            onClick={closeMenu}
            className="mobile-drawer-backdrop absolute inset-0 bg-navy-900/65 backdrop-blur-[3px]"
          />
          <aside
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-mobile-menu-title"
            className="mobile-drawer relative flex h-dvh w-[min(88vw,22rem)] flex-col overflow-hidden bg-navy-900 text-white shadow-overlay"
          >
          <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 pt-[calc(env(safe-area-inset-top)+1rem)] pb-4">
            <Link href="/admin" onClick={closeMenu} className="flex items-center gap-3 rounded-field">
              <span className="flex size-11 items-center justify-center rounded-[0.8rem] bg-white">
                <BrandLogo decorative sizes="40px" className="w-10" />
              </span>
              <span>
                <span id="admin-mobile-menu-title" className="block font-display text-base text-white">Club Canino Nica</span>
                <span className="block text-xs font-bold text-navy-300">Administración</span>
              </span>
            </Link>
            <button
              type="button"
              aria-label="Cerrar menú"
              onClick={closeMenu}
              className="flex size-11 items-center justify-center rounded-field text-navy-200 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>

          <nav aria-label="Navegación del panel" className="min-h-0 flex-1 overflow-y-auto p-4">
            <div className="space-y-5">
              {navGroups.map((group) => (
                <div key={group.label}>
                  <p className="px-3 text-2xs font-extrabold tracking-[0.14em] text-navy-300 uppercase">
                    {group.label}
                  </p>
                  <ul className="mt-1.5 space-y-1">
                    {group.items.map(({ href, label, icon: Icon }) => {
                      const active = isActive(href)
                      return (
                        <li key={href}>
                          <Link
                            href={href}
                            onClick={closeMenu}
                            aria-current={active ? 'page' : undefined}
                            className={cn(
                              'flex min-h-12 items-center gap-3 rounded-[0.85rem] px-3.5 text-sm font-bold transition-colors',
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

          <div className="border-t border-white/10 p-4 safe-bottom">
            <p className="truncate text-sm font-bold text-navy-200">{userName}</p>
            <p className="mb-3 text-xs font-semibold text-brand-300">{roleLabels[role]}</p>
            <div className="[&_button]:w-full [&_button]:border-white/15 [&_button]:bg-white/5 [&_button]:text-white [&_form]:w-full">
              {footer}
            </div>
          </div>
          </aside>
        </div>
      )}
    </>
  )
}
