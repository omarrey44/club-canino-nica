'use client'

import { useActionState, useState } from 'react'

import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field, Hint, Input, Label } from '@/components/ui/field'
import { register } from '@/server/actions/auth'
import { idleState } from '@/server/actions/types'

export function RegisterForm() {
  const [state, action, pending] = useActionState(register, idleState)
  // Controlados: si el registro vuelve con error (correo repetido, por ejemplo),
  // React vaciaria los campos libres y habria que escribirlos de nuevo.
  const [values, setValues] = useState({ fullName: '', email: '', phone: '' })
  const bind = (name: keyof typeof values) => ({
    name,
    value: values[name],
    onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
      setValues((current) => ({ ...current, [name]: event.target.value })),
  })

  if (state.status === 'success') {
    return <Alert tone="success">{state.message}</Alert>
  }

  return (
    // Dos columnas desde `sm`: los cinco campos en fila unica hacian que el
    // formulario no cupiera en una portatil y obligaban a bajar para ver el
    // boton. Emparejados caben de una vez, que es como se llena un registro.
    <form action={action} className="space-y-3.5" noValidate>
      {state.status === 'error' && state.message && (
        <Alert tone="danger">{state.message}</Alert>
      )}

      <Field errors={state.fieldErrors?.fullName}>
        <Label>Nombre completo</Label>
        <Input {...bind('fullName')} autoComplete="name" placeholder="Camila Ruiz" required />
      </Field>

      <div className="grid gap-3.5 sm:grid-cols-2">
        <Field errors={state.fieldErrors?.email}>
          <Label>Correo</Label>
          <Input
            {...bind('email')}
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="camila@correo.com"
            required
          />
        </Field>

        <Field errors={state.fieldErrors?.phone}>
          <Label>Teléfono</Label>
          <Input {...bind('phone')} type="tel" autoComplete="tel" inputMode="tel" />
        </Field>
      </div>

      <div className="grid gap-3.5 sm:grid-cols-2">
        <Field errors={state.fieldErrors?.password}>
          <Label>Contraseña</Label>
          <Input name="password" type="password" autoComplete="new-password" required />
        </Field>

        <Field errors={state.fieldErrors?.confirmPassword}>
          <Label>Confirmar</Label>
          <Input name="confirmPassword" type="password" autoComplete="new-password" required />
        </Field>
      </div>

      <Hint>Mínimo 8 caracteres. El teléfono lo usamos solo para avisarte de tu mascota.</Hint>

      <Button type="submit" size="lg" block loading={pending} loadingLabel="Creando cuenta">
        Crear cuenta
      </Button>
    </form>
  )
}
