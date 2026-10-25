'use client'

import {
  Bone,
  Camera,
  ClipboardPen,
  Droplets,
  Footprints,
  MoonStar,
  Pill,
  Sparkles,
  Utensils,
  type LucideIcon,
} from 'lucide-react'
import { useActionState, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Field, Hint, Input, Label, Textarea } from '@/components/ui/field'
import { useActionToast } from '@/components/ui/toaster'
import { activityTypeLabels } from '@/lib/constants/labels'
import { logActivity } from '@/server/actions/activities'
import { idleState } from '@/server/actions/types'
import { STAFF_ACTIVITY_TYPES } from '@/validations/stay'
import { cn } from '@/lib/utils'

type StaffActivityType = (typeof STAFF_ACTIVITY_TYPES)[number]

const icons: Record<StaffActivityType, LucideIcon> = {
  FOOD: Utensils,
  WATER: Droplets,
  PLAY: Bone,
  WALK: Footprints,
  REST: MoonStar,
  PHOTO: Camera,
  MEDICATION: Pill,
  GROOMING: Sparkles,
  NOTE: ClipboardPen,
}

/** Lo que se registra a cada rato va primero; el resto queda detras del "Mas". */
const PRIMARY: StaffActivityType[] = ['FOOD', 'WATER', 'PLAY', 'WALK', 'REST', 'PHOTO']
const SECONDARY: StaffActivityType[] = ['MEDICATION', 'GROOMING', 'NOTE']

/**
 * Registro rapido de actividad.
 *
 * El objetivo es dos toques: elegir el tipo y guardar. Todo lo demas
 * (comentario, foto, hora, visibilidad) es opcional y no estorba el camino
 * corto, porque quien lo usa esta de pie con un perro en la otra mano.
 */
export function QuickActivityForm({ stayId }: { stayId: string }) {
  const [state, formAction, pending] = useActionState(
    logActivity.bind(null, stayId),
    idleState
  )
  useActionToast(state)
  const [type, setType] = useState<StaffActivityType | null>(null)
  const [showAll, setShowAll] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  // Al guardar, el contador de actividades del servidor cambia y con el la
  // `key` del formulario, que se remonta vacio. Sin efectos ni resets a mano.
  const visibleTypes = showAll ? [...PRIMARY, ...SECONDARY] : PRIMARY

  return (
    <div className="space-y-3">
      <fieldset>
        <legend className="mb-2 text-sm font-bold text-ink">Qué pasó</legend>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {visibleTypes.map((option) => {
            const Icon = icons[option]
            const active = type === option

            return (
              <button
                key={option}
                type="button"
                aria-pressed={active}
                onClick={() => setType(active ? null : option)}
                className={cn(
                  'flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-card border-2 p-2 text-xs font-bold transition-colors',
                  active
                    ? 'border-brand-500 bg-brand-50 text-brand-700'
                    : 'border-line bg-surface text-ink-muted hover:border-navy-300'
                )}
              >
                <Icon className="size-5" aria-hidden />
                {activityTypeLabels[option]}
              </button>
            )
          })}
        </div>

        {!showAll && (
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-brand-700 hover:underline"
          >
            Más tipos
          </button>
        )}
      </fieldset>

      {type && (
        <form
          key={`${type}-${state.status}-${state.message ?? ''}`}
          action={formAction}
          className="space-y-3 rounded-card bg-canvas p-4"
        >
          <input type="hidden" name="type" value={type} />

          <Field errors={state.fieldErrors?.description}>
            <Label>Comentario</Label>
            <Textarea
              name="description"
              rows={2}
              autoFocus
              placeholder={
                type === 'FOOD'
                  ? 'Comió todo.'
                  : type === 'WALK'
                    ? 'Paseo por el sendero.'
                    : 'Opcional'
              }
            />
          </Field>

          <Field>
            <Label>Fotografía</Label>
            <Input type="file" name="photo" accept="image/jpeg,image/png,image/webp" />
          </Field>

          {showDetails ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field errors={state.fieldErrors?.time}>
                <Label>Hora</Label>
                <Input type="time" name="time" />
                <Hint>Vacio registra la hora actual.</Hint>
              </Field>

              <div className="flex items-end">
                {/* El input oculto hace que un checkbox desmarcado si viaje. */}
                <input type="hidden" name="isVisibleToOwner" value="" />
                <label className="flex min-h-11 items-center gap-2.5 text-sm text-ink">
                  <input
                    type="checkbox"
                    name="isVisibleToOwner"
                    value="on"
                    defaultChecked
                    className="size-5 rounded border-line-strong accent-brand-500"
                  />
                  El propietario lo ve
                </label>
              </div>
            </div>
          ) : (
            <>
              <input type="hidden" name="isVisibleToOwner" value="on" />
              <button
                type="button"
                onClick={() => setShowDetails(true)}
                className="inline-flex min-h-11 items-center text-sm font-semibold text-brand-700 hover:underline"
              >
                Cambiar hora o visibilidad
              </button>
            </>
          )}

          <div className="flex flex-wrap gap-2">
            <Button type="submit" loading={pending} loadingLabel="Guardando">
              Guardar {activityTypeLabels[type].toLowerCase()}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setType(null)}>
              Cancelar
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
