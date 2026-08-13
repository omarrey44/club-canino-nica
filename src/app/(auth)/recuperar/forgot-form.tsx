'use client'

import { useActionState } from 'react'

import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field, Input, Label } from '@/components/ui/field'
import { requestPasswordReset } from '@/server/actions/auth'
import { idleState } from '@/server/actions/types'

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, idleState)

  if (state.status === 'success') {
    return <Alert tone="success">{state.message}</Alert>
  }

  return (
    <form action={action} className="space-y-4" noValidate>
      {state.status === 'error' && state.message && (
        <Alert tone="danger">{state.message}</Alert>
      )}

      <Field errors={state.fieldErrors?.email}>
        <Label>Correo</Label>
        <Input
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="camila@correo.com"
          required
        />
      </Field>

      <Button type="submit" size="lg" block loading={pending} loadingLabel="Enviando">
        Enviar enlace
      </Button>
    </form>
  )
}
