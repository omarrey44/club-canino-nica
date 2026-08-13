import { CalendarPlus, PawPrint } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { firstName, greeting } from '@/lib/datetime'
import { requireUser } from '@/server/auth/session'

export const metadata: Metadata = { title: 'Inicio' }

export default async function ClientHomePage() {
  const user = await requireUser()

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-navy-800">
          {greeting()}, {firstName(user.fullName)}
        </h1>
        <p className="text-ink-muted">Aqui veras como esta tu mascota hoy.</p>
      </header>

      {/* FASE 2 reemplaza esto por la hero card de la mascota activa,
          la proxima reservacion y el timeline de actualizaciones. */}
      <EmptyState
        icon={PawPrint}
        title="Todavia no hay mascotas registradas"
        description="Registra a tu perro para poder reservar y seguir su dia dentro del club."
        action={
          <Button size="sm" disabled>
            <CalendarPlus aria-hidden />
            Registrar mascota
          </Button>
        }
      />

      <p className="text-center text-sm text-ink-muted">
        <Link href="/perfil" className="font-medium text-brand-600 hover:underline">
          Ver mi perfil
        </Link>
      </p>
    </div>
  )
}
