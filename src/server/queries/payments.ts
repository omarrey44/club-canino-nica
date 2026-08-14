import 'server-only'

import { prisma } from '@/lib/prisma'
import type { PaymentStatus, Prisma } from '@/generated/prisma/client'

/**
 * Cobros de la organizacion, con totales por estado.
 *
 * Los totales se calculan en la base con `groupBy`, no sumando en memoria:
 * el listado esta paginado y sumar solo lo visible daria cifras equivocadas.
 */
export async function getPayments(
  organizationId: string,
  { status, query }: { status?: PaymentStatus; query?: string } = {}
) {
  const where: Prisma.PaymentWhereInput = {
    reservation: {
      organizationId,
      ...(query
        ? {
            OR: [
              { code: { contains: query, mode: 'insensitive' } },
              { pet: { name: { contains: query, mode: 'insensitive' } } },
              { client: { fullName: { contains: query, mode: 'insensitive' } } },
            ],
          }
        : {}),
    },
    ...(status ? { status } : {}),
  }

  const [payments, totals] = await Promise.all([
    prisma.payment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        status: true,
        amount: true,
        currency: true,
        provider: true,
        providerRef: true,
        paidAt: true,
        refundedAt: true,
        failureReason: true,
        createdAt: true,
        reservation: {
          select: {
            id: true,
            code: true,
            startAt: true,
            pet: { select: { name: true, photoUrl: true } },
            client: { select: { fullName: true } },
            service: { select: { name: true } },
          },
        },
      },
    }),

    prisma.payment.groupBy({
      by: ['status'],
      where: { reservation: { organizationId } },
      _count: { _all: true },
      _sum: { amount: true },
    }),
  ])

  return {
    payments,
    totals: totals.map((row) => ({
      status: row.status,
      count: row._count._all,
      amount: row._sum.amount ? String(row._sum.amount) : '0',
    })),
  }
}

export type PaymentRow = Awaited<ReturnType<typeof getPayments>>['payments'][number]
