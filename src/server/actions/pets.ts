'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { prisma } from '@/lib/prisma'
import { recordAudit } from '@/server/audit'
import { requireStaff, requireUser, type SessionUser } from '@/server/auth/session'
import { assertPetAccess } from '@/server/queries/pets'
import {
  deleteFile,
  storageKeyFromUrl,
  uploadPetPhoto as uploadToStorage,
} from '@/server/providers/storage'
import { petMedicalSchema, petSchema } from '@/validations/pet'
import { errorState, successState, type ActionState } from './types'

/**
 * Alta de mascota.
 *
 * El propietario siempre es quien tiene la sesion: no se acepta un `ownerId`
 * del formulario, o cualquiera podria registrar mascotas a nombre de otro.
 */
export async function createPet(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser()

  const result = await insertPet(user, user.id, formData)
  if ('status' in result) return result

  revalidatePath('/mascotas')
  revalidatePath('/inicio')
  redirect(`/mascotas/${result.id}`)
}

/**
 * Alta en mostrador: el personal registra la mascota de un cliente. El cliente
 * va atado con `.bind` en el servidor y aun asi se comprueba que sea de la
 * organizacion de quien llama.
 */
export async function createPetForClient(
  clientId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireStaff()

  const client = await prisma.user.findFirst({
    where: { id: clientId, organizationId: user.organizationId, role: 'CLIENT' },
    select: { id: true },
  })
  if (!client) return errorState('No encontramos a ese cliente.')

  const result = await insertPet(user, client.id, formData)
  if ('status' in result) return result

  revalidatePath(`/admin/clientes/${client.id}`)
  revalidatePath('/admin/mascotas')
  redirect(`/admin/clientes/${client.id}`)
}

async function insertPet(
  actor: SessionUser,
  ownerId: string,
  formData: FormData
): Promise<ActionState | { id: string }> {
  const raw = Object.fromEntries(formData)
  const parsedPet = petSchema.safeParse(raw)
  const parsedMedical = petMedicalSchema.safeParse(raw)

  if (!parsedPet.success) {
    return errorState('Revisa los datos de la mascota.', parsedPet.error.flatten().fieldErrors)
  }
  if (!parsedMedical.success) {
    return errorState(
      'Revisa la información de cuidado.',
      parsedMedical.error.flatten().fieldErrors
    )
  }

  const pet = await prisma.pet.create({
    data: {
      ...parsedPet.data,
      organizationId: actor.organizationId,
      ownerId,
      medicalInfo: { create: parsedMedical.data },
    },
    select: { id: true, name: true },
  })

  await recordAudit(actor, {
    action: 'PET_CREATED',
    entityType: 'Pet',
    entityId: pet.id,
    changes: { name: pet.name, ownerId },
  })

  return { id: pet.id }
}

export async function updatePet(
  petId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser()
  if (!(await assertPetAccess(petId, user))) {
    return errorState('No encontramos esa mascota.')
  }

  const raw = Object.fromEntries(formData)
  const parsedPet = petSchema.safeParse(raw)
  const parsedMedical = petMedicalSchema.safeParse(raw)

  if (!parsedPet.success) {
    return errorState('Revisa los datos de tu mascota.', parsedPet.error.flatten().fieldErrors)
  }
  if (!parsedMedical.success) {
    return errorState(
      'Revisa la información de cuidado.',
      parsedMedical.error.flatten().fieldErrors
    )
  }

  await prisma.pet.update({
    where: { id: petId },
    data: {
      ...parsedPet.data,
      medicalInfo: {
        upsert: { create: parsedMedical.data, update: parsedMedical.data },
      },
    },
  })

  await recordAudit(user, {
    action: 'PET_UPDATED',
    entityType: 'Pet',
    entityId: petId,
    changes: { name: parsedPet.data.name },
  })

  revalidatePath('/mascotas')
  revalidatePath(`/mascotas/${petId}`)
  redirect(`/mascotas/${petId}`)
}

export async function uploadPetPhoto(
  petId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser()
  if (!(await assertPetAccess(petId, user))) {
    return errorState('No encontramos esa mascota.')
  }

  const file = formData.get('photo')
  if (!(file instanceof File)) return errorState('Elige una imagen.')

  const result = await uploadToStorage(petId, file)
  if (!result.ok) return errorState(result.error)

  const previous = await prisma.pet.findUnique({
    where: { id: petId },
    select: { photoUrl: true },
  })

  await prisma.pet.update({
    where: { id: petId },
    data: { photoUrl: result.file.url },
  })

  // La foto anterior ya no la referencia nadie: borrarla evita que el bucket
  // crezca sin limite cada vez que alguien cambia el retrato.
  const oldKey = storageKeyFromUrl(previous?.photoUrl ?? null)
  if (oldKey) await deleteFile(oldKey)

  revalidatePath('/mascotas')
  revalidatePath(`/mascotas/${petId}`)
  revalidatePath('/inicio')
  return successState('Foto actualizada.')
}

/**
 * Baja logica. No se borra la fila: las reservaciones y estancias pasadas
 * dejarian de tener sentido, y el historial es parte del producto.
 */
export async function archivePet(petId: string): Promise<void> {
  const user = await requireUser()
  if (!(await assertPetAccess(petId, user))) return

  await prisma.pet.update({ where: { id: petId }, data: { isActive: false } })
  await recordAudit(user, { action: 'PET_ARCHIVED', entityType: 'Pet', entityId: petId })

  revalidatePath('/mascotas')
  redirect('/mascotas')
}
