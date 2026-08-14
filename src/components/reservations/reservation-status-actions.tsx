'use client'

import { Check, X } from 'lucide-react'
import { useState, useTransition } from 'react'

import { Button } from '@/components/ui/button'
import { setReservationStatus } from '@/server/actions/reservations'

/**
 * Acciones rapidas de recepcion. Solo aparecen las transiciones que el estado
 * actual permite, para que nadie tenga que recordar cual aplica.
 */
export function ReservationStatusActions({
  reservationId,
  status,
}: {
  reservationId: string
  status: string
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const canConfirm = status === 'PENDING'
  const canCancel = status === 'PENDING' || status === 'CONFIRMED'

  if (!canConfirm && !canCancel) return null

  function run(next: 'CONFIRMED' | 'CANCELLED') {
    setError(null)
    startTransition(async () => {
      const result = await setReservationStatus(reservationId, next)
      if (result.status === 'error') setError(result.message ?? 'No se pudo actualizar.')
    })
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-1.5">
        {canConfirm && (
          <Button size="sm" loading={pending} onClick={() => run('CONFIRMED')}>
            <Check aria-hidden />
            Confirmar
          </Button>
        )}
        {canCancel && (
          <Button
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => run('CANCELLED')}
          >
            <X aria-hidden />
            <span className="sr-only">Cancelar reservacion</span>
          </Button>
        )}
      </div>
      {error && <p className="text-2xs text-danger">{error}</p>}
    </div>
  )
}
