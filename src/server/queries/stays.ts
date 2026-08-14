import 'server-only'

import { prisma } from '@/lib/prisma'
import { clubDayRange } from '@/lib/datetime'
import { isStaff, type SessionUser } from '@/server/auth/session'

/**
 * Reservaciones que pueden ingresar hoy.
 *
 * Solo confirmadas y del día: una reservación pendiente de confirmar no deberia
 * poder entrar sin que alguien la revise primero.
 */
export async function getCheckInCandidates(organizationId: string) {
  const { start, end } = clubDayRange()

  return prisma.reservation.findMany({
    where: {
      organizationId,
      status: 'CONFIRMED',
      startAt: { gte: start, lt: end },
      stay: null,
    },
    orderBy: { startAt: 'asc' },
    select: {
      id: true,
      code: true,
      startAt: true,
      endAt: true,
      pet: {
        select: {
          id: true,
          name: true,
          photoUrl: true,
          breed: true,
          medicalInfo: {
            select: { allergies: true, medications: true, specialNotes: true },
          },
        },
      },
      client: { select: { fullName: true, phone: true } },
      service: { select: { name: true } },
    },
  })
}

export type CheckInCandidate = Awaited<ReturnType<typeof getCheckInCandidates>>[number]

/** Mascotas que estan en el club ahora mismo. */
export async function getActiveStays(organizationId: string) {
  return prisma.stay.findMany({
    where: {
      reservation: { organizationId },
      status: { in: ['ACTIVE', 'READY_FOR_PICKUP'] },
    },
    orderBy: { checkInAt: 'asc' },
    select: {
      id: true,
      status: true,
      checkInAt: true,
      expectedCheckOutAt: true,
      currentLocation: true,
      pet: { select: { id: true, name: true, photoUrl: true, breed: true } },
      reservation: {
        select: {
          code: true,
          service: { select: { name: true, kind: true } },
          client: { select: { fullName: true, phone: true } },
        },
      },
      _count: { select: { activities: true, photos: true } },
      activities: {
        orderBy: { occurredAt: 'desc' },
        take: 1,
        select: { type: true, occurredAt: true },
      },
    },
  })
}

export type ActiveStayRow = Awaited<ReturnType<typeof getActiveStays>>[number]

/**
 * Detalle de una estancia.
 *
 * El personal ve todo; el propietario solo las actividades marcadas como
 * visibles. El filtro va en la consulta, no en el componente: si vive en la
 * interfaz, el dato igual viajo al navegador.
 */
export async function getStayDetail(stayId: string, user: SessionUser) {
  const staff = isStaff(user.role)

  return prisma.stay.findFirst({
    where: {
      id: stayId,
      ...(staff
        ? { reservation: { organizationId: user.organizationId } }
        : { pet: { ownerId: user.id } }),
    },
    select: {
      id: true,
      status: true,
      checkInAt: true,
      expectedCheckOutAt: true,
      checkOutAt: true,
      currentLocation: true,
      checkInNotes: true,
      checkOutNotes: true,
      pet: {
        select: {
          id: true,
          name: true,
          photoUrl: true,
          breed: true,
          medicalInfo: {
            select: {
              allergies: true,
              medications: true,
              dietNotes: true,
              feedingSchedule: true,
              specialNotes: true,
            },
          },
        },
      },
      reservation: {
        select: {
          id: true,
          code: true,
          service: { select: { name: true, kind: true } },
          client: { select: { id: true, fullName: true, phone: true } },
        },
      },
      activities: {
        where: staff ? {} : { isVisibleToOwner: true },
        orderBy: { occurredAt: 'desc' },
        select: {
          id: true,
          type: true,
          occurredAt: true,
          description: true,
          photoUrl: true,
          isVisibleToOwner: true,
          recordedBy: { select: { fullName: true } },
        },
      },
      photos: {
        orderBy: { takenAt: 'desc' },
        select: { id: true, url: true, caption: true, takenAt: true },
      },
    },
  })
}

export type StayDetail = NonNullable<Awaited<ReturnType<typeof getStayDetail>>>

/** La estancia activa de las mascotas del cliente, para "Mi mascota hoy". */
export async function getMyActiveStay(user: SessionUser) {
  const stay = await prisma.stay.findFirst({
    where: { pet: { ownerId: user.id }, status: { in: ['ACTIVE', 'READY_FOR_PICKUP'] } },
    orderBy: { checkInAt: 'desc' },
    select: { id: true },
  })

  return stay ? getStayDetail(stay.id, user) : null
}

/** Ultima estancia finalizada, para no dejar la pantalla vacia fuera de horario. */
export async function getMyLastStay(user: SessionUser) {
  return prisma.stay.findFirst({
    where: { pet: { ownerId: user.id }, status: 'COMPLETED' },
    orderBy: { checkOutAt: 'desc' },
    select: {
      id: true,
      checkInAt: true,
      checkOutAt: true,
      pet: { select: { id: true, name: true, photoUrl: true } },
    },
  })
}
