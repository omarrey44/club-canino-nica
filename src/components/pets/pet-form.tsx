'use client'

import { useActionState } from 'react'

import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox, Field, Hint, Input, Label, Select, Textarea } from '@/components/ui/field'
import { petSexLabels, petSizeLabels } from '@/lib/constants/labels'
import { idleState, type ActionState } from '@/server/actions/types'

export type PetFormDefaults = {
  name?: string
  breed?: string | null
  sex?: string
  size?: string
  birthDate?: string
  weightKg?: string
  colorMarks?: string | null
  temperament?: string | null
  allergies?: string | null
  medications?: string | null
  medicalConditions?: string | null
  dietNotes?: string | null
  feedingSchedule?: string | null
  isSterilized?: boolean
  vetName?: string | null
  vetPhone?: string | null
  vetClinic?: string | null
  specialNotes?: string | null
}

/**
 * Formulario unico para alta y edicion.
 *
 * Se divide en dos bloques porque son dos momentos distintos: los datos
 * basicos se llenan de memoria, la información de cuidado hay que pensarla.
 * Solo el nombre y el sexo son obligatorios; el resto se puede completar
 * despues, y forzarlo aquí haria que nadie termine el registro.
 */
export function PetForm({
  action,
  defaults = {},
  submitLabel,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>
  defaults?: PetFormDefaults
  submitLabel: string
}) {
  const [state, formAction, pending] = useActionState(action, idleState)
  const errors = state.fieldErrors ?? {}

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {state.status === 'error' && state.message && (
        <Alert tone="danger">{state.message}</Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Datos basicos</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field errors={errors.name} className="sm:col-span-2 lg:col-span-3">
            <Label>Nombre</Label>
            <Input name="name" defaultValue={defaults.name} required autoFocus />
          </Field>

          <Field errors={errors.breed}>
            <Label>Raza</Label>
            <Input name="breed" defaultValue={defaults.breed ?? ''} placeholder="Labrador" />
          </Field>

          <Field errors={errors.sex}>
            <Label>Sexo</Label>
            <Select name="sex" defaultValue={defaults.sex ?? ''} required>
              <option value="" disabled>
                Elige una opcion
              </option>
              {Object.entries(petSexLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>

          <Field errors={errors.size}>
            <Label>Tamaño</Label>
            <Select name="size" defaultValue={defaults.size ?? 'MEDIUM'}>
              {Object.entries(petSizeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>

          <Field errors={errors.birthDate}>
            <Label>Fecha de nacimiento</Label>
            {/* Input nativo: en movil abre el calendario del sistema. */}
            <Input type="date" name="birthDate" defaultValue={defaults.birthDate ?? ''} />
          </Field>

          <Field errors={errors.weightKg}>
            <Label>Peso (kg)</Label>
            <Input
              type="number"
              name="weightKg"
              step="0.1"
              min="0"
              inputMode="decimal"
              defaultValue={defaults.weightKg ?? ''}
            />
          </Field>

          <Field errors={errors.colorMarks}>
            <Label>Color y señas</Label>
            <Input
              name="colorMarks"
              defaultValue={defaults.colorMarks ?? ''}
              placeholder="Dorado con mancha blanca en el pecho"
            />
          </Field>

          <Field errors={errors.temperament} className="sm:col-span-2 lg:col-span-3">
            <Label>Carácter</Label>
            <Textarea
              name="temperament"
              rows={2}
              defaultValue={defaults.temperament ?? ''}
              placeholder="Sociable, se lleva bien con perros grandes"
            />
            <Hint>Ayuda al equipo a decidir con quien juega y donde descansa.</Hint>
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Información de cuidado</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field errors={errors.allergies}>
            <Label>Alergias</Label>
            <Input name="allergies" defaultValue={defaults.allergies ?? ''} placeholder="Pollo" />
          </Field>

          <Field errors={errors.medications}>
            <Label>Medicamentos</Label>
            <Input name="medications" defaultValue={defaults.medications ?? ''} />
          </Field>

          <Field errors={errors.medicalConditions} className="sm:col-span-2 lg:col-span-3">
            <Label>Condiciones a tener en cuenta</Label>
            <Textarea
              name="medicalConditions"
              rows={2}
              defaultValue={defaults.medicalConditions ?? ''}
            />
            <Hint>
              Esta información es solo para el equipo del club. No sustituye a tu veterinario.
            </Hint>
          </Field>

          <Field errors={errors.dietNotes}>
            <Label>Alimentación</Label>
            <Input
              name="dietNotes"
              defaultValue={defaults.dietNotes ?? ''}
              placeholder="Croqueta de cordero, dos tazas"
            />
          </Field>

          <Field errors={errors.feedingSchedule}>
            <Label>Horario de comida</Label>
            <Input
              name="feedingSchedule"
              defaultValue={defaults.feedingSchedule ?? ''}
              placeholder="9:00 AM y 4:00 PM"
            />
          </Field>

          <Field className="sm:col-span-2 lg:col-span-3">
            <Checkbox name="isSterilized" label="Esta esterilizado" defaultChecked={defaults.isSterilized} />
          </Field>

          <Field errors={errors.vetName}>
            <Label>Veterinario</Label>
            <Input name="vetName" defaultValue={defaults.vetName ?? ''} />
          </Field>

          <Field errors={errors.vetPhone}>
            <Label>Teléfono del veterinario</Label>
            <Input type="tel" name="vetPhone" inputMode="tel" defaultValue={defaults.vetPhone ?? ''} />
          </Field>

          <Field errors={errors.vetClinic} className="sm:col-span-2 lg:col-span-3">
            <Label>Clínica</Label>
            <Input name="vetClinic" defaultValue={defaults.vetClinic ?? ''} />
          </Field>

          <Field errors={errors.specialNotes} className="sm:col-span-2 lg:col-span-3">
            <Label>Observaciones especiales</Label>
            <Textarea
              name="specialNotes"
              rows={3}
              defaultValue={defaults.specialNotes ?? ''}
              placeholder="Se pone nervioso con truenos. Buscar espacio techado."
            />
          </Field>
        </CardContent>
      </Card>

      <Button type="submit" size="lg" block loading={pending} loadingLabel="Guardando">
        {submitLabel}
      </Button>
    </form>
  )
}
