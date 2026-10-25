'use client'

import { UserPlus } from 'lucide-react'
import { useActionState } from 'react'

import { Button } from '@/components/ui/button'
import { Field, Hint, Input, Label, Select } from '@/components/ui/field'
import { useActionToast } from '@/components/ui/toaster'
import { TempPasswordNotice } from '@/components/users/temp-password-notice'
import { roleLabels } from '@/lib/constants/labels'
import { addStaffMember, type StaffMemberState } from '@/server/actions/users'
import { ASSIGNABLE_STAFF_ROLES } from '@/validations/users'

const initial: StaffMemberState = { status: 'idle' }

export function StaffForm() {
  const [state, formAction, pending] = useActionState(addStaffMember, initial)
  useActionToast(state)
  const errors = state.fieldErrors ?? {}

  return (
    <div className="space-y-4">
      <form action={formAction} className="grid gap-3 sm:grid-cols-2" noValidate>
        <Field errors={errors.fullName}>
          <Label>Nombre completo</Label>
          <Input name="fullName" autoComplete="off" required maxLength={120} />
        </Field>
        <Field errors={errors.email}>
          <Label>Correo</Label>
          <Input name="email" type="email" autoComplete="off" required />
        </Field>
        <Field errors={errors.role}>
          <Label>Rol</Label>
          <Select name="role" defaultValue="EMPLOYEE">
            {ASSIGNABLE_STAFF_ROLES.map((role) => (
              <option key={role} value={role}>
                {roleLabels[role]}
              </option>
            ))}
          </Select>
          <Hint>Administrador ve configuración, servicios y personal.</Hint>
        </Field>
        <div className="flex items-start sm:pt-7.5">
          <Button type="submit" loading={pending} loadingLabel="Agregando">
            <UserPlus aria-hidden />
            Agregar al equipo
          </Button>
        </div>
      </form>

      {state.tempPassword && state.email && (
        <TempPasswordNotice email={state.email} password={state.tempPassword} />
      )}
    </div>
  )
}
