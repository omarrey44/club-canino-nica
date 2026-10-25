import 'server-only'

import { prisma } from '@/lib/prisma'
import type { NotificationType, Prisma } from '@/generated/prisma/client'

/**
 * Punto unico por donde nace todo aviso.
 *
 * Antes cada accion escribia su propia fila. Centralizarlo hace que el dia que
 * exista push haya un solo lugar donde engancharlo, y que todos los avisos
 * tengan la misma forma.
 *
 * `sentAt` queda en null a proposito: hoy solo hay avisos dentro de la
 * plataforma. Cuando se envie push de verdad, esa columna marcara la diferencia
 * entre "creado" y "entregado".
 */
export type NotifyInput = {
  organizationId: string
  userId: string
  petId?: string | null
  type: NotificationType
  title: string
  body: string
  /** Ruta interna a la que lleva el toque. Siempre relativa. */
  linkUrl?: string | null
}

/**
 * Cliente de Prisma o el de una transaccion.
 *
 * Un aviso casi siempre acompana a otro cambio (un check-in, un pago), y debe
 * escribirse dentro de la misma transaccion: si el cambio se revierte, el
 * cliente no debe quedarse con un aviso de algo que no ocurrio.
 */
type Db = Prisma.TransactionClient | typeof prisma

export async function notify(input: NotifyInput, db: Db = prisma): Promise<void> {
  await db.notification.create({
    data: {
      organizationId: input.organizationId,
      userId: input.userId,
      petId: input.petId ?? null,
      type: input.type,
      title: input.title,
      body: input.body,
      linkUrl: input.linkUrl ?? null,
    },
  })

  // Aqui va el envio push cuando exista: leer las suscripciones del usuario,
  // mandar el mensaje y marcar `sentAt`. Debe hacerse despues de confirmar la
  // transaccion, no dentro: un push no se puede deshacer.
}

/**
 * Aviso para todo el personal activo de la organizacion: reservas nuevas,
 * cancelaciones y pagos. Una fila por persona, para que cada quien lleve su
 * propio "leido".
 */
export async function notifyStaff(
  input: Omit<NotifyInput, 'userId'>,
  db: Db = prisma
): Promise<void> {
  const staff = await db.user.findMany({
    where: { organizationId: input.organizationId, role: { not: 'CLIENT' }, isActive: true },
    select: { id: true },
  })
  if (staff.length === 0) return

  await db.notification.createMany({
    data: staff.map((member) => ({
      organizationId: input.organizationId,
      userId: member.id,
      petId: input.petId ?? null,
      type: input.type,
      title: input.title,
      body: input.body,
      linkUrl: input.linkUrl ?? null,
    })),
  })
}
