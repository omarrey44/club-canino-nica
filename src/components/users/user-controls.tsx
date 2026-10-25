'use client'

import { KeyRound, UserCheck, UserX } from 'lucide-react'
import { useState, useTransition } from 'react'

import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toaster'
import { TempPasswordNotice } from '@/components/users/temp-password-notice'
import type { Role } from '@/generated/prisma/client'
import { roleLabels } from '@/lib/constants/labels'
import { resetUserPassword, setUserActive, setUserRole } from '@/server/actions/users'
import type { ActionState } from '@/server/actions/types'
import { ASSIGNABLE_STAFF_ROLES } from '@/validations/users'

function report(result: ActionState) {
  if (result.message) toast(result.message, result.status === 'error' ? 'danger' : 'success')
}

/** Cambiar el rol aplica al elegir. "Cliente" saca a la persona del equipo. */
export function RoleSelect({ userId, role, name }: { userId: string; role: Role; name: string }) {
  const [pending, startTransition] = useTransition()
  const [value, setValue] = useState(role)

  return (
    <select
      aria-label={`Rol de ${name}`}
      value={value}
      disabled={pending}
      onChange={(event) => {
        const next = event.target.value as Role
        setValue(next)
        startTransition(async () => {
          const result = await setUserRole(userId, next)
          // Si el servidor lo rechaza, el selector vuelve a lo que habia.
          if (result.status === 'error') setValue(role)
          report(result)
        })
      }}
      className="h-11 rounded-field border border-line-strong bg-surface px-3 text-sm font-semibold text-ink disabled:opacity-60"
    >
      {ASSIGNABLE_STAFF_ROLES.map((option) => (
        <option key={option} value={option}>
          {roleLabels[option]}
        </option>
      ))}
      <option value="CLIENT">Quitar del equipo (cliente)</option>
    </select>
  )
}

/**
 * Contraseña temporal sin correo, para quien olvidó la suya. Se confirma porque
 * la actual deja de servir en ese momento.
 */
export function ResetPasswordButton({ userId, email }: { userId: string; email: string }) {
  const [pending, startTransition] = useTransition()
  const [confirming, setConfirming] = useState(false)
  const [password, setPassword] = useState<string | null>(null)

  if (password) {
    return (
      <div className="w-full">
        <TempPasswordNotice email={email} password={password} />
      </div>
    )
  }

  if (!confirming) {
    return (
      <Button size="sm" variant="ghost" onClick={() => setConfirming(true)}>
        <KeyRound aria-hidden />
        Contraseña temporal
      </Button>
    )
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <span className="text-sm text-ink-muted">Su contraseña actual dejará de funcionar.</span>
      <Button
        size="sm"
        loading={pending}
        loadingLabel="Generando"
        onClick={() =>
          startTransition(async () => {
            const result = await resetUserPassword(userId)
            if (result.tempPassword) setPassword(result.tempPassword)
            else report(result)
            setConfirming(false)
          })
        }
      >
        Generar
      </Button>
      <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
        No
      </Button>
    </span>
  )
}

/** Desactivar se confirma con un segundo toque; reactivar no, porque no cuesta nada. */
export function ActiveToggle({
  userId,
  active,
  name,
}: {
  userId: string
  active: boolean
  name: string
}) {
  const [pending, startTransition] = useTransition()
  const [confirming, setConfirming] = useState(false)

  function apply(next: boolean) {
    startTransition(async () => {
      report(await setUserActive(userId, next))
      setConfirming(false)
    })
  }

  if (!active) {
    return (
      <Button size="sm" variant="outline" loading={pending} loadingLabel="Reactivando" onClick={() => apply(true)}>
        <UserCheck aria-hidden />
        Reactivar
      </Button>
    )
  }

  if (!confirming) {
    return (
      <Button size="sm" variant="ghost" onClick={() => setConfirming(true)}>
        <UserX aria-hidden />
        Desactivar
      </Button>
    )
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <span className="text-sm text-ink-muted">{name} no podrá entrar. ¿Seguro?</span>
      <Button size="sm" variant="danger" loading={pending} loadingLabel="Desactivando" onClick={() => apply(false)}>
        Sí, desactivar
      </Button>
      <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
        No
      </Button>
    </span>
  )
}
