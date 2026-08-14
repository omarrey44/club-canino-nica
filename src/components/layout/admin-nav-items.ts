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

export type AdminNavItem = { href: Route; label: string; icon: LucideIcon }
export type AdminNavGroup = { label: string; items: AdminNavItem[] }

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
      { href: '/admin/servicios', label: 'Servicios', icon: Sparkles },
      { href: '/admin/pagos', label: 'Pagos', icon: CreditCard },
      { href: '/admin/reportes', label: 'Reportes', icon: FileText },
      { href: '/admin/configuracion', label: 'Configuración', icon: Settings },
    ],
  },
]

export const adminNavItems = adminNavGroups.flatMap((group) => group.items)
