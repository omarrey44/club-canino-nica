import 'server-only'

import { prisma } from '@/lib/prisma'
import { isStaff, type SessionUser } from '@/server/auth/session'
import type { Prisma, StayStatus } from '@/generated/prisma/client'

/**
 * Condicion de un permiso vigente.
 *
 * Un `CameraAccess` sirve solo si no fue revocado, no expiro, y la estancia a
 * la que pertenece sigue abierta. Las tres cosas juntas: al cerrar la estancia
 * el check-out marca `revokedAt`, pero si algo fallara ahi, el estado de la
 * estancia sigue cortando el acceso.
 */
const OPEN_STAY: StayStatus[] = ['ACTIVE', 'READY_FOR_PICKUP']

function liveAccess(now: Date): Prisma.CameraAccessWhereInput {
  return {
    revokedAt: null,
    OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    stay: { status: { in: OPEN_STAY } },
  }
}

/**
 * Camaras que el usuario puede ver ahora mismo.
 *
 * Para un cliente recorre la cadena completa: sus mascotas, sus estancias
 * abiertas, y los permisos concedidos a esas estancias. No hay forma de pedir
 * "la camara X" sin una estancia activa que la autorice.
 *
 * El personal ve las camaras activas de su organizacion, sin necesidad de
 * estancia: es su lugar de trabajo.
 */
export async function getViewableCameras(user: SessionUser) {
  const now = new Date()

  if (isStaff(user.role)) {
    const cameras = await prisma.camera.findMany({
      where: { organizationId: user.organizationId, isActive: true },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        area: true,
        description: true,
        status: true,
        protocol: true,
      },
    })
    return cameras.map((camera) => ({ ...camera, petsHere: [] as string[] }))
  }

  const grants = await prisma.cameraAccess.findMany({
    where: {
      ...liveAccess(now),
      // La estancia debe seguir abierta Y ser de una mascota suya.
      stay: { status: { in: OPEN_STAY }, pet: { ownerId: user.id } },
      camera: { isActive: true, organizationId: user.organizationId },
    },
    select: {
      camera: {
        select: {
          id: true,
          name: true,
          area: true,
          description: true,
          status: true,
          protocol: true,
        },
      },
      stay: {
        select: { currentLocation: true, pet: { select: { name: true } } },
      },
    },
  })

  // Una camara puede estar autorizada para varias mascotas del mismo dueno.
  const byCamera = new Map<string, { camera: (typeof grants)[number]['camera']; petsHere: string[] }>()

  for (const grant of grants) {
    const entry = byCamera.get(grant.camera.id) ?? { camera: grant.camera, petsHere: [] }
    // Solo se anuncia "tu mascota esta aqui" cuando el area coincide.
    if (grant.stay.currentLocation && grant.stay.currentLocation === grant.camera.area) {
      entry.petsHere.push(grant.stay.pet.name)
    }
    byCamera.set(grant.camera.id, entry)
  }

  return [...byCamera.values()]
    .map(({ camera, petsHere }) => ({ ...camera, petsHere }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

export type ViewableCamera = Awaited<ReturnType<typeof getViewableCameras>>[number]

/**
 * Comprueba el derecho a reproducir una camara y devuelve lo minimo necesario
 * para emitir el permiso. Devuelve null si el usuario no tiene acceso, sin
 * distinguir entre "no existe" y "no puedes": ambos son lo mismo para quien
 * pregunta.
 */
export async function findPlayableCamera(cameraId: string, user: SessionUser) {
  const now = new Date()

  if (isStaff(user.role)) {
    return prisma.camera.findFirst({
      where: { id: cameraId, organizationId: user.organizationId, isActive: true },
      select: { id: true, name: true, provider: true, providerRef: true, protocol: true, status: true },
    })
  }

  const grant = await prisma.cameraAccess.findFirst({
    where: {
      cameraId,
      ...liveAccess(now),
      // La estancia debe seguir abierta Y ser de una mascota suya.
      stay: { status: { in: OPEN_STAY }, pet: { ownerId: user.id } },
      camera: { isActive: true, organizationId: user.organizationId },
    },
    select: {
      camera: {
        select: {
          id: true,
          name: true,
          provider: true,
          providerRef: true,
          protocol: true,
          status: true,
        },
      },
    },
  })

  return grant?.camera ?? null
}

/** Catalogo completo para el panel, con sus permisos vigentes. */
export async function getOrganizationCameras(organizationId: string) {
  const now = new Date()

  return prisma.camera.findMany({
    where: { organizationId },
    orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
    select: {
      id: true,
      name: true,
      area: true,
      description: true,
      provider: true,
      providerRef: true,
      protocol: true,
      status: true,
      isActive: true,
      access: {
        where: liveAccess(now),
        select: {
          id: true,
          expiresAt: true,
          stay: {
            select: {
              id: true,
              pet: { select: { name: true } },
            },
          },
        },
      },
    },
  })
}

export type AdminCamera = Awaited<ReturnType<typeof getOrganizationCameras>>[number]
