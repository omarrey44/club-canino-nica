'use server'

import { revalidatePath } from 'next/cache'

import { prisma } from '@/lib/prisma'
import { recordAudit } from '@/server/audit'
import { requireRole, requireStaff, requireUser } from '@/server/auth/session'
import { createTemporaryStreamAccess } from '@/server/providers/camera'
import { findPlayableCamera } from '@/server/queries/cameras'
import { cameraSchema } from '@/validations/camera'
import { errorState, successState, type ActionState } from './types'
import type { StreamProtocol } from '@/generated/prisma/client'

export type StreamResponse =
  | { ok: true; url: string | null; protocol: StreamProtocol; isDemo: boolean; expiresAt: string }
  | { ok: false; message: string }

/**
 * Abre una reproduccion.
 *
 * Este es el unico camino por el que un navegador obtiene algo reproducible.
 * Primero se recorre la cadena usuario -> mascota -> estancia -> permiso; solo
 * si esa cadena responde, se emite un acceso temporal.
 *
 * Nunca devuelve `providerRef` ni credenciales: solo una URL firmada que
 * caduca, o nada en modo demo.
 */
export async function openCameraStream(cameraId: string): Promise<StreamResponse> {
  const user = await requireUser()

  const camera = await findPlayableCamera(cameraId, user)
  // Mismo mensaje si la camara no existe, esta inactiva o no esta autorizada:
  // distinguirlos le diria a un curioso que camaras hay.
  if (!camera) {
    return { ok: false, message: 'Esta cámara no está disponible en este momento.' }
  }

  if (camera.status !== 'ONLINE') {
    return {
      ok: false,
      message: 'Esta cámara está fuera de línea. Avísanos si necesitas ver a tu mascota.',
    }
  }

  try {
    const grant = createTemporaryStreamAccess(camera)
    return {
      ok: true,
      url: grant.url,
      protocol: grant.protocol,
      isDemo: grant.isDemo,
      expiresAt: grant.expiresAt.toISOString(),
    }
  } catch (error) {
    console.error('[cameras.openStream]', error)
    return { ok: false, message: 'No pudimos abrir la transmisión. Intenta de nuevo.' }
  }
}

// ---------------------------------------------------------------------------
// Administracion del catalogo
// ---------------------------------------------------------------------------

export async function saveCamera(
  cameraId: string | null,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  // El catalogo de camaras lo administra ADMIN, no todo el personal.
  const user = await requireRole('ADMIN', 'SUPER_ADMIN')

  const parsed = cameraSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return errorState('Revisa los datos de la cámara.', parsed.error.flatten().fieldErrors)
  }

  if (cameraId) {
    const existing = await prisma.camera.findFirst({
      where: { id: cameraId, organizationId: user.organizationId },
      select: { id: true, name: true },
    })
    if (!existing) return errorState('No encontramos esa cámara.')

    await prisma.camera.update({ where: { id: existing.id }, data: parsed.data })
    await recordAudit(user, {
      action: 'CAMERA_UPDATED',
      entityType: 'Camera',
      entityId: existing.id,
      // El `providerRef` no entra al log: es lo que identifica la camara ante
      // el proveedor y no tiene por que quedar duplicado en auditoria.
      changes: { name: parsed.data.name, area: parsed.data.area },
    })
  } else {
    const created = await prisma.camera.create({
      data: { ...parsed.data, organizationId: user.organizationId },
      select: { id: true },
    })
    await recordAudit(user, {
      action: 'CAMERA_CREATED',
      entityType: 'Camera',
      entityId: created.id,
      changes: { name: parsed.data.name, area: parsed.data.area },
    })
  }

  revalidatePath('/admin/camaras')
  revalidatePath('/camaras')
  return successState(cameraId ? 'Cámara actualizada.' : 'Cámara creada.')
}

