'use server'

import { revalidatePath } from 'next/cache'

import { prisma } from '@/lib/prisma'
import { notify } from '@/server/notifications'
import { deleteFile, uploadActivityPhoto } from '@/server/providers/storage'
import { recordAudit } from '@/server/audit'
import { requireStaff } from '@/server/auth/session'
import { errorState, successState, type ActionState } from './types'

const MAX_PER_UPLOAD = 6

/**
 * Sube fotos a la galeria de una estancia.
 *
 * Acepta varias de una vez porque el equipo toma las fotos con el celular
 * durante el dia y las sube juntas al final, no de una en una.
 */
export async function uploadStayPhotos(
  stayId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireStaff()

  const stay = await prisma.stay.findFirst({
    where: { id: stayId, reservation: { organizationId: user.organizationId } },
    select: {
      id: true,
      petId: true,
      pet: { select: { name: true } },
      reservation: { select: { clientId: true } },
    },
  })
  if (!stay) return errorState('No encontramos esa estancia.')

  const files = formData
    .getAll('photos')
    .filter((value): value is File => value instanceof File && value.size > 0)

  if (files.length === 0) return errorState('Elige al menos una imagen.')
  if (files.length > MAX_PER_UPLOAD) {
    return errorState(`Sube maximo ${MAX_PER_UPLOAD} fotos a la vez.`)
  }

  const caption = String(formData.get('caption') ?? '').trim() || null

  const uploaded: Array<{ storageKey: string; url: string }> = []
  for (const file of files) {
    const result = await uploadActivityPhoto(stay.id, file)
    if (!result.ok) {
      // Lo ya subido se borra: media galeria a medias confunde mas que un error.
      for (const done of uploaded) await deleteFile(done.storageKey)
      return errorState(result.error)
    }
    uploaded.push(result.file)
  }

  const takenAt = new Date()

  await prisma.$transaction(async (tx) => {
    await tx.petPhoto.createMany({
      data: uploaded.map((file) => ({
        stayId: stay.id,
        petId: stay.petId,
        storageKey: file.storageKey,
        url: file.url,
        caption,
        takenAt,
        uploadedById: user.id,
      })),
    })

    await notify({
        organizationId: user.organizationId,
        userId: stay.reservation.clientId,
        petId: stay.petId,
        type: 'NEW_PHOTO',
        title:
          uploaded.length === 1
            ? `Tenemos una nueva foto de ${stay.pet.name}`
            : `Tenemos ${uploaded.length} fotos nuevas de ${stay.pet.name}`,
        body: caption ?? `Asi va el dia de ${stay.pet.name}.`,
        linkUrl: '/mi-mascota',
      }, tx)
  })

  revalidatePath(`/admin/estancias/${stay.id}`)
  revalidatePath('/mi-mascota')
  return successState(
    uploaded.length === 1 ? 'Foto publicada.' : `${uploaded.length} fotos publicadas.`
  )
}

/** Marca o desmarca una foto como destacada del reporte. */
export async function toggleFeaturedPhoto(photoId: string): Promise<ActionState> {
  const user = await requireStaff()

  const photo = await prisma.petPhoto.findFirst({
    where: { id: photoId, stay: { reservation: { organizationId: user.organizationId } } },
    select: { id: true, stayId: true, isFeatured: true },
  })
  if (!photo) return errorState('No encontramos esa foto.')

  await prisma.petPhoto.update({
    where: { id: photo.id },
    data: { isFeatured: !photo.isFeatured },
  })

  revalidatePath(`/admin/estancias/${photo.stayId}`)
  revalidatePath('/mi-mascota')
  return successState(photo.isFeatured ? 'Foto quitada del reporte.' : 'Foto destacada.')
}

export async function deleteStayPhoto(photoId: string): Promise<ActionState> {
  const user = await requireStaff()

  const photo = await prisma.petPhoto.findFirst({
    where: { id: photoId, stay: { reservation: { organizationId: user.organizationId } } },
    select: { id: true, stayId: true, storageKey: true },
  })
  if (!photo) return errorState('No encontramos esa foto.')

  await prisma.petPhoto.delete({ where: { id: photo.id } })
  await deleteFile(photo.storageKey)

  await recordAudit(user, {
    action: 'PHOTO_DELETED',
    entityType: 'PetPhoto',
    entityId: photo.id,
    changes: { stayId: photo.stayId },
  })

  revalidatePath(`/admin/estancias/${photo.stayId}`)
  revalidatePath('/mi-mascota')
  return successState('Foto eliminada.')
}
