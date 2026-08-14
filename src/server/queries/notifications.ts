import 'server-only'

import { cache } from 'react'

import { prisma } from '@/lib/prisma'
import type { SessionUser } from '@/server/auth/session'

/**
 * No leídas del usuario.
 *
 * `cache()` porque el número lo piden a la vez la barra inferior y la lateral
 * en cada navegación: sin esto serían dos consultas por página.
 */
export const getUnreadCount = cache(async (userId: string): Promise<number> => {
  return prisma.notification.count({ where: { userId, readAt: null } })
})

export async function getNotifications(user: SessionUser, onlyUnread = false) {
  return prisma.notification.findMany({
    where: { userId: user.id, ...(onlyUnread ? { readAt: null } : {}) },
    orderBy: { createdAt: 'desc' },
    // Techo deliberado: nadie revisa más allá de esto, y evita traer el
    // historial completo de un cliente con años de estancias.
    // ponytail: límite fijo, paginar si alguien se queja de no ver más atrás.
    take: 60,
    select: {
      id: true,
      type: true,
      title: true,
      body: true,
      linkUrl: true,
      readAt: true,
      createdAt: true,
      pet: { select: { name: true, photoUrl: true } },
    },
  })
}

export type NotificationRow = Awaited<ReturnType<typeof getNotifications>>[number]
