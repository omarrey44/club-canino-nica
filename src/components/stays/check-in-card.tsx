'use client'

import { AlertTriangle, LogIn } from 'lucide-react'
import { useActionState, useState } from 'react'

import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field, Input, Label, Textarea } from '@/components/ui/field'
import { PetAvatar } from '@/components/ui/pet-avatar'
import { checkIn } from '@/server/actions/stays'
import { idleState } from '@/server/actions/types'

export type CheckInCardData = {
  reservationId: string
  code: string
  scheduled: string
  serviceName: string
  clientName: string
  clientPhone: string | null
  pet: { name: string; breed: string | null; photoUrl: string | null }
  /** Lo que el cuidador tiene que saber antes de recibirla. */
  alerts: string[]
}

/**
 * Ficha de ingreso.
 *
 * Muestra las alertas de cuidado antes de confirmar la llegada: alergias y
 * medicamentos importan justo en este momento, no enterrados en la ficha.
 */
export function CheckInCard({ data }: { data: CheckInCardData }) {
  const [open, setOpen] = useState(false)
  const [state, formAction, pending] = useActionState(checkIn, idleState)

  return (
    <article className="rounded-card border border-line bg-surface p-4 shadow-card">
      <div className="flex flex-wrap items-center gap-3.5">
        <PetAvatar name={data.pet.name} photoUrl={data.pet.photoUrl} size="lg" />

        <div className="min-w-0 flex-1">
          <p className="font-extrabold text-navy-900">{data.pet.name}</p>
          <p className="text-sm text-ink-muted">
            {data.clientName} · {data.serviceName}
          </p>
          <p className="text-sm text-ink-muted tabular-nums">
            Llega {data.scheduled} · {data.code}
          </p>
        </div>

        {!open && (
          <Button onClick={() => setOpen(true)}>
            <LogIn aria-hidden />
            Registrar ingreso
          </Button>
        )}
      </div>

      {data.alerts.length > 0 && (
        <div className="mt-3">
          <Alert tone="warning">
            <span className="flex items-start gap-1.5">
              <AlertTriangle className="sr-only" aria-hidden />
              <span>
                {data.alerts.map((alert) => (
                  <span key={alert} className="block">
                    {alert}
                  </span>
                ))}
              </span>
            </span>
          </Alert>
        </div>
      )}

      {open && (
        <form action={formAction} className="mt-4 space-y-3 rounded-field bg-canvas p-4">
          <input type="hidden" name="reservationId" value={data.reservationId} />

          {state.status === 'error' && state.message && (
            <Alert tone="danger">{state.message}</Alert>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <Field errors={state.fieldErrors?.currentLocation}>
              <Label>Área inicial</Label>
              <Input
                name="currentLocation"
                defaultValue="Recepción"
                maxLength={80}
                autoFocus
              />
            </Field>

            <Field errors={state.fieldErrors?.checkInNotes} className="sm:col-span-2">
              <Label>Observaciones de llegada</Label>
              <Textarea
                name="checkInNotes"
                rows={2}
                maxLength={400}
                placeholder="Llego con su cobija y correa."
              />
            </Field>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="submit" loading={pending} loadingLabel="Registrando">
              <LogIn aria-hidden />
              Confirmar llegada de {data.pet.name}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
              Cancelar
            </Button>
          </div>
        </form>
      )}
    </article>
  )
}
