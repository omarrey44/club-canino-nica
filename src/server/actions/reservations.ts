'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { business } from '@/config/business'
import { clubDateTime, formatDate } from '@/lib/datetime'
import { fromCents, quote } from '@/lib/pricing'
import { prisma } from '@/lib/prisma'
import { notify } from '@/server/notifications'
import { reservationStatusLabels } from '@/lib/constants/labels'
import { recordAudit } from '@/server/audit'
import { requireStaff, requireUser } from '@/server/auth/session'
import { findFullDays } from '@/server/queries/availability'
import {
  cancelReservationSchema,
  createReservationSchema,
} from '@/validations/reservation'
import { errorState, successState, type ActionState } from './types'

/**
 * Código corto y legible para buscar en recepción.
 *
 * Se evitan las letras que se confunden al dictarlo por teléfono (I, O, 0, 1).
 */
const CODE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'

function randomCode(): string {
  let suffix = ''
  for (let i = 0; i < 5; i += 1) {
    suffix += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]
  }
  return `CCN-${suffix}`
}

export async function createReservation(input: unknown): Promise<ActionState> {
  const user = await requireUser()

  const parsed = createReservationSchema.safeParse(input)
  if (!parsed.success) {
    return errorState('Revisa los datos de la reserva.', parsed.error.flatten().fieldErrors)
  }

  const { petId, serviceId, startDate, startTime, endDate, endTime, extras, clientNotes } =
    parsed.data

  // La mascota tiene que ser suya. El id viene del navegador, asi que el
  // filtro de propiedad va en la misma consulta.
  const pet = await prisma.pet.findFirst({
    where: { id: petId, ownerId: user.id, organizationId: user.organizationId, isActive: true },
    select: { id: true, name: true },
  })
  if (!pet) return errorState('No encontramos esa mascota.')

  const service = await prisma.service.findFirst({
    where: {
      id: serviceId,
      organizationId: user.organizationId,
      isActive: true,
      kind: { not: 'ADDON' },
    },
  })
  if (!service) return errorState('Ese servicio no está disponible.')

  const startAt = clubDateTime(startDate, startTime)
  const endAt = clubDateTime(endDate, endTime)

  if (endAt <= startAt) {
    return errorState('La salida debe ser posterior a la entrada.')
  }
  // Un margen de una hora tolera que alguien reserve para "hoy mismo" mientras
  // llena el formulario, sin permitir reservas en el pasado.
  if (startAt.getTime() < Date.now() - 3_600_000) {
    return errorState('Esa fecha ya paso. Elige una fecha futura.')
  }

  const requestedExtras = extras.filter((extra) => extra.quantity > 0)
  const extraServices = requestedExtras.length
    ? await prisma.service.findMany({
        where: {
          id: { in: requestedExtras.map((extra) => extra.serviceId) },
          organizationId: user.organizationId,
          isActive: true,
          kind: 'ADDON',
        },
      })
    : []

  if (extraServices.length !== requestedExtras.length) {
    return errorState('Alguno de los servicios adicionales ya no está disponible.')
  }

  const fullDays = await findFullDays(service.id, user.organizationId, startAt, endAt)
  if (fullDays.length > 0) {
    const listed = fullDays.map((day) => formatDate(new Date(`${day}T12:00:00Z`))).join(', ')
    return errorState(
      `Ya no tenemos cupo para ${listed}. Elige otra fecha o escribenos y buscamos una opcion.`
    )
  }

  // El total se calcula aquí, con los precios que estan en base ahora mismo.
  const cotizacion = quote({
    service: {
      id: service.id,
      name: service.name,
      kind: service.kind,
      basePrice: String(service.basePrice),
    },
    extras: requestedExtras.map((extra) => {
      const found = extraServices.find((s) => s.id === extra.serviceId)!
      return {
        quantity: extra.quantity,
        service: {
          id: found.id,
          name: found.name,
          kind: found.kind,
          basePrice: String(found.basePrice),
        },
      }
    }),
    startAt,
    endAt,
    taxRate: business.billing.taxRate,
  })

  // Reintenta si el código aleatorio ya existia. Con 32^5 combinaciones la
  // colision es rara, pero no imposible.
  let created: { id: string; code: string } | null = null
  for (let attempt = 0; attempt < 5 && !created; attempt += 1) {
    const code = randomCode()
    try {
      created = await prisma.reservation.create({
        data: {
          code,
          organizationId: user.organizationId,
          clientId: user.id,
          petId: pet.id,
          serviceId: service.id,
          startAt,
          endAt,
          status: 'PENDING',
          subtotal: fromCents(cotizacion.subtotalCents),
          taxes: fromCents(cotizacion.taxesCents),
          total: fromCents(cotizacion.totalCents),
          currency: business.currency,
          clientNotes,
          extras: {
            create: requestedExtras.map((extra) => {
              const found = extraServices.find((s) => s.id === extra.serviceId)!
              return {
                serviceId: found.id,
                quantity: extra.quantity,
                unitPrice: found.basePrice,
              }
            }),
          },
          payment: {
            create: {
              provider: process.env.PAYMENT_PROVIDER ?? 'demo',
              status: 'PENDING',
              amount: fromCents(cotizacion.totalCents),
              currency: business.currency,
            },
          },
        },
        select: { id: true, code: true },
      })
    } catch (error) {
      const isDuplicateCode =
        typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002'
      if (!isDuplicateCode) {
        console.error('[reservations.create]', error)
        return errorState('No fue posible completar la reservación. Intenta de nuevo.')
      }
    }
  }

  if (!created) {
    return errorState('No fue posible completar la reservación. Intenta de nuevo.')
  }

  await notify({
      organizationId: user.organizationId,
      userId: user.id,
      petId: pet.id,
      type: 'RESERVATION_CONFIRMED',
      title: 'Recibimos tu reservación',
      body: `${pet.name} tiene lugar apartado para el ${formatDate(startAt)}. Te confirmamos en breve.`,
      linkUrl: `/reservas/${created.id}`,
    })

  await recordAudit(user, {
    action: 'RESERVATION_CREATED',
    entityType: 'Reservation',
    entityId: created.id,
    changes: { code: created.code, serviceId: service.id, petId: pet.id },
  })

  revalidatePath('/reservas')
  revalidatePath('/inicio')
  redirect(`/reservas/${created.id}?nueva=1`)
}

