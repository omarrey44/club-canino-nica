import 'server-only'

import { prisma } from '@/lib/prisma'
import type { SessionUser } from '@/server/auth/session'

/**
 * Todo lo que necesita la portada del cliente, en una sola ida a la base.
 *
 * Se resuelve en paralelo porque las tres consultas son independientes: la
 * portada no debe tardar la suma de las tres.
 */
export async function getClientHome(user: SessionUser) {
  const [activeStay, nextReservation, petCount] = await Promise.all([
    prisma.stay.findFirst({
      where: {
        status: { in: ['ACTIVE', 'READY_FOR_PICKUP'] },
        pet: { ownerId: user.id },
      },
      orderBy: { checkInAt: 'desc' },
      select: {
        id: true,
        status: true,
        checkInAt: true,
        expectedCheckOutAt: true,
        currentLocation: true,
        pet: { select: { id: true, name: true, photoUrl: true, breed: true } },
        reservation: { select: { service: { select: { name: true } } } },
        // El timeline de la portada es un resumen: el detalle vive en /mi-mascota.
        activities: {
          where: { isVisibleToOwner: true },
          orderBy: { occurredAt: 'desc' },
          take: 5,
          select: { id: true, type: true, occurredAt: true, description: true },
        },
        photos: {
          orderBy: { takenAt: 'desc' },
          take: 1,
          select: { id: true, url: true, caption: true, takenAt: true },
        },
      },
    }),

    prisma.reservation.findFirst({
      where: {
        clientId: user.id,
        status: { in: ['PENDING', 'CONFIRMED'] },
        startAt: { gte: new Date() },
      },
      orderBy: { startAt: 'asc' },
      select: {
        id: true,
        code: true,
        status: true,
        startAt: true,
        endAt: true,
        total: true,
        currency: true,
        pet: { select: { id: true, name: true, photoUrl: true } },
        service: { select: { name: true } },
      },
    }),

    prisma.pet.count({ where: { ownerId: user.id, isActive: true } }),
  ])

  return { activeStay, nextReservation, petCount }
}

export type ClientHome = Awaited<ReturnType<typeof getClientHome>>
export type ActiveStay = NonNullable<ClientHome['activeStay']>
