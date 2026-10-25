'use client'

import { Save } from 'lucide-react'
import { useActionState, type ReactNode } from 'react'

import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field, Input, Label, Textarea } from '@/components/ui/field'
import { saveBusinessSettings } from '@/server/actions/settings'
import { idleState } from '@/server/actions/types'
import type { BusinessSettings } from '@/server/organization'

export function BusinessSettingsForm({ settings }: { settings: BusinessSettings }) {
  const [state, formAction, pending] = useActionState(saveBusinessSettings, idleState)
  const errors = state.fieldErrors ?? {}
  const { contact, hours, billing } = settings

  return (
    <form action={formAction} className="space-y-6">
      {state.message && (
        <Alert tone={state.status === 'error' ? 'danger' : 'success'}>{state.message}</Alert>
      )}

      <Group title="Negocio">
        <Field errors={errors.name}>
          <Label>Nombre del negocio</Label>
          <Input name="name" defaultValue={settings.name} required maxLength={80} />
        </Field>
        <Field errors={errors.tagline}>
          <Label>Frase de la marca</Label>
          <Input name="tagline" defaultValue={settings.tagline} maxLength={140} />
        </Field>
      </Group>

      <Group title="Contacto" demo={contact.isDemo}>
        <Field errors={errors.phone}>
          <Label>Teléfono</Label>
          <Input name="phone" type="tel" defaultValue={contact.phone} required maxLength={20} />
        </Field>
        <Field errors={errors.email}>
          <Label>Correo electrónico</Label>
          <Input name="email" type="email" defaultValue={contact.email} required />
        </Field>
        <Field errors={errors.address} className="sm:col-span-2">
          <Label>Dirección</Label>
          <Input name="address" defaultValue={contact.address} required maxLength={200} />
        </Field>
      </Group>

      <Group title="Horarios" demo={hours.isDemo}>
        <Field errors={errors.daycareOpen}>
          <Label>Guardería abre</Label>
          <Input name="daycareOpen" type="time" defaultValue={hours.daycareOpen} required />
        </Field>
        <Field errors={errors.daycareClose}>
          <Label>Guardería cierra</Label>
          <Input name="daycareClose" type="time" defaultValue={hours.daycareClose} required />
        </Field>
        <Field errors={errors.boardingCheckIn}>
          <Label>Entrada de hospedaje</Label>
          <Input name="boardingCheckIn" type="time" defaultValue={hours.boardingCheckIn} required />
        </Field>
        <Field errors={errors.boardingCheckOut}>
          <Label>Salida de hospedaje</Label>
          <Input name="boardingCheckOut" type="time" defaultValue={hours.boardingCheckOut} required />
        </Field>
      </Group>

      <Group title="Cobros" demo={billing.isDemo}>
        <Field errors={errors.taxLabel}>
          <Label>Nombre del impuesto</Label>
          <Input name="taxLabel" defaultValue={billing.taxLabel} required maxLength={20} />
        </Field>
        <Field errors={errors.taxPercent}>
          <Label>Porcentaje</Label>
          <Input
            name="taxPercent"
            type="number"
            inputMode="decimal"
            min={0}
            max={100}
            step={0.01}
            defaultValue={Number((billing.taxRate * 100).toFixed(2))}
            required
          />
        </Field>
        <Field errors={errors.cancellationPolicy} className="sm:col-span-2">
          <Label>Política de cancelación</Label>
          <Textarea
            name="cancellationPolicy"
            defaultValue={billing.cancellationPolicy}
            rows={3}
            maxLength={1000}
          />
        </Field>
      </Group>

      <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
        <Button type="submit" loading={pending} loadingLabel="Guardando">
          <Save aria-hidden />
          Guardar configuración
        </Button>
        <p className="text-xs text-ink-subtle">
          El impuesto se aplica a las reservas nuevas; las ya creadas conservan su cobro.
        </p>
      </div>
    </form>
  )
}

function Group({ title, demo, children }: { title: string; demo?: boolean; children: ReactNode }) {
  return (
    <fieldset className="space-y-3">
      <legend className="flex items-center gap-2 text-sm font-extrabold text-navy-900">
        {title}
        {demo && (
          <span className="rounded-pill bg-warning-soft px-2 py-0.5 text-2xs font-extrabold text-navy-800">
            DEMO · sin confirmar
          </span>
        )}
      </legend>
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
    </fieldset>
  )
}
