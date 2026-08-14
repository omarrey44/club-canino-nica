'use client'

import { Bell, ChevronDown, LogOut, UserRound } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

import { logout } from '@/server/actions/auth'

type ClientDesktopHeaderProps = {
  fullName: string
  email: string
  unreadCount: number
}

function getInitials(fullName: string) {
  return fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

/** Barra de cuenta persistente para que perfil, avisos y sesión estén siempre disponibles. */
export function ClientDesktopHeader({
  fullName,
  email,
  unreadCount,
}: ClientDesktopHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const initials = getInitials(fullName)

  useEffect(() => {
    if (!menuOpen) return

    function closeOnOutsideClick(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false)
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMenuOpen(false)
        triggerRef.current?.focus()
      }
    }

    document.addEventListener('mousedown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [menuOpen])

  return (
    <header className="sticky top-0 z-30 hidden h-16 shrink-0 border-b border-line/90 bg-surface/95 backdrop-blur-xl md:block">
      <div className="mx-auto flex h-full w-full max-w-7xl items-center justify-end px-6 lg:px-7">
        <Link
          href="/notificaciones"
          aria-label={
            unreadCount > 0
              ? `Ver notificaciones, ${unreadCount} sin leer`
              : 'Ver notificaciones'
          }
          className="relative flex size-11 items-center justify-center rounded-full text-navy-700 transition-colors hover:bg-navy-50 hover:text-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        >
          <Bell className="size-5" aria-hidden />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1 flex min-w-4.5 items-center justify-center rounded-full bg-brand-700 px-1 text-[0.625rem] leading-[1.125rem] font-extrabold text-white ring-2 ring-surface">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        <span className="mx-3 h-8 w-px bg-line" aria-hidden />

        <div ref={menuRef} className="relative">
          <button
            ref={triggerRef}
            type="button"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
            className="flex min-h-11 cursor-pointer items-center gap-2.5 rounded-field px-2 py-1 text-left transition-colors hover:bg-navy-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-navy-800 text-xs font-extrabold text-white shadow-card">
              {initials}
            </span>
            <span className="min-w-0 max-w-48">
              <span className="block truncate text-sm font-extrabold text-navy-900">{fullName}</span>
              <span className="block text-2xs font-semibold text-ink-muted">Mi cuenta</span>
            </span>
            <ChevronDown
              className={`size-4 shrink-0 text-ink-muted transition-transform motion-reduce:transition-none ${menuOpen ? 'rotate-180' : ''}`}
              aria-hidden
            />
          </button>

          {menuOpen && (
            <div
              role="menu"
              aria-label="Opciones de la cuenta"
              className="absolute top-[calc(100%+0.5rem)] right-0 w-64 overflow-hidden rounded-card border border-line bg-surface p-2 shadow-overlay"
            >
              <div className="border-b border-line px-3 py-2.5">
                <p className="truncate text-sm font-extrabold text-navy-900">{fullName}</p>
                <p className="mt-0.5 truncate text-xs text-ink-muted">{email}</p>
              </div>

              <div className="pt-1.5">
                <Link
                  href="/perfil"
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                  className="flex min-h-11 items-center gap-3 rounded-field px-3 text-sm font-bold text-navy-800 transition-colors hover:bg-navy-50"
                >
                  <UserRound className="size-4.5 text-info" aria-hidden />
                  Ver mi perfil
                </Link>
                <form action={logout}>
                  <button
                    type="submit"
                    role="menuitem"
                    className="flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-field px-3 text-sm font-bold text-danger transition-colors hover:bg-danger-soft"
                  >
                    <LogOut className="size-4.5" aria-hidden />
                    Cerrar sesión
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
