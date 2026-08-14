'use client'

import { useActionState } from 'react'

import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Checkbox, Field, Hint, Input, Label, Select, Textarea } from '@/components/ui/field'
import { saveCamera } from '@/server/actions/cameras'
import { idleState } from '@/server/actions/types'

export type CameraFormDefaults = {
  id?: string
  name?: string
  area?: string
  description?: string | null
  provider?: string
  providerRef?: string
  protocol?: string
  status?: string
  isActive?: boolean
}

export function CameraForm({
  defaults = {},
  onDone,
}: {
  defaults?: CameraFormDefaults
  onDone?: () => void
}) {
  const [state, formAction, pending] = useActionState(
    saveCamera.bind(null, defaults.id ?? null),
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
        <Field errors={errors.name}>
          <Label>Nombre</Label>
          <Input name="name" defaultValue={defaults.name} required autoFocus />
        </Field>

        <Field errors={errors.area}>
          <Label>Área que cubre</Label>
          <Input name="area" defaultValue={defaults.area} placeholder="Área de juegos" required />
          <Hint>
            Debe coincidir con el área que el equipo escribe en la estancia, para poder
            avisarle al propietario que su mascota está ahí.
          </Hint>
        </Field>

        <Field errors={errors.description} className="sm:col-span-2">
          <Label>Descripción</Label>
          <Textarea name="description" rows={2} defaultValue={defaults.description ?? ''} />
        </Field>

        <Field errors={errors.provider}>
          <Label>Proveedor</Label>
          <Input name="provider" defaultValue={defaults.provider ?? 'demo'} />
          <Hint>Mientras no haya equipo instalado, déjalo en `demo`.</Hint>
        </Field>

        <Field errors={errors.protocol}>
          <Label>Protocolo</Label>
          <Select name="protocol" defaultValue={defaults.protocol ?? 'DEMO'}>
            <option value="DEMO">Demostración</option>
            <option value="HLS">HLS</option>
            <option value="WEBRTC">WebRTC</option>
            <option value="MJPEG">MJPEG</option>
          </Select>
        </Field>

        <Field errors={errors.providerRef} className="sm:col-span-2">
          <Label>Identificador de la cámara</Label>
          <Input
            name="providerRef"
            defaultValue={defaults.providerRef}
            placeholder="patio-principal-01"
            required
          />
          <Hint>
            Solo el identificador que usa el proveedor. Nunca pegues aquí una URL con
            usuario y contraseña: esas credenciales no deben vivir en la plataforma.
          </Hint>
        </Field>

        <Field errors={errors.status}>
          <Label>Estado</Label>
          <Select name="status" defaultValue={defaults.status ?? 'OFFLINE'}>
            <option value="ONLINE">En línea</option>
            <option value="OFFLINE">Fuera de línea</option>
            <option value="MAINTENANCE">En mantenimiento</option>
          </Select>
        </Field>

        <Field className="flex items-end">
          <input type="hidden" name="isActive" value="" />
          <Checkbox
            name="isActive"
            value="on"
            label="Disponible para asignar"
            defaultChecked={defaults.isActive ?? true}
          />
        </Field>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" loading={pending} loadingLabel="Guardando">
          {defaults.id ? 'Guardar cambios' : 'Crear cámara'}
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
