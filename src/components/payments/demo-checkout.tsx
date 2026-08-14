'use client'

import { CreditCard, Lock, X } from 'lucide-react'
import { useState, useTransition } from 'react'

import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { completeDemoPayment } from '@/server/actions/payments'

/**
 * Pantalla de cobro simulada.
 *
 * Imita el lugar del flujo que ocupa la pagina del proveedor, pero no pide
 * ningun dato de tarjeta ni lo aparenta: un formulario falso de tarjeta
 * ensenaria a la gente a escribir sus datos donde no debe.
 */
export function DemoCheckout({
  paymentId,
  amount,
  description,
  reservationCode,
}: {
  paymentId: string
  amount: string
  description: string
  reservationCode: string
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function finish(outcome: 'paid' | 'failed') {
    setError(null)
    startTransition(async () => {
      const result = await completeDemoPayment(paymentId, outcome)
      if (result?.status === 'error') setError(result.message ?? 'No se pudo completar.')
    })
  }

  return (
    <div className="w-full max-w-md space-y-5">
      <div className="rounded-card border-2 border-dashed border-warning bg-warning-soft p-4 text-center">
        <p className="text-xs font-extrabold tracking-[0.16em] text-warning uppercase">
          Cobro de demostración
        </p>
        <p className="mt-1 text-sm text-ink">
          No hay pasarela de pago conectada. Aquí no se pide ni se cobra ninguna tarjeta.
        </p>
      </div>

      <div className="rounded-card border border-line bg-surface p-5 shadow-card">
        <div className="flex items-center gap-2 text-ink-muted">
          <CreditCard className="size-4" aria-hidden />
          <span className="text-sm font-semibold">{reservationCode}</span>
        </div>

        <p className="mt-3 text-sm text-ink-muted">{description}</p>
        <p className="mt-1 text-3xl font-extrabold text-navy-900 tabular-nums">{amount}</p>

        {error && (
          <div className="mt-4">
            <Alert tone="danger">{error}</Alert>
          </div>
        )}

        <div className="mt-5 space-y-2">
          <Button
            block
            size="lg"
            loading={pending}
            loadingLabel="Procesando"
            onClick={() => finish('paid')}
          >
            <Lock aria-hidden />
            Simular pago exitoso
          </Button>

          <Button block variant="outline" disabled={pending} onClick={() => finish('failed')}>
            <X aria-hidden />
            Simular pago rechazado
          </Button>
        </div>

        <p className="mt-4 text-center text-xs text-ink-subtle">
          Con Stripe conectado, esta pantalla la sirve Stripe y el pago se confirma por su
          webhook firmado, no desde aquí.
        </p>
      </div>
    </div>
  )
}
