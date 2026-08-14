import 'server-only'

import { prisma } from '@/lib/prisma'
import { clubDayRange } from '@/lib/datetime'
import { isStaff, type SessionUser } from '@/server/auth/session'
import type { Prisma, ReservationStatus } from '@/generated/prisma/client'

export type ClientReservationFilter = 'upcoming' | 'active' | 'past' | 'cancelled'

const statusesByFilter: Record<ClientReservationFilter, ReservationStatus[]> = {
  upcoming: ['PENDING', 'CONFIRMED'],
  active: ['CHECKED_IN', 'IN_PROGRESS', 'READY_FOR_PICKUP'],
  past: ['COMPLETED'],
  cancelled: ['CANCELLED'],
}

export const clientFilterLabels: Record<ClientReservationFilter, string> = {
  upcoming: 'Proximas',
  active: 'Activas',
  past: 'Finalizadas',
  cancelled: 'Canceladas',
}

const cardSelect = {
  id: true,
  code: true,
  status: true,
  startAt: true,
  endAt: true,
  total: true,
  currency: true,
  pet: { select: { id: true, name: true, photoUrl: true } },
  service: { select: { name: true, kind: true } },
} as const

export async function getClientReservations(
  user: SessionUser,
  filter: ClientReservationFilter
) {
  return prisma.reservation.findMany({
    where: { clientId: user.id, status: { in: statusesByFilter[filter] } },
    // Las proximas se leen de la mas cercana en adelante; el historial, al reves.
    orderBy: { startAt: filter === 'upcoming' || filter === 'active' ? 'asc' : 'desc' },
    take: 100,
    select: cardSelect,
  })
}

/**
 * Detalle de una reservacion.
 *
 * El filtro de propiedad va en el mismo `where` que el id: un cliente solo
 * alcanza las suyas, el personal las de su organizacion.
 */
export async function getReservationDetail(reservationId: string, user: SessionUser) {
  return prisma.reservation.findFirst({
    where: {
      id: reservationId,
      ...(isStaff(user.role)
        ? { organizationId: user.organizationId }
        : { clientId: user.id }),
    },
    include: {
      pet: { select: { id: true, name: true, photoUrl: true, breed: true } },
      service: true,
      extras: { include: { service: { select: { name: true, kind: true } } } },
      payment: true,
      client: { select: { id: true, fullName: true, email: true, phone: true } },
      stay: { select: { id: true, status: true, checkInAt: true } },
    },
  })
}

export type ReservationDetail = NonNullable<Awaited<ReturnType<typeof getReservationDetail>>>

export type AdminAgendaRange = 'day' | 'week'

/**
 * Agenda del panel.
 *
 * Devuelve las reservaciones que se solapan con la ventana pedida, no solo las
 * que empiezan dentro: un hospedaje que arranco el lunes sigue ocupando el
 * miercoles y tiene que verse.
 */
export async function getAdminAgenda(
  organizationId: string,
  {
    range = 'day',
    from = new Date(),
    status,
    serviceId,
  }: {
    range?: AdminAgendaRange
    from?: Date
    status?: ReservationStatus
    serviceId?: string
  } = {}
) {
  const { start } = clubDayRange(from)
  const end = new Date(start.getTime() + (range === 'week' ? 7 : 1) * 86_400_000)

  const where: Prisma.ReservationWhereInput = {
    organizationId,
    startAt: { lt: end },
    endAt: { gte: start },
    ...(status ? { status } : {}),
    ...(serviceId ? { serviceId } : {}),
  }

  const [reservations, byStatus] = await Promise.all([
    prisma.reservation.findMany({
      where,
      orderBy: { startAt: 'asc' },
      take: 300,
      select: {
        ...cardSelect,
        clientNotes: true,
        client: { select: { id: true, fullName: true, phone: true } },
        stay: { select: { id: true, status: true } },
      },
    }),
    prisma.reservation.groupBy({
      by: ['status'],
      where,
      _count: { _all: true },
    }),
  ])

  return {
    start,
    end,
    reservations,
    counts: Object.fromEntries(byStatus.map((row) => [row.status, row._count._all])) as Partial<
      Record<ReservationStatus, number>
    >,
  }
}

export type AdminAgendaRow = Awaited<ReturnType<typeof getAdminAgenda>>['reservations'][number]
