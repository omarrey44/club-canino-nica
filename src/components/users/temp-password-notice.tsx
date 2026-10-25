'use client'

import { Copy, KeyRound } from 'lucide-react'
import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toaster'

/** Fuera del toast a proposito: hay que poder copiarla, y no se vuelve a mostrar. */
export function TempPasswordNotice({
  email,
  password,
  children,
}: {
  email: string
  password: string
  children?: ReactNode
}) {
  return (
    <div className="space-y-2 rounded-field border border-warning/30 bg-warning-soft p-4 text-sm text-navy-900">
      <p className="flex items-center gap-2 font-extrabold">
        <KeyRound className="size-4 text-warning" aria-hidden />
        Contraseña temporal de {email}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <code className="rounded-[0.5rem] bg-surface px-3 py-2 font-mono text-base tracking-wide select-all">
          {password}
        </code>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            navigator.clipboard
              .writeText(password)
              .then(() => toast('Contraseña copiada.'))
              .catch(() => toast('No se pudo copiar. Selecciónala a mano.', 'danger'))
          }
        >
          <Copy aria-hidden />
          Copiar
        </Button>
      </div>
      <p className="text-ink-muted">
        Entrégasela en persona. No se vuelve a mostrar. Al entrar, que la cambie en Mi perfil →
        Contraseña.
      </p>
      {children}
    </div>
  )
}
