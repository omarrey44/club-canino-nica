'use client'

import { useActionState } from 'react'

import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field, Hint, Input, Label } from '@/components/ui/field'
import { register } from '@/server/actions/auth'
import { idleState } from '@/server/actions/types'

export function RegisterForm() {
  const [state, action, pending] = useActionState(register, idleState)

  if (state.status === 'success') {
    return <Alert tone="success">{state.message}</Alert>
  }

  return (
    <form action={action} className="space-y-4" noValidate>
      {state.status === 'error' && state.message && (
        <Alert tone="danger">{state.message}</Alert>
      )}

      <Field errors={state.fieldErrors?.fullName}>
        <Label>Nombre completo</Label>
        <Input name="fullName" autoComplete="name" placeholder="Camila Ruiz" required />
      </Field>

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

      <Field errors={state.fieldErrors?.phone}>
        <Label>Telefono</Label>
        <Input name="phone" type="tel" autoComplete="tel" inputMode="tel" />
        <Hint>Lo usamos para avisarte si tu mascota necesita algo.</Hint>
      </Field>

      <Field errors={state.fieldErrors?.password}>
        <Label>Contrasena</Label>
        <Input name="password" type="password" autoComplete="new-password" required />
        <Hint>Minimo 8 caracteres.</Hint>
      </Field>

      <Field errors={state.fieldErrors?.confirmPassword}>
        <Label>Confirmar contrasena</Label>
        <Input name="confirmPassword" type="password" autoComplete="new-password" required />
      </Field>

      <Button type="submit" size="lg" block loading={pending} loadingLabel="Creando cuenta">
        Crear cuenta
      </Button>
    </form>
  )
}
