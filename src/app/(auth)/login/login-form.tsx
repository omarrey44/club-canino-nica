'use client'

import Link from 'next/link'
import { useActionState } from 'react'

import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field, Input, Label } from '@/components/ui/field'
import { login } from '@/server/actions/auth'
import { idleState } from '@/server/actions/types'

export function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const [state, action, pending] = useActionState(login, idleState)

  return (
    <form action={action} className="space-y-4" noValidate>
      {redirectTo && <input type="hidden" name="redirectTo" value={redirectTo} />}

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

      <Field errors={state.fieldErrors?.password}>
        <div className="flex items-baseline justify-between">
          <Label>Contrasena</Label>
          <Link
            href="/recuperar"
            className="text-sm font-medium text-brand-600 hover:underline"
          >
            Olvide mi contrasena
          </Link>
        </div>
        <Input name="password" type="password" autoComplete="current-password" required />
      </Field>

      <Button type="submit" size="lg" block loading={pending} loadingLabel="Entrando">
        Entrar
      </Button>
    </form>
  )
}
