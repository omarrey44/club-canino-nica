'use client'

import { useActionState } from 'react'

import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field, Hint, Input, Label } from '@/components/ui/field'
import { resetPassword } from '@/server/actions/auth'
import { idleState } from '@/server/actions/types'

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState(resetPassword, idleState)

  return (
    <form action={action} className="space-y-4" noValidate>
      {state.status === 'error' && state.message && (
        <Alert tone="danger">{state.message}</Alert>
      )}

      <Field errors={state.fieldErrors?.password}>
        <Label>Nueva contrasena</Label>
        <Input name="password" type="password" autoComplete="new-password" required />
        <Hint>Minimo 8 caracteres.</Hint>
      </Field>

      <Field errors={state.fieldErrors?.confirmPassword}>
        <Label>Confirmar contrasena</Label>
        <Input name="confirmPassword" type="password" autoComplete="new-password" required />
      </Field>

      <Button type="submit" size="lg" block loading={pending} loadingLabel="Guardando">
        Guardar contrasena
      </Button>
    </form>
  )
}
