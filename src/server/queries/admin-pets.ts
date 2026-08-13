import 'server-only'

import { prisma } from '@/lib/prisma'
import type { Prisma } from '@/generated/prisma/client'

export type AdminPetFilter = 'all' | 'in-club' | 'archived'

/**
 * Listado del panel. Siempre acotado a la organizacion del usuario en sesion:
 * el `organizationId` nunca llega del navegador.
 */
export async function searchPets(
  organizationId: string,
  { query, filter = 'all' }: { query?: string; filter?: AdminPetFilter }
) {
  const where: Prisma.PetWhereInput = {
    organizationId,
    isActive: filter !== 'archived',
    ...(filter === 'in-club'
      ? { stays: { some: { status: { in: ['ACTIVE', 'READY_FOR_PICKUP'] } } } }
      : {}),
    ...(query
      ? {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { breed: { contains: query, mode: 'insensitive' } },
            { owner: { fullName: { contains: query, mode: 'insensitive' } } },
            { owner: { email: { contains: query, mode: 'insensitive' } } },
          ],
        }
      : {}),
  }

  return prisma.pet.findMany({
    where,
    orderBy: { name: 'asc' },
    // Techo deliberado: con mas mascotas que esto hace falta paginacion real.
    // ponytail: limite fijo, paginar cuando el club pase de 200 mascotas.
    take: 200,
    select: {
      id: true,
      name: true,
      breed: true,
      sex: true,
      photoUrl: true,
      birthDate: true,
      owner: { select: { id: true, fullName: true, phone: true } },
      stays: {
        where: { status: { in: ['ACTIVE', 'READY_FOR_PICKUP'] } },
        select: { id: true, status: true, currentLocation: true },
        take: 1,
      },
      vaccinations: { select: { expiresAt: true } },
    },
  })
}

export type AdminPetRow = Awaited<ReturnType<typeof searchPets>>[number]
