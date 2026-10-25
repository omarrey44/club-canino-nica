'use client'

import { KeyRound } from 'lucide-react'
import { useActionState } from 'react'

import { Button } from '@/components/ui/button'
import { Field, Input, Label } from '@/components/ui/field'
import { useActionToast } from '@/components/ui/toaster'
import { changePassword } from '@/server/actions/auth'
import { idleState } from '@/server/actions/types'

export function PasswordForm() {
  const [state, formAction, pending] = useActionState(changePassword, idleState)
  useActionToast(state)

  return (
    <form action={formAction} className="space-y-4">
      <Field errors={state.fieldErrors?.password}>
        <Label>Contraseña nueva</Label>
        <Input name="password" type="password" autoComplete="new-password" required minLength={8} />
      </Field>

      <Field errors={state.fieldErrors?.confirmPassword}>
        <Label>Repite la contraseña</Label>
        <Input name="confirmPassword" type="password" autoComplete="new-password" required />
      </Field>

      <Button type="submit" variant="outline" loading={pending} loadingLabel="Guardando">
        <KeyRound aria-hidden />
        Cambiar contraseña
      </Button>
    </form>
  )
}
