import 'server-only'

import { prisma } from '@/lib/prisma'
import type { Prisma } from '@/generated/prisma/client'

export type ClientFilter = 'active' | 'inactive'

/** Clientes de la organizacion, con sus mascotas activas y su ultima reserva. */
export async function searchClients(
  organizationId: string,
  { query, filter = 'active' }: { query?: string; filter?: ClientFilter }
) {
  const where: Prisma.UserWhereInput = {
    organizationId,
    role: 'CLIENT',
    isActive: filter === 'active',
    ...(query
      ? {
          OR: [
            { fullName: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
            { phone: { contains: query } },
            { pets: { some: { name: { contains: query, mode: 'insensitive' } } } },
          ],
        }
      : {}),
  }

  return prisma.user.findMany({
    where,
    orderBy: { fullName: 'asc' },
    // ponytail: limite fijo como en mascotas, paginar cuando pase de 200 clientes.
    take: 200,
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      createdAt: true,
      pets: {
        where: { isActive: true },
        orderBy: { name: 'asc' },
        select: { id: true, name: true, photoUrl: true },
      },
      reservations: { orderBy: { startAt: 'desc' }, take: 1, select: { startAt: true } },
      _count: { select: { reservations: true } },
    },
  })
}

export type ClientRow = Awaited<ReturnType<typeof searchClients>>[number]

export async function getClientDetail(organizationId: string, id: string) {
  return prisma.user.findFirst({
    where: { id, organizationId, role: 'CLIENT' },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      isActive: true,
      createdAt: true,
      pets: {
        orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
        select: { id: true, name: true, breed: true, photoUrl: true, isActive: true },
      },
      reservations: {
        orderBy: { startAt: 'desc' },
        take: 50,
        select: {
          id: true,
          code: true,
          startAt: true,
          status: true,
          total: true,
          service: { select: { name: true } },
          pet: { select: { name: true } },
          payment: { select: { status: true } },
        },
      },
    },
  })
}

/** Todo el que no es cliente. Los inactivos van al final. */
export async function getStaff(organizationId: string) {
  return prisma.user.findMany({
    where: { organizationId, role: { not: 'CLIENT' } },
    orderBy: [{ isActive: 'desc' }, { fullName: 'asc' }],
    select: { id: true, fullName: true, email: true, phone: true, role: true, isActive: true },
  })
}

export type StaffRow = Awaited<ReturnType<typeof getStaff>>[number]
