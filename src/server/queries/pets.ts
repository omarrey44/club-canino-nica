import 'server-only'

import { prisma } from '@/lib/prisma'
import { needsAttention } from '@/lib/pets'
import { isStaff, type SessionUser } from '@/server/auth/session'

/**
 * Filtro de propiedad.
 *
 * Un CLIENT solo alcanza sus mascotas. El personal alcanza las de su
 * organizacion. Nunca se confia en un id que venga del navegador sin este
 * filtro acompanandolo en el mismo `where`.
 */
function ownershipWhere(user: SessionUser) {
  return isStaff(user.role)
    ? { organizationId: user.organizationId }
    : { organizationId: user.organizationId, ownerId: user.id }
}

export async function getMyPets(user: SessionUser) {
  const pets = await prisma.pet.findMany({
    where: { ...ownershipWhere(user), isActive: true },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      name: true,
      breed: true,
      sex: true,
      size: true,
      birthDate: true,
      photoUrl: true,
      vaccinations: {
        select: { id: true, name: true, expiresAt: true },
        orderBy: { expiresAt: 'asc' },
      },
      stays: {
        where: { status: { in: ['ACTIVE', 'READY_FOR_PICKUP'] } },
        select: { id: true, status: true, currentLocation: true },
        take: 1,
      },
    },
  })

  return pets.map((pet) => {
    const { vaccinations, stays, ...rest } = pet
    return {
      ...rest,
      currentStay: stays[0] ?? null,
      alerts: vaccinations.filter((v) => needsAttention(v.expiresAt)).length,
    }
  })
}

export type PetListItem = Awaited<ReturnType<typeof getMyPets>>[number]

/** Ficha completa. Devuelve null si la mascota no es alcanzable por el usuario. */
export async function getPetDetail(petId: string, user: SessionUser) {
  return prisma.pet.findFirst({
    where: { id: petId, ...ownershipWhere(user) },
    include: {
      medicalInfo: true,
      vaccinations: { orderBy: [{ expiresAt: 'asc' }, { appliedAt: 'desc' }] },
      emergencyContacts: { orderBy: { isPrimary: 'desc' } },
      owner: { select: { id: true, fullName: true, email: true, phone: true } },
      stays: {
        where: { status: { in: ['ACTIVE', 'READY_FOR_PICKUP'] } },
        select: { id: true, status: true, currentLocation: true, checkInAt: true },
        take: 1,
      },
    },
  })
}

export type PetDetail = NonNullable<Awaited<ReturnType<typeof getPetDetail>>>

/**
 * Solo comprueba alcance. Se usa antes de mutar, para no traer la fila entera
 * cuando lo unico que importa es "este usuario puede tocar esta mascota".
 */
export async function assertPetAccess(petId: string, user: SessionUser): Promise<boolean> {
  const found = await prisma.pet.findFirst({
    where: { id: petId, ...ownershipWhere(user) },
    select: { id: true },
  })
  return found !== null
}
