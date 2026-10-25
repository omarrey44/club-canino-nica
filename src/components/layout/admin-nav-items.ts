import {
  CalendarDays,
  CreditCard,
  Dog,
  FileText,
  LayoutDashboard,
  LogIn,
  Settings,
  Sparkles,
  Users,
  Video,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Route } from 'next'

import type { Role } from '@/generated/prisma/client'

/** `roles` limita quien ve el enlace; sin el, lo ve todo el personal. */
export type AdminNavItem = { href: Route; label: string; icon: LucideIcon; roles?: Role[] }
export type AdminNavGroup = { label: string; items: AdminNavItem[] }

const ADMIN_ONLY: Role[] = ['ADMIN', 'SUPER_ADMIN']

/** Orden por frecuencia de uso real en recepción, no alfabetico. */
export const adminNavGroups: AdminNavGroup[] = [
  {
    label: 'Operación diaria',
    items: [
      { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/admin/check-in', label: 'Check-in', icon: LogIn },
      { href: '/admin/reservaciones', label: 'Reservaciones', icon: CalendarDays },
      { href: '/admin/estancias', label: 'Estancias', icon: Dog },
      { href: '/admin/camaras', label: 'Cámaras', icon: Video },
    ],
  },
  {
    label: 'Comunidad',
    items: [
      { href: '/admin/mascotas', label: 'Mascotas', icon: Dog },
      { href: '/admin/clientes', label: 'Clientes', icon: Users },
    ],
  },
  {
    label: 'Negocio',
    items: [
      { href: '/admin/servicios', label: 'Servicios', icon: Sparkles, roles: ADMIN_ONLY },
      { href: '/admin/pagos', label: 'Pagos', icon: CreditCard },
      { href: '/admin/reportes', label: 'Reportes', icon: FileText },
      { href: '/admin/configuracion', label: 'Configuración', icon: Settings, roles: ADMIN_ONLY },
    ],
  },
]

export const adminNavItems = adminNavGroups.flatMap((group) => group.items)

/**
 * Menu visible para un rol. Solo esconde enlaces: la barrera real sigue siendo
 * `requireRole` en cada pagina y cada Server Action.
 */
export function adminNavGroupsFor(role: Role): AdminNavGroup[] {
  return adminNavGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.roles || item.roles.includes(role)),
    }))
    .filter((group) => group.items.length > 0)
}
