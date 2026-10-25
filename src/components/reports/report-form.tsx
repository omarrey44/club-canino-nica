'use client'

import { useActionState, useState } from 'react'

import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, Hint, Input, Label, Textarea } from '@/components/ui/field'
import { useActionToast } from '@/components/ui/toaster'
import {
  energyLabels,
  foodIntakeLabels,
  moodLabels,
  waterIntakeLabels,
} from '@/lib/constants/labels'
import { saveDailyReport } from '@/server/actions/reports'
import { idleState } from '@/server/actions/types'
import { cn } from '@/lib/utils'

export type ReportFormDefaults = {
  foodIntake?: string
  waterIntake?: string
  energy?: string
  mood?: string
  walkCount?: number
  restMinutes?: number
  activitiesSummary?: string
  caregiverNotes?: string
}

/**
 * Grupo de opciones como fichas grandes.
 *
 * Se elige tocando, no desplegando: el reporte se llena en tablet al final del
 * dia y cada desplegable seria un toque de mas por campo.
 */
function ChoiceGroup({
  name,
  legend,
  options,
  defaultValue,
  error,
}: {
  name: string
  legend: string
  options: Record<string, string>
  defaultValue?: string
  error?: string[]
}) {
  const [value, setValue] = useState(defaultValue ?? '')

  return (
    <fieldset>
      <legend className="mb-2 text-sm font-bold text-ink">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {Object.entries(options).map(([key, label]) => {
          const active = value === key
          return (
            <label
              key={key}
              className={cn(
                'flex min-h-11 cursor-pointer items-center rounded-pill border-2 px-4 text-sm font-bold transition-colors',
                active
                  ? 'border-brand-500 bg-brand-50 text-brand-700'
                  : 'border-line bg-surface text-ink-muted hover:border-navy-300'
              )}
            >
              <input
                type="radio"
                name={name}
                value={key}
                checked={active}
                onChange={() => setValue(key)}
                className="sr-only"
              />
              {label}
            </label>
          )
        })}
      </div>
      {error?.length ? <p className="mt-1.5 text-sm text-danger">{error[0]}</p> : null}
    </fieldset>
  )
}

export function ReportForm({
  stayId,
  petName,
  defaults,
  registered,
  isUpdate,
}: {
  stayId: string
  petName: string
  defaults: ReportFormDefaults
  /** Resumen de lo ya registrado durante el dia, para no capturarlo dos veces. */
  registered: string
  isUpdate: boolean
}) {
  const [state, formAction, pending] = useActionState(
    saveDailyReport.bind(null, stayId),
    idleState
  )
  useActionToast(state)
  const errors = state.fieldErrors ?? {}

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {registered && (
        <Alert tone="info">
          Ya registrado hoy: {registered} Los paseos y el descanso vienen precargados con
          eso; corrígelos si hace falta.
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Cómo le fue a {petName}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <ChoiceGroup
            name="foodIntake"
            legend="Comida"
            options={foodIntakeLabels}
            defaultValue={defaults.foodIntake}
            error={errors.foodIntake}
          />
          <ChoiceGroup
            name="waterIntake"
            legend="Agua"
            options={waterIntakeLabels}
            defaultValue={defaults.waterIntake}
            error={errors.waterIntake}
          />
          <ChoiceGroup
            name="energy"
            legend="Energía"
            options={energyLabels}
            defaultValue={defaults.energy}
            error={errors.energy}
          />
          <ChoiceGroup
            name="mood"
            legend="Estado de ánimo"
            options={moodLabels}
            defaultValue={defaults.mood}
            error={errors.mood}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Field errors={errors.walkCount}>
              <Label>Paseos</Label>
              <Input
                type="number"
                name="walkCount"
                min="0"
                max="20"
                inputMode="numeric"
                defaultValue={defaults.walkCount ?? 0}
              />
            </Field>

            <Field errors={errors.restMinutes}>
              <Label>Descanso (minutos)</Label>
              <Input
                type="number"
                name="restMinutes"
                min="0"
                max="1440"
                step="15"
                inputMode="numeric"
                defaultValue={defaults.restMinutes ?? 0}
              />
              <Hint>Aproximado. Media hora por descanso registrado.</Hint>
            </Field>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lo que le contamos al propietario</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field errors={errors.activitiesSummary}>
            <Label>Qué hizo</Label>
            <Textarea
              name="activitiesSummary"
              rows={3}
              maxLength={600}
              defaultValue={defaults.activitiesSummary}
            />
          </Field>

          <Field errors={errors.caregiverNotes}>
            <Label>Nota del cuidador</Label>
            <Textarea
              name="caregiverNotes"
              rows={3}
              maxLength={800}
              defaultValue={defaults.caregiverNotes}
              placeholder={`${petName} tuvo un día excelente. Comió todo y jugó sin problemas.`}
            />
            <Hint>
              Esto es lo primero que lee el propietario. Sin diagnósticos: si algo preocupa,
              llámalo.
            </Hint>
          </Field>
        </CardContent>
      </Card>

      <Button type="submit" size="lg" block loading={pending} loadingLabel="Guardando">
        {isUpdate ? 'Actualizar reporte' : `Publicar reporte de ${petName}`}
      </Button>
    </form>
  )
}
