import {
  CalendarDays,
  CreditCard,
  Dog,
  FileText,
  LayoutDashboard,
  Settings,
  Sparkles,
  Users,
  Video,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Route } from 'next'

export type AdminNavItem = { href: Route; label: string; icon: LucideIcon }

/** Orden por frecuencia de uso real en recepcion, no alfabetico. */
export const adminNavItems: AdminNavItem[] = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/reservaciones', label: 'Reservaciones', icon: CalendarDays },
  { href: '/admin/estancias', label: 'Estancias', icon: Dog },
  { href: '/admin/mascotas', label: 'Mascotas', icon: Dog },
  { href: '/admin/clientes', label: 'Clientes', icon: Users },
  { href: '/admin/reportes', label: 'Reportes', icon: FileText },
  { href: '/admin/camaras', label: 'Camaras', icon: Video },
  { href: '/admin/servicios', label: 'Servicios', icon: Sparkles },
  { href: '/admin/pagos', label: 'Pagos', icon: CreditCard },
  { href: '/admin/configuracion', label: 'Configuracion', icon: Settings },
]
