'use client'

import { BellRing, LogOut, MapPin } from 'lucide-react'
import { useActionState, useState, useTransition } from 'react'

import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field, Input, Label, Textarea } from '@/components/ui/field'
import { useActionToast } from '@/components/ui/toaster'
import { checkOut, markReadyForPickup, setStayLocation } from '@/server/actions/stays'
import { idleState } from '@/server/actions/types'

/** Cambia el area donde esta la mascota. Es lo que el propietario ve primero. */
export function StayLocationForm({
  stayId,
  currentLocation,
}: {
  stayId: string
  currentLocation: string | null
}) {
  const [state, formAction, pending] = useActionState(setStayLocation, idleState)
  useActionToast(state)

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="stayId" value={stayId} />

      <Field errors={state.fieldErrors?.currentLocation} className="min-w-48 flex-1">
        <Label>Dónde está ahora</Label>
        <Input
          name="currentLocation"
          defaultValue={currentLocation ?? ''}
          placeholder="Área de juegos"
          maxLength={80}
        />
      </Field>

      <Button type="submit" variant="outline" loading={pending} loadingLabel="Guardando">
        <MapPin aria-hidden />
        Actualizar
      </Button>
    </form>
  )
}

export function ReadyForPickupButton({ stayId }: { stayId: string }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="space-y-2">
      <Button
        loading={pending}
        loadingLabel="Avisando"
        onClick={() =>
          startTransition(async () => {
            const result = await markReadyForPickup(stayId)
            if (result.status === 'error') setError(result.message ?? 'No se pudo avisar.')
          })
        }
      >
        <BellRing aria-hidden />
        Avisar que está listo
      </Button>
      {error && <Alert tone="danger">{error}</Alert>}
    </div>
  )
}

/**
 * Cerrar la estancia corta el acceso a cámaras y completa la reservación,
 * asi que pide confirmación en vez de hacerlo de un toque.
 */
export function CheckOutForm({ stayId, petName }: { stayId: string; petName: string }) {
  const [confirming, setConfirming] = useState(false)
  const [state, formAction, pending] = useActionState(checkOut, idleState)
  useActionToast(state)

  if (!confirming) {
    return (
      <Button variant="outline" onClick={() => setConfirming(true)}>
        <LogOut aria-hidden />
        Registrar salida
      </Button>
    )
  }

  return (
    <form action={formAction} className="space-y-3 rounded-card border border-line bg-canvas p-4">
      <input type="hidden" name="stayId" value={stayId} />

      <p className="text-sm font-semibold text-ink">
        Se cierra la estancia de {petName} y el propietario deja de ver las cámaras.
      </p>

      <Field>
        <Label>Observaciones de salida</Label>
        <Textarea name="checkOutNotes" rows={2} placeholder="Opcional" maxLength={400} />
      </Field>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" loading={pending} loadingLabel="Cerrando">
          Confirmar salida
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => setConfirming(false)}
          disabled={pending}
        >
          Mejor no
        </Button>
      </div>
    </form>
  )
}
