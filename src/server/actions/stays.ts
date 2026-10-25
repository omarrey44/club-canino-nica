'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { prisma } from '@/lib/prisma'
import { notify } from '@/server/notifications'
import { formatTime } from '@/lib/datetime'
import { recordAudit } from '@/server/audit'
import { requireStaff } from '@/server/auth/session'
import { checkInSchema, checkOutSchema, stayLocationSchema } from '@/validations/stay'
import { errorState, successState, type ActionState } from './types'

/**
 * Registra la llegada y abre la estancia.
 *
 * La reservación pasa a IN_PROGRESS ("En estancia"). El enum conserva
 * CHECKED_IN para un flujo futuro donde se registre la llegada antes de que la
 * estancia empiece formalmente; hoy no se usa.
 */
export async function checkIn(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireStaff()

  const parsed = checkInSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return errorState('Revisa los datos del ingreso.', parsed.error.flatten().fieldErrors)
  }

  const reservation = await prisma.reservation.findFirst({
    where: {
      id: parsed.data.reservationId,
      organizationId: user.organizationId,
      status: 'CONFIRMED',
      stay: null,
    },
    select: {
      id: true,
      code: true,
      endAt: true,
      petId: true,
      clientId: true,
      pet: { select: { name: true } },
    },
  })

  // Cubre tanto una reservación inexistente como una que ya ingreso: en ambos
  // casos el mensaje util es el mismo.
  if (!reservation) {
    return errorState('Esa reservación ya ingresó o no está confirmada para hoy.')
  }

  const now = new Date()

  // Estancia, evento de llegada y aviso al propietario van juntos: si algo
  // falla, no queda una estancia abierta sin rastro ni el cliente con un aviso
  // de algo que no ocurrio.
  const stay = await prisma.$transaction(async (tx) => {
    const created = await tx.stay.create({
      data: {
        reservationId: reservation.id,
        petId: reservation.petId,
        status: 'ACTIVE',
        checkInAt: now,
        expectedCheckOutAt: reservation.endAt,
        checkedInById: user.id,
        currentLocation: parsed.data.currentLocation,
        checkInNotes: parsed.data.checkInNotes,
      },
      select: { id: true },
    })

    await tx.reservation.update({
      where: { id: reservation.id },
      data: { status: 'IN_PROGRESS' },
    })

    await tx.petActivity.create({
      data: {
        stayId: created.id,
        petId: reservation.petId,
        type: 'CHECK_IN',
        occurredAt: now,
        description: `${reservation.pet.name} llego a Club Canino.`,
        recordedById: user.id,
      },
    })

    await notify({
        organizationId: user.organizationId,
        userId: reservation.clientId,
        petId: reservation.petId,
        type: 'CHECK_IN',
        title: `${reservation.pet.name} ya está en el club`,
        body: `Ingreso a las ${formatTime(now)}. Te vamos contando como le va.`,
        linkUrl: '/mi-mascota',
      }, tx)

    return created
  })

  await recordAudit(user, {
    action: 'STAY_CHECKED_IN',
    entityType: 'Stay',
    entityId: stay.id,
    changes: { reservationCode: reservation.code, petId: reservation.petId },
  })

  revalidatePath('/admin')
  revalidatePath('/admin/estancias')
  revalidatePath('/admin/check-in')
  redirect(`/admin/estancias/${stay.id}`)
}

/** Avisa al propietario que puede pasar por su mascota. */
export async function markReadyForPickup(stayId: string): Promise<ActionState> {
  const user = await requireStaff()

  const stay = await prisma.stay.findFirst({
    where: { id: stayId, reservation: { organizationId: user.organizationId }, status: 'ACTIVE' },
    select: {
      id: true,
      petId: true,
      pet: { select: { name: true } },
      reservation: { select: { id: true, clientId: true } },
    },
  })
  if (!stay) return errorState('Esa estancia no está activa.')

  await prisma.$transaction(async (tx) => {
    await tx.stay.update({ where: { id: stay.id }, data: { status: 'READY_FOR_PICKUP' } })
    await tx.reservation.update({
      where: { id: stay.reservation.id },
      data: { status: 'READY_FOR_PICKUP' },
    })
    await notify(
      {
        organizationId: user.organizationId,
        userId: stay.reservation.clientId,
        petId: stay.petId,
        type: 'READY_FOR_PICKUP',
        title: `${stay.pet.name} está listo`,
        body: `${stay.pet.name} terminó su día y te está esperando.`,
        linkUrl: '/mi-mascota',
      },
      tx
    )
  })

  await recordAudit(user, {
    action: 'STAY_READY_FOR_PICKUP',
    entityType: 'Stay',
    entityId: stay.id,
  })

  revalidatePath('/admin/estancias')
  revalidatePath(`/admin/estancias/${stay.id}`)
  return successState('Avisamos al propietario.')
}

/** Cierra la estancia. La reservación queda completada. */
export async function checkOut(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireStaff()

  const parsed = checkOutSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return errorState('Revisa los datos de la salida.')

  const stay = await prisma.stay.findFirst({
    where: {
      id: parsed.data.stayId,
      reservation: { organizationId: user.organizationId },
      status: { in: ['ACTIVE', 'READY_FOR_PICKUP'] },
    },
    select: {
      id: true,
      petId: true,
      pet: { select: { name: true } },
      reservation: { select: { id: true, code: true } },
    },
  })
  if (!stay) return errorState('Esa estancia ya está cerrada.')

  const now = new Date()

  await prisma.$transaction([
    prisma.stay.update({
      where: { id: stay.id },
      data: {
        status: 'COMPLETED',
        checkOutAt: now,
        checkedOutById: user.id,
        checkOutNotes: parsed.data.checkOutNotes,
      },
    }),
    prisma.reservation.update({
      where: { id: stay.reservation.id },
      data: { status: 'COMPLETED' },
    }),
    prisma.petActivity.create({
      data: {
        stayId: stay.id,
        petId: stay.petId,
        type: 'CHECK_OUT',
        occurredAt: now,
        description: `${stay.pet.name} salió de Club Canino.`,
        recordedById: user.id,
      },
    }),
    // Al cerrar la estancia se cortan los accesos a cámara asociados.
    prisma.cameraAccess.updateMany({
      where: { stayId: stay.id, revokedAt: null },
      data: { revokedAt: now },
    }),
  ])

  await recordAudit(user, {
    action: 'STAY_CHECKED_OUT',
    entityType: 'Stay',
    entityId: stay.id,
    changes: { reservationCode: stay.reservation.code },
  })

  revalidatePath('/admin')
  revalidatePath('/admin/estancias')
  redirect('/admin/estancias')
}

export async function setStayLocation(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireStaff()

  const parsed = stayLocationSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return errorState('Escribe el area.', parsed.error.flatten().fieldErrors)
  }

  const stay = await prisma.stay.findFirst({
    where: {
      id: parsed.data.stayId,
      reservation: { organizationId: user.organizationId },
      status: { in: ['ACTIVE', 'READY_FOR_PICKUP'] },
    },
    select: { id: true },
  })
  if (!stay) return errorState('Esa estancia no está activa.')

  await prisma.stay.update({
    where: { id: stay.id },
    data: { currentLocation: parsed.data.currentLocation },
  })

  revalidatePath(`/admin/estancias/${stay.id}`)
  revalidatePath('/admin/estancias')
  return successState('Ubicación actualizada.')
}
