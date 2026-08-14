'use client'

import { formatCurrency } from '@/config/business'
import { fromCents, type Quote } from '@/lib/pricing'
import { cn } from '@/lib/utils'

/**
 * Desglose del precio.
 *
 * Se muestra desde que hay servicio y fechas elegidos, no solo al final: el
 * cliente debe saber cuanto va a pagar antes de llegar al ultimo paso.
 */
export function BookingSummary({
  quote,
  taxLabel,
  className,
}: {
  quote: Quote
  taxLabel: string
  className?: string
}) {
  return (
    <dl className={cn('space-y-2 text-sm', className)}>
      {quote.lines.map((line) => (
        <div key={`${line.label}-${line.detail}`} className="flex justify-between gap-4">
          <dt className="text-ink-muted">
            {line.label}
            <span className="text-ink-subtle"> · {line.detail}</span>
          </dt>
          <dd className="shrink-0 font-semibold text-ink tabular-nums">
            {formatCurrency(fromCents(line.amountCents))}
          </dd>
        </div>
      ))}

      <div className="flex justify-between gap-4 border-t border-line pt-2">
        <dt className="text-ink-muted">Subtotal</dt>
        <dd className="font-semibold text-ink tabular-nums">
          {formatCurrency(fromCents(quote.subtotalCents))}
        </dd>
      </div>

      {quote.taxesCents > 0 && (
        <div className="flex justify-between gap-4">
          <dt className="text-ink-muted">{taxLabel}</dt>
          <dd className="font-semibold text-ink tabular-nums">
            {formatCurrency(fromCents(quote.taxesCents))}
          </dd>
        </div>
      )}

      <div className="flex items-baseline justify-between gap-4 border-t border-line pt-2">
        <dt className="font-bold text-navy-900">Total</dt>
        <dd className="text-lg font-extrabold text-navy-900 tabular-nums">
          {formatCurrency(fromCents(quote.totalCents))}
        </dd>
      </div>
    </dl>
  )
}