export async function toggleCamera(cameraId: string): Promise<ActionState> {
  const user = await requireRole('ADMIN', 'SUPER_ADMIN')

  const camera = await prisma.camera.findFirst({
    where: { id: cameraId, organizationId: user.organizationId },
    select: { id: true, name: true, isActive: true },
  })
  if (!camera) return errorState('No encontramos esa cámara.')

  await prisma.$transaction(async (tx) => {
    await tx.camera.update({
      where: { id: camera.id },
      data: { isActive: !camera.isActive },
    })

    // Desactivar una camara corta de inmediato lo que ya estaba concedido.
    if (camera.isActive) {
      await tx.cameraAccess.updateMany({
        where: { cameraId: camera.id, revokedAt: null },
        data: { revokedAt: new Date() },
      })
    }
  })

  await recordAudit(user, {
    action: camera.isActive ? 'CAMERA_DEACTIVATED' : 'CAMERA_ACTIVATED',
    entityType: 'Camera',
    entityId: camera.id,
    changes: { name: camera.name },
  })

  revalidatePath('/admin/camaras')
  revalidatePath('/camaras')
  return successState(camera.isActive ? 'Cámara desactivada.' : 'Cámara activada.')
}

// ---------------------------------------------------------------------------
// Permisos por estancia
// ---------------------------------------------------------------------------

/**
 * Autoriza una camara para una estancia concreta.
 *
 * El permiso caduca junto con la estancia: se le pone como vencimiento la hora
 * de salida prevista, y el check-out lo revoca aunque esa hora no haya llegado.
 */
export async function grantCameraAccess(
  stayId: string,
  cameraId: string
): Promise<ActionState> {
  const user = await requireStaff()

  const [stay, camera] = await Promise.all([
    prisma.stay.findFirst({
      where: {
        id: stayId,
        reservation: { organizationId: user.organizationId },
        status: { in: ['ACTIVE', 'READY_FOR_PICKUP'] },
      },
      select: { id: true, expectedCheckOutAt: true, pet: { select: { name: true } } },
    }),
    prisma.camera.findFirst({
      where: { id: cameraId, organizationId: user.organizationId, isActive: true },
      select: { id: true, name: true },
    }),
  ])

  if (!stay) return errorState('Esa estancia no está activa.')
  if (!camera) return errorState('Esa cámara no está disponible.')

  await prisma.cameraAccess.upsert({
    where: { cameraId_stayId: { cameraId: camera.id, stayId: stay.id } },
    create: {
      cameraId: camera.id,
      stayId: stay.id,
      // Un margen de media hora cubre la salida que se retrasa un poco.
      expiresAt: new Date(stay.expectedCheckOutAt.getTime() + 30 * 60_000),
    },
    update: {
      revokedAt: null,
      expiresAt: new Date(stay.expectedCheckOutAt.getTime() + 30 * 60_000),
    },
  })

  await recordAudit(user, {
    action: 'CAMERA_ACCESS_GRANTED',
    entityType: 'CameraAccess',
    entityId: `${camera.id}:${stay.id}`,
    changes: { camera: camera.name, pet: stay.pet.name },
  })

  revalidatePath('/admin/camaras')
  revalidatePath(`/admin/estancias/${stay.id}`)
  revalidatePath('/camaras')
  return successState(`${camera.name} habilitada para ${stay.pet.name}.`)
}

export async function revokeCameraAccess(accessId: string): Promise<ActionState> {
  const user = await requireStaff()

  const access = await prisma.cameraAccess.findFirst({
    where: {
      id: accessId,
      camera: { organizationId: user.organizationId },
    },
    select: {
      id: true,
      stayId: true,
      camera: { select: { name: true } },
      stay: { select: { pet: { select: { name: true } } } },
    },
  })
  if (!access) return errorState('No encontramos ese permiso.')

  await prisma.cameraAccess.update({
    where: { id: access.id },
    data: { revokedAt: new Date() },
  })

  await recordAudit(user, {
    action: 'CAMERA_ACCESS_REVOKED',
    entityType: 'CameraAccess',
    entityId: access.id,
    changes: { camera: access.camera.name, pet: access.stay.pet.name },
  })

  revalidatePath('/admin/camaras')
  revalidatePath(`/admin/estancias/${access.stayId}`)
  revalidatePath('/camaras')
  return successState('Acceso revocado.')
}
