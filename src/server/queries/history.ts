import 'server-only'

import { prisma } from '@/lib/prisma'
import { isStaff, type SessionUser } from '@/server/auth/session'

/**
 * Filtro de propiedad para el historial.
 *
 * Va siempre junto al id en el mismo `where`: un cliente solo alcanza las
 * estancias de sus mascotas, el personal las de su organizacion.
 */
function reachableStay(user: SessionUser) {
  return isStaff(user.role)
    ? { reservation: { organizationId: user.organizationId } }
    : { pet: { ownerId: user.id } }
}

/** Estancias pasadas de una mascota, de la mas reciente a la mas antigua. */
export async function getPetHistory(petId: string, user: SessionUser) {
  return prisma.stay.findMany({
    where: {
      petId,
      status: { in: ['COMPLETED', 'CANCELLED'] },
      ...reachableStay(user),
    },
    orderBy: { checkInAt: 'desc' },
    take: 60,
    select: {
      id: true,
      status: true,
      checkInAt: true,
      checkOutAt: true,
      reservation: {
        select: {
          code: true,
          total: true,
          status: true,
          service: { select: { name: true, kind: true } },
          payment: { select: { status: true } },
        },
      },
      _count: { select: { activities: true, photos: true } },
      reports: { select: { id: true }, take: 1 },
    },
  })
}

export type HistoryRow = Awaited<ReturnType<typeof getPetHistory>>[number]

/**
 * Una estancia pasada con todo lo que ocurrio: actividades, fotos, reporte y
 * el cobro. Es lo que el propietario abre desde el historial.
 */
export async function getPastStay(stayId: string, user: SessionUser) {
  const staff = isStaff(user.role)

  return prisma.stay.findFirst({
    where: { id: stayId, ...reachableStay(user) },
    select: {
      id: true,
      status: true,
      checkInAt: true,
      checkOutAt: true,
      checkInNotes: true,
      checkOutNotes: true,
      pet: { select: { id: true, name: true, photoUrl: true, breed: true } },
      reservation: {
        select: {
          id: true,
          code: true,
          subtotal: true,
          taxes: true,
          total: true,
          service: { select: { name: true } },
          payment: { select: { status: true, paidAt: true } },
        },
      },
      activities: {
        // El propietario nunca ve las notas internas, tampoco en el historial.
        where: staff ? {} : { isVisibleToOwner: true },
        orderBy: { occurredAt: 'asc' },
        select: {
          id: true,
          type: true,
          occurredAt: true,
          description: true,
          photoUrl: true,
          isVisibleToOwner: true,
        },
      },
      photos: {
        orderBy: { takenAt: 'asc' },
        select: { id: true, url: true, caption: true, takenAt: true, isFeatured: true },
      },
      reports: {
        where: staff ? {} : { publishedAt: { not: null } },
        orderBy: { reportDate: 'asc' },
        include: { author: { select: { fullName: true } } },
      },
    },
  })
}

export type PastStay = NonNullable<Awaited<ReturnType<typeof getPastStay>>>
