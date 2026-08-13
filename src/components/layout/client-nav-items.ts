import { Bell, CalendarDays, Home, PawPrint, User } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Route } from 'next'

export type NavItem = { href: Route; label: string; icon: LucideIcon }

/**
 * Navegacion principal del cliente.
 *
 * Maximo 5 destinos: mas de eso vuelve la barra inferior ilegible en 375px.
 * Todo lo demas se alcanza desde dentro de estas cinco secciones.
 */
export const clientNavItems: NavItem[] = [
  { href: '/inicio', label: 'Inicio', icon: Home },
  { href: '/reservas', label: 'Reservas', icon: CalendarDays },
  { href: '/mi-mascota', label: 'Mi mascota', icon: PawPrint },
  { href: '/notificaciones', label: 'Avisos', icon: Bell },
  { href: '/perfil', label: 'Perfil', icon: User },
]
