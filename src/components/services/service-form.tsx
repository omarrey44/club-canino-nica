'use client'

import { useActionState } from 'react'

import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Checkbox, Field, Hint, Input, Label, Select, Textarea } from '@/components/ui/field'
import { saveService } from '@/server/actions/services'
import { idleState } from '@/server/actions/types'

export type ServiceFormDefaults = {
  id?: string
  name?: string
  description?: string | null
  kind?: string
  basePrice?: string
  priceUnit?: string
  durationMinutes?: string
  dailyCapacity?: string
  isActive?: boolean
}

export function ServiceForm({
  defaults = {},
  onDone,
}: {
  defaults?: ServiceFormDefaults
  onDone?: () => void
}) {
  const [state, formAction, pending] = useActionState(
    saveService.bind(null, defaults.id ?? null),
    idleState
  )
  const errors = state.fieldErrors ?? {}

  return (
    <form action={formAction} className="space-y-4 rounded-card bg-canvas p-4" noValidate>
      {state.status === 'error' && state.message && (
        <Alert tone="danger">{state.message}</Alert>
      )}
      {state.status === 'success' && state.message && (
        <Alert tone="success">{state.message}</Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field errors={errors.name} className="sm:col-span-2">
          <Label>Nombre</Label>
          <Input name="name" defaultValue={defaults.name} required autoFocus />
        </Field>

        <Field errors={errors.description} className="sm:col-span-2">
          <Label>Descripción</Label>
          <Textarea name="description" rows={2} defaultValue={defaults.description ?? ''} />
        </Field>

        <Field errors={errors.kind}>
          <Label>Tipo</Label>
          <Select name="kind" defaultValue={defaults.kind ?? 'DAYCARE'}>
            <option value="DAYCARE">Guardería de día</option>
            <option value="BOARDING">Hospedaje</option>
            <option value="ADDON">Adicional</option>
          </Select>
        </Field>

        <Field errors={errors.priceUnit}>
          <Label>Se cobra</Label>
          <Select name="priceUnit" defaultValue={defaults.priceUnit ?? 'DAY'}>
            <option value="DAY">Por día o noche</option>
            <option value="UNIT">Por servicio</option>
          </Select>
        </Field>

        <Field errors={errors.basePrice}>
          <Label>Precio</Label>
          <Input
            type="number"
            name="basePrice"
            step="0.01"
            min="0"
            inputMode="decimal"
            defaultValue={defaults.basePrice}
            required
          />
        </Field>

        <Field errors={errors.durationMinutes}>
          <Label>Duración (minutos)</Label>
          <Input
            type="number"
            name="durationMinutes"
            min="1"
            inputMode="numeric"
            defaultValue={defaults.durationMinutes ?? ''}
          />
        </Field>

        <Field errors={errors.dailyCapacity} className="sm:col-span-2">
          <Label>Cupo diario</Label>
          <Input
            type="number"
            name="dailyCapacity"
            min="1"
            inputMode="numeric"
            defaultValue={defaults.dailyCapacity ?? ''}
          />
          <Hint>
            Déjalo vacío si no hay límite. Con un cupo puesto, el flujo de reserva bloquea los
            días llenos.
          </Hint>
        </Field>

        <Field className="sm:col-span-2">
          <Checkbox
            name="isActive"
            label="Disponible para reservar"
            defaultChecked={defaults.isActive ?? true}
          />
        </Field>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" loading={pending} loadingLabel="Guardando">
          {defaults.id ? 'Guardar cambios' : 'Crear servicio'}
        </Button>
        {onDone && (
          <Button type="button" variant="ghost" onClick={onDone} disabled={pending}>
            Cerrar
          </Button>
        )}
      </div>
    </form>
  )
}
