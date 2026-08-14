'use client'

import { BanknoteArrowDown, Check } from 'lucide-react'
import { useState, useTransition } from 'react'

import { Button } from '@/components/ui/button'
import { markPaymentPaidManually, refundPayment } from '@/server/actions/payments'

/**
 * Acciones de un cobro en el panel.
 *
 * "Registrar pago" existe porque una guardería cobra en efectivo o por
 * transferencia todos los días; sin eso el panel mostraría como pendientes
 * cobros que ya entraron.
 */
export function PaymentActions({
  paymentId,
  status,
  canRefund,
}: {
  paymentId: string
  status: string
  canRefund: boolean
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [confirmingRefund, setConfirmingRefund] = useState(false)

  function run(work: () => Promise<{ status: string; message?: string }>) {
    setError(null)
    startTransition(async () => {
      const result = await work()
      if (result.status === 'error') setError(result.message ?? 'No se pudo completar.')
      else setConfirmingRefund(false)
    })
  }

  const isPaid = status === 'PAID'
  const isOpen = status === 'PENDING' || status === 'FAILED'

  if (!isOpen && !(isPaid && canRefund)) return null

  return (
    <div className="flex flex-col items-end gap-1.5">
      {isOpen && (
        <Button
          size="sm"
          variant="outline"
          loading={pending}
          onClick={() => run(() => markPaymentPaidManually(paymentId))}
        >
          <Check aria-hidden />
          Registrar pago
        </Button>
      )}

      {isPaid && canRefund && !confirmingRefund && (
        <Button size="sm" variant="ghost" onClick={() => setConfirmingRefund(true)}>
          <BanknoteArrowDown aria-hidden />
          Reembolsar
        </Button>
      )}

      {isPaid && canRefund && confirmingRefund && (
        <div className="flex gap-1.5">
          <Button
            size="sm"
            variant="danger"
            loading={pending}
            onClick={() => run(() => refundPayment(paymentId))}
          >
            Confirmar reembolso
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={pending}
            onClick={() => setConfirmingRefund(false)}
          >
            No
          </Button>
        </div>
      )}

      {error && <p className="max-w-56 text-right text-2xs text-danger">{error}</p>}
    </div>
  )
}
