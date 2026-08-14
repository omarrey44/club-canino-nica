import { CreditCard, Search } from 'lucide-react'
import Link from 'next/link'
import type { Metadata, Route } from 'next'

import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { PaymentActions } from '@/components/payments/payment-actions'
import { PetAvatar } from '@/components/ui/pet-avatar'
import { StatusBadge } from '@/components/ui/status-badge'
import { formatCurrency } from '@/config/business'
import { formatDate } from '@/lib/datetime'
import { getPayments } from '@/server/queries/payments'
import { isDemoPayments } from '@/server/providers/payment'
import { paymentStatusLabels, paymentStatusTones } from '@/lib/constants/labels'
import { requireStaff } from '@/server/auth/session'
import { cn } from '@/lib/utils'
import type { PaymentStatus } from '@/generated/prisma/client'

export const metadata: Metadata = { title: 'Pagos' }

const FILTERS: PaymentStatus[] = ['PENDING', 'PAID', 'REFUNDED', 'FAILED']

function buildHref(params: Record<string, string | undefined>): Route {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value)
  }
  const query = search.toString()
  return (query ? `/admin/pagos?${query}` : '/admin/pagos') as Route
}

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string; q?: string }>
}) {
  const user = await requireStaff()
  const { estado, q } = await searchParams

  const status = FILTERS.includes(estado as PaymentStatus)
    ? (estado as PaymentStatus)
    : undefined

  const { payments, totals } = await getPayments(user.organizationId, {
    status,
    query: q?.trim() || undefined,
  })

  // El reembolso mueve dinero: solo administración.
  const canRefund = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN'
  const totalOf = (value: PaymentStatus) => totals.find((row) => row.status === value)

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Cobros"
        title="Pagos"
        description="Qué está cobrado, qué falta y qué se reembolsó."
      />

      {isDemoPayments && (
        <Alert tone="warning">
          No hay pasarela de pago conectada. Los cobros que se ven aquí son de{' '}
          <strong>demostración</strong> y su referencia empieza con <code>demo_</code>.
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {FILTERS.map((option) => {
          const row = totalOf(option)
          return (
            <div key={option} className="rounded-card border border-line bg-surface p-4">
              <div className="flex items-center justify-between gap-2">
                <StatusBadge tone={paymentStatusTones[option]}>
                  {paymentStatusLabels[option]}
                </StatusBadge>
                <span className="text-sm font-semibold text-ink-muted tabular-nums">
                  {row?.count ?? 0}
                </span>
              </div>
              <p className="mt-2 text-lg font-extrabold text-navy-900 tabular-nums">
                {formatCurrency(row?.amount ?? '0')}
              </p>
            </div>
          )
        })}
      </div>

      <form className="flex flex-col gap-3 sm:flex-row" role="search">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-subtle"
            aria-hidden
          />
          <input
            type="search"
            name="q"
            defaultValue={q ?? ''}
            placeholder="Código, mascota o cliente"
            aria-label="Buscar cobros"
            className="h-12 w-full rounded-field border border-line-strong bg-surface pr-3.5 pl-10 text-base text-ink placeholder:text-ink-subtle"
          />
        </div>
        {status && <input type="hidden" name="estado" value={status} />}
        <Button type="submit" variant="outline">
          Buscar
        </Button>
      </form>

      <nav aria-label="Filtrar por estado" className="flex gap-2 overflow-x-auto pb-1">
        <Link
          href={buildHref({ q })}
          aria-current={!status ? 'page' : undefined}
          className={cn(
            'flex min-h-11 items-center rounded-pill px-4 text-sm font-semibold whitespace-nowrap transition-colors',
            !status
              ? 'bg-navy-800 text-white'
              : 'border border-line-strong bg-surface text-ink-muted hover:text-ink'
          )}
        >
          Todos
        </Link>
        {FILTERS.map((option) => (
          <Link
            key={option}
            href={buildHref({ q, estado: option })}
            aria-current={status === option ? 'page' : undefined}
            className={cn(
              'flex min-h-11 items-center rounded-pill px-4 text-sm font-semibold whitespace-nowrap transition-colors',
              status === option
                ? 'bg-navy-800 text-white'
                : 'border border-line-strong bg-surface text-ink-muted hover:text-ink'
            )}
          >
            {paymentStatusLabels[option]}
          </Link>
        ))}
      </nav>

      {payments.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title={q ? `Sin resultados para "${q}"` : 'No hay cobros en esta vista'}
          description="Cada reservación crea su cobro. Aquí se registran los pagos y los reembolsos."
        />
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
          {payments.map((payment) => (
            <li key={payment.id} className="flex flex-wrap items-center gap-3 p-4">
              <PetAvatar
                name={payment.reservation.pet.name}
                photoUrl={payment.reservation.pet.photoUrl}
              />

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/reservas/${payment.reservation.id}`}
                    className="font-bold text-navy-900 hover:underline"
                  >
                    {payment.reservation.pet.name}
                  </Link>
                  <StatusBadge tone={paymentStatusTones[payment.status]}>
                    {paymentStatusLabels[payment.status]}
                  </StatusBadge>
                  {payment.providerRef?.startsWith('demo_') && (
                    <StatusBadge tone="info" showDot={false}>
                      Demostración
                    </StatusBadge>
                  )}
                </div>

                <p className="truncate text-sm text-ink-muted">
                  {payment.reservation.client.fullName} · {payment.reservation.service.name} ·{' '}
                  {payment.reservation.code}
                </p>

                <p className="text-sm text-ink-muted">
                  {payment.paidAt
                    ? `Pagado el ${formatDate(payment.paidAt)}`
                    : payment.refundedAt
                      ? `Reembolsado el ${formatDate(payment.refundedAt)}`
                      : `Creado el ${formatDate(payment.createdAt)}`}
                </p>

                {payment.failureReason && (
                  <p className="text-sm text-danger">{payment.failureReason}</p>
                )}
              </div>

              <p className="shrink-0 font-extrabold text-navy-900 tabular-nums">
                {formatCurrency(String(payment.amount))}
              </p>

              <PaymentActions
                paymentId={payment.id}
                status={payment.status}
                canRefund={canRefund}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
