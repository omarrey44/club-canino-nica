import { LogOut } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { logout } from '@/server/actions/auth'

export function LogoutButton() {
  return (
    <form action={logout}>
      <Button type="submit" variant="outline" size="sm">
        <LogOut aria-hidden />
        Cerrar sesion
      </Button>
    </form>
  )
}
