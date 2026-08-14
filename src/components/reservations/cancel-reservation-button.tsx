'use client'

import { X } from 'lucide-react'
import { useState, useTransition } from 'react'

import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field, Input, Label } from '@/components/ui/field'
import { cancelReservation } from '@/server/actions/reservations'

/**
 * Cancelar es irreversible desde la app, asi que pide confirmacion explicita
 * en vez de un solo toque.
 */
export function CancelReservationButton({ reservationId }: { reservationId: string }) {
  const [confirming, setConfirming] = useState(false)
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  if (!confirming) {
    return (
      <Button variant="outline" onClick={() => setConfirming(true)}>
        <X aria-hidden />
        Cancelar reservacion
      </Button>
    )
  }

  return (
    <div className="w-full space-y-3 rounded-card border border-danger/30 bg-danger-soft p-4">
      <p className="text-sm font-semibold text-ink">
        Se cancelara esta reservacion y el lugar quedara libre. No se puede deshacer.
      </p>

      {error && <Alert tone="danger">{error}</Alert>}

      <Field>
        <Label>Motivo</Label>
        <Input
          value={reason}
          maxLength={240}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Opcional"
        />
      </Field>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="danger"
          loading={pending}
          loadingLabel="Cancelando"
          onClick={() =>
            startTransition(async () => {
              const result = await cancelReservation({ reservationId, reason })
              if (result?.status === 'error') {
                setError(result.message ?? 'No pudimos cancelar la reservacion.')
              }
            })
          }
        >
          Si, cancelar
        </Button>
        <Button variant="ghost" onClick={() => setConfirming(false)} disabled={pending}>
          Mejor no
        </Button>
      </div>
    </div>
  )
}
