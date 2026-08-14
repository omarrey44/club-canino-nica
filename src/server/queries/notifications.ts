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

export const NOTIFICATIONS_PAGE_SIZE = 12

export async function getNotifications(user: SessionUser, onlyUnread = false, page = 1) {
  return prisma.notification.findMany({
    where: { userId: user.id, ...(onlyUnread ? { readAt: null } : {}) },
    orderBy: { createdAt: 'desc' },
    skip: (Math.max(1, page) - 1) * NOTIFICATIONS_PAGE_SIZE,
    // El registro adicional permite saber si existe una página siguiente
    // sin ejecutar una segunda consulta de conteo.
    take: NOTIFICATIONS_PAGE_SIZE + 1,
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
