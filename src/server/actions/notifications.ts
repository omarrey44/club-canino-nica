'use server'

import { revalidatePath } from 'next/cache'

import { prisma } from '@/lib/prisma'
import { requireUser } from '@/server/auth/session'
import { successState, type ActionState } from './types'

/** El contador de no leidos vive en los layouts de ambos portales. */
function revalidateNotifications() {
  revalidatePath('/notificaciones')
  revalidatePath('/inicio')
  revalidatePath('/admin', 'layout')
}

/**
 * Marca una notificación como leída.
 *
 * `updateMany` con el `userId` en el mismo `where` en vez de `update` por id:
 * así un id ajeno no actualiza nada en lugar de lanzar un error que revelaría
 * que ese aviso existe.
 */
export async function markNotificationRead(notificationId: string): Promise<ActionState> {
  const user = await requireUser()

  await prisma.notification.updateMany({
    where: { id: notificationId, userId: user.id, readAt: null },
    data: { readAt: new Date() },
  })

  revalidateNotifications()
  return successState()
}

export async function markAllNotificationsRead(): Promise<ActionState> {
  const user = await requireUser()

  const { count } = await prisma.notification.updateMany({
    where: { userId: user.id, readAt: null },
    data: { readAt: new Date() },
  })

  revalidateNotifications()
  return successState(count === 0 ? 'No tenías avisos sin leer.' : 'Listo, todo al día.')
}
