'use server'

import { revalidatePath } from 'next/cache'

import { prisma } from '@/lib/prisma'
import { recordAudit } from '@/server/audit'
import { requireUser } from '@/server/auth/session'
import { assertPetAccess } from '@/server/queries/pets'
import { uploadVaccinationDocument } from '@/server/providers/storage'
import { vaccinationSchema } from '@/validations/pet'
import { errorState, successState, type ActionState } from './types'

export async function addVaccination(
  petId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser()
  if (!(await assertPetAccess(petId, user))) {
    return errorState('No encontramos esa mascota.')
  }

  const parsed = vaccinationSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return errorState('Revisa los datos de la vacuna.', parsed.error.flatten().fieldErrors)
  }

  // El comprobante es opcional: si falla la subida no se pierde el registro.
  let documentUrl: string | null = null
  const file = formData.get('document')
  if (file instanceof File && file.size > 0) {
    const uploaded = await uploadVaccinationDocument(petId, file)
    if (!uploaded.ok) return errorState(uploaded.error)
    documentUrl = uploaded.file.url
  }

  const vaccination = await prisma.petVaccination.create({
    data: { petId, ...parsed.data, documentUrl },
    select: { id: true, name: true },
  })

  await recordAudit(user, {
    action: 'VACCINATION_ADDED',
    entityType: 'PetVaccination',
    entityId: vaccination.id,
    changes: { petId, name: vaccination.name },
  })

  revalidatePath(`/mascotas/${petId}`)
  return successState(`Vacuna de ${vaccination.name} registrada.`)
}

export async function deleteVaccination(vaccinationId: string): Promise<void> {
  const user = await requireUser()

  const vaccination = await prisma.petVaccination.findUnique({
    where: { id: vaccinationId },
    select: { petId: true, name: true },
  })
  if (!vaccination) return
  if (!(await assertPetAccess(vaccination.petId, user))) return

  await prisma.petVaccination.delete({ where: { id: vaccinationId } })

  await recordAudit(user, {
    action: 'VACCINATION_DELETED',
    entityType: 'PetVaccination',
    entityId: vaccinationId,
    changes: { petId: vaccination.petId, name: vaccination.name },
  })

  revalidatePath(`/mascotas/${vaccination.petId}`)
}
