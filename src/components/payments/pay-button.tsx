'use client'

import { CreditCard } from 'lucide-react'
import { useEffect, useState, useTransition } from 'react'

import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { startCheckout, verifyPayment } from '@/server/actions/payments'

export function PayButton({
  reservationId,
  amount,
}: {
  reservationId: string
  amount: string
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="space-y-2">
      <Button
        size="lg"
        loading={pending}
        loadingLabel="Abriendo el pago"
        onClick={() => {
          setError(null)
          startTransition(async () => {
            const result = await startCheckout(reservationId)
            // Si todo va bien la accion redirige y esto no se ejecuta.
            if (result?.status === 'error') setError(result.message ?? 'No se pudo abrir el pago.')
          })
        }}
      >
        <CreditCard aria-hidden />
        Pagar {amount}
      </Button>

      {error && <Alert tone="danger">{error}</Alert>}
    </div>
  )
}

/**
 * Mensaje al volver de la pantalla de pago.
 *
 * Cuando el proveedor devuelve al cliente, se le pregunta a el cual es el
 * estado real: haber llegado a la URL de exito no prueba nada, cualquiera puede
 * escribirla a mano.
 */
export function PaymentReturnNotice({
  reservationId,
  outcome,
}: {
  reservationId: string
  outcome: string
}) {
  const [state, setState] = useState<{ tone: 'info' | 'success' | 'warning'; text: string }>(
    outcome === 'verificando'
      ? { tone: 'info', text: 'Confirmando tu pago con el proveedor…' }
      : outcome === 'listo'
        ? { tone: 'success', text: 'Listo, recibimos tu pago. Tu reservación está confirmada.' }
        : outcome === 'fallido'
          ? { tone: 'warning', text: 'El pago no se completó. Puedes intentarlo de nuevo.' }
          : { tone: 'warning', text: 'Cancelaste el pago. Tu reservación sigue apartada.' }
  )
  const [, startTransition] = useTransition()

  useEffect(() => {
    if (outcome !== 'verificando') return

    startTransition(async () => {
      const result = await verifyPayment(reservationId)
      setState(
        result.status === 'success'
          ? { tone: 'success', text: 'Listo, recibimos tu pago. Tu reservación está confirmada.' }
          : {
              tone: 'warning',
              text: result.message ?? 'Todavía no vemos el pago confirmado.',
            }
      )
    })
  }, [outcome, reservationId])

  return <Alert tone={state.tone}>{state.text}</Alert>
}
