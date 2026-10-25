'use client'

import { ArrowRight, UserPlus } from 'lucide-react'
import { useActionState } from 'react'

import { Button, LinkButton } from '@/components/ui/button'
import { Field, Hint, Input, Label } from '@/components/ui/field'
import { useActionToast } from '@/components/ui/toaster'
import { TempPasswordNotice } from '@/components/users/temp-password-notice'
import { createClientAccount, type ClientAccountState } from '@/server/actions/users'

const initial: ClientAccountState = { status: 'idle' }

export function ClientAccountForm() {
  const [state, formAction, pending] = useActionState(createClientAccount, initial)
  useActionToast(state)
  const errors = state.fieldErrors ?? {}

  // Creada la cuenta, el formulario cede el lugar a la contrasena y al siguiente paso.
  if (state.tempPassword && state.email && state.clientId) {
    return (
      <TempPasswordNotice email={state.email} password={state.tempPassword}>
        <p className="pt-1">
          Si todavía no va a usar la app, no hace falta entregarla: el club puede reservar en su
          nombre.
        </p>
        <LinkButton href={`/admin/clientes/${state.clientId}`} size="sm">
          Ir a su ficha
          <ArrowRight aria-hidden />
        </LinkButton>
      </TempPasswordNotice>
    )
  }

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-2" noValidate>
      <Field errors={errors.fullName} className="sm:col-span-2">
        <Label>Nombre completo</Label>
        <Input name="fullName" autoComplete="off" required maxLength={120} />
      </Field>
      <Field errors={errors.email}>
        <Label>Correo</Label>
        <Input name="email" type="email" autoComplete="off" required />
        <Hint>Con él podrá entrar a la app y recuperar su contraseña.</Hint>
      </Field>
      <Field errors={errors.phone}>
        <Label>Teléfono</Label>
        <Input name="phone" type="tel" autoComplete="off" maxLength={20} placeholder="+505 8888 8888" />
      </Field>
      <div className="sm:col-span-2">
        <Button type="submit" loading={pending} loadingLabel="Registrando">
          <UserPlus aria-hidden />
          Registrar cliente
        </Button>
      </div>
    </form>
  )
}
