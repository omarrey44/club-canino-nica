'use client'

import { Copy, KeyRound, UserPlus } from 'lucide-react'
import { useActionState } from 'react'

import { Button } from '@/components/ui/button'
import { Field, Hint, Input, Label, Select } from '@/components/ui/field'
import { toast, useActionToast } from '@/components/ui/toaster'
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

      {/* Fuera del toast a proposito: hay que poder copiarla, y no se vuelve a mostrar. */}
      {state.tempPassword && (
        <div className="space-y-2 rounded-field border border-warning/30 bg-warning-soft p-4 text-sm text-navy-900">
          <p className="flex items-center gap-2 font-extrabold">
            <KeyRound className="size-4 text-warning" aria-hidden />
            Contraseña temporal de {state.email}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <code className="rounded-[0.5rem] bg-surface px-3 py-2 font-mono text-base tracking-wide select-all">
              {state.tempPassword}
            </code>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                navigator.clipboard
                  .writeText(state.tempPassword!)
                  .then(() => toast('Contraseña copiada.'))
                  .catch(() => toast('No se pudo copiar. Selecciónala a mano.', 'danger'))
              }
            >
              <Copy aria-hidden />
              Copiar
            </Button>
          </div>
          <p className="text-ink-muted">
            Entrégasela en persona. No se vuelve a mostrar. Al entrar, que la cambie en Mi perfil →
            Contraseña.
          </p>
        </div>
      )}
    </div>
  )
}
