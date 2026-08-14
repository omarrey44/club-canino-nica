'use server'

import { revalidatePath } from 'next/cache'

import { prisma } from '@/lib/prisma'
import { notify } from '@/server/notifications'
import { clubDateInput, clubDateTime } from '@/lib/datetime'
import { activityTypeLabels } from '@/lib/constants/labels'
import { recordAudit } from '@/server/audit'
import { requireStaff } from '@/server/auth/session'
import { uploadActivityPhoto } from '@/server/providers/storage'
import { activitySchema } from '@/validations/stay'
import { errorState, successState, type ActionState } from './types'

/**
 * Tipos que generan un aviso al propietario.
 *
 * No todos: ocho actividades en un día serian ocho notificaciones y la
 * campanita dejaria de significar algo. El timeline las muestra todas; el aviso
 * se reserva para lo que el propietario quiere saber en el momento.
 */
const NOTIFIES = new Set(['PHOTO', 'FOOD'])

export async function logActivity(
  stayId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireStaff()

  const parsed = activitySchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return errorState('Revisa los datos.', parsed.error.flatten().fieldErrors)
  }

  const stay = await prisma.stay.findFirst({
    where: {
      id: stayId,
      reservation: { organizationId: user.organizationId },
      status: { in: ['ACTIVE', 'READY_FOR_PICKUP'] },
    },
    select: {
      id: true,
      petId: true,
      pet: { select: { name: true } },
      reservation: { select: { clientId: true } },
    },
  })
  if (!stay) return errorState('Esa estancia no está activa.')

  const { type, description, time, isVisibleToOwner } = parsed.data
  // Sin hora escrita, la actividad es "ahora": es el caso normal, y pedir la
  // hora en cada registro haria mas lento lo que tiene que ser rapido.
  const occurredAt = time ? clubDateTime(clubDateInput(), time) : new Date()

  let photoUrl: string | null = null
  let storageKey: string | null = null
  const file = formData.get('photo')
  if (file instanceof File && file.size > 0) {
    const uploaded = await uploadActivityPhoto(stay.id, file)
    if (!uploaded.ok) return errorState(uploaded.error)
    photoUrl = uploaded.file.url
    storageKey = uploaded.file.storageKey
  }

  await prisma.$transaction(async (tx) => {
    await tx.petActivity.create({
      data: {
        stayId: stay.id,
        petId: stay.petId,
        type,
        occurredAt,
        description,
        photoUrl,
        isVisibleToOwner,
        recordedById: user.id,
      },
    })

    // Una foto adjunta tambien entra a la galeria de la estancia: si viviera
    // solo en la actividad, no aparecerian en "Fotografías".
    if (photoUrl && storageKey && isVisibleToOwner) {
      await tx.petPhoto.create({
        data: {
          stayId: stay.id,
          petId: stay.petId,
          storageKey,
          url: photoUrl,
          caption: description,
          takenAt: occurredAt,
          uploadedById: user.id,
        },
      })
    }

    if (isVisibleToOwner && NOTIFIES.has(type)) {
      await notify({
          organizationId: user.organizationId,
          userId: stay.reservation.clientId,
          petId: stay.petId,
          type: type === 'PHOTO' ? 'NEW_PHOTO' : 'NEW_ACTIVITY',
          title:
            type === 'PHOTO'
              ? `Tenemos una nueva foto de ${stay.pet.name}`
              : `${stay.pet.name} termino su comida`,
          body: description ?? `${activityTypeLabels[type]} registrada.`,
          linkUrl: '/mi-mascota',
        }, tx)
    }
  })

  revalidatePath(`/admin/estancias/${stay.id}`)
  revalidatePath('/admin/estancias')
  revalidatePath('/mi-mascota')
  revalidatePath('/inicio')

  return successState(`${activityTypeLabels[type]} registrada.`)
}

/**
 * Borra una actividad mal registrada.
 *
 * Solo del mismo dia y solo si la escribio quien la borra: corregir un error
 * propio recien cometido es distinto de reescribir el historial de una mascota.
 */
export async function deleteActivity(activityId: string): Promise<ActionState> {
  const user = await requireStaff()

  const activity = await prisma.petActivity.findFirst({
    where: {
      id: activityId,
      recordedById: user.id,
      type: { notIn: ['CHECK_IN', 'CHECK_OUT'] },
      createdAt: { gte: new Date(Date.now() - 24 * 3_600_000) },
      stay: { reservation: { organizationId: user.organizationId } },
    },
    select: { id: true, stayId: true, type: true },
  })
  if (!activity) return errorState('Esa actividad ya no se puede eliminar.')

  await prisma.petActivity.delete({ where: { id: activity.id } })

  await recordAudit(user, {
    action: 'ACTIVITY_DELETED',
    entityType: 'PetActivity',
    entityId: activity.id,
    changes: { stayId: activity.stayId, type: activity.type },
  })

  revalidatePath(`/admin/estancias/${activity.stayId}`)
  revalidatePath('/mi-mascota')
  return successState('Actividad eliminada.')
}
