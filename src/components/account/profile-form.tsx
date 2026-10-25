'use client'

import { Save } from 'lucide-react'
import { useActionState } from 'react'

import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field, Input, Label } from '@/components/ui/field'
import { updateProfile } from '@/server/actions/auth'
import { idleState } from '@/server/actions/types'

export function ProfileForm({ fullName, phone }: { fullName: string; phone: string | null }) {
  const [state, formAction, pending] = useActionState(updateProfile, idleState)

  return (
    <form action={formAction} className="space-y-4">
      {state.message && (
        <Alert tone={state.status === 'error' ? 'danger' : 'success'}>{state.message}</Alert>
      )}

      <Field errors={state.fieldErrors?.fullName}>
        <Label>Nombre completo</Label>
        <Input name="fullName" defaultValue={fullName} autoComplete="name" required maxLength={120} />
      </Field>

      <Field errors={state.fieldErrors?.phone}>
        <Label>Teléfono</Label>
        <Input
          name="phone"
          type="tel"
          defaultValue={phone ?? ''}
          autoComplete="tel"
          placeholder="+505 8888 8888"
          maxLength={20}
        />
      </Field>

      <Button type="submit" loading={pending} loadingLabel="Guardando">
        <Save aria-hidden />
        Guardar cambios
      </Button>
    </form>
  )
}