export async function cancelReservation(input: unknown): Promise<ActionState> {
  const user = await requireUser()

  const parsed = cancelReservationSchema.safeParse(input)
  if (!parsed.success) return errorState('No pudimos procesar la cancelación.')

  const reservation = await prisma.reservation.findFirst({
    where: { id: parsed.data.reservationId, clientId: user.id },
    select: { id: true, status: true, code: true },
  })
  if (!reservation) return errorState('No encontramos esa reservación.')

  // Una estancia ya iniciada no se cancela desde la app: hay una mascota en el
  // club y eso lo resuelve el personal.
  if (!['PENDING', 'CONFIRMED'].includes(reservation.status)) {
    return errorState(
      'Esta reservación ya no se puede cancelar desde aquí. Escribenos y lo vemos.'
    )
  }

  await prisma.reservation.update({
    where: { id: reservation.id },
    data: {
      status: 'CANCELLED',
      cancelledAt: new Date(),
      cancellationReason: parsed.data.reason,
    },
  })

  await recordAudit(user, {
    action: 'RESERVATION_CANCELLED',
    entityType: 'Reservation',
    entityId: reservation.id,
    changes: { code: reservation.code, from: reservation.status },
  })

  revalidatePath('/reservas')
  revalidatePath(`/reservas/${reservation.id}`)
  revalidatePath('/inicio')
  redirect('/reservas?filtro=cancelled')
}

/**
 * Cambio de estado desde el panel.
 *
 * Solo cubre las transiciones administrativas de esta fase. El check-in crea
 * ademas una estancia, y eso vive en la Fase 4 con su propia accion.
 */
const STAFF_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['CANCELLED'],
}

export async function setReservationStatus(
  reservationId: string,
  nextStatus: 'CONFIRMED' | 'CANCELLED'
): Promise<ActionState> {
  const user = await requireStaff()

  const reservation = await prisma.reservation.findFirst({
    where: { id: reservationId, organizationId: user.organizationId },
    select: { id: true, code: true, status: true, clientId: true, petId: true, startAt: true },
  })
  if (!reservation) return errorState('No encontramos esa reservación.')

  const allowed = STAFF_TRANSITIONS[reservation.status] ?? []
  if (!allowed.includes(nextStatus)) {
    return errorState(
      `Una reservación ${reservationStatusLabels[reservation.status].toLowerCase()} no puede pasar a ese estado.`
    )
  }

  await prisma.reservation.update({
    where: { id: reservation.id },
    data:
      nextStatus === 'CANCELLED'
        ? { status: 'CANCELLED', cancelledAt: new Date() }
        : { status: 'CONFIRMED' },
  })

  if (nextStatus === 'CONFIRMED') {
    await notify({
        organizationId: user.organizationId,
        userId: reservation.clientId,
        petId: reservation.petId,
        type: 'RESERVATION_CONFIRMED',
        title: 'Tu reservación está confirmada',
        body: `Te esperamos el ${formatDate(reservation.startAt)}.`,
        linkUrl: `/reservas/${reservation.id}`,
      })
  }

  await recordAudit(user, {
    action: 'RESERVATION_STATUS_CHANGED',
    entityType: 'Reservation',
    entityId: reservation.id,
    changes: { code: reservation.code, from: reservation.status, to: nextStatus },
  })

  revalidatePath('/admin/reservaciones')
  revalidatePath('/admin')
  return successState('Reservación actualizada.')
}
