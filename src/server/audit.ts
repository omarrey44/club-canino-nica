import 'server-only'

import { prisma } from '@/lib/prisma'
import type { SessionUser } from '@/server/auth/session'

/**
 * Deja rastro de una accion relevante.
 *
 * No registra lecturas ni cada guardado trivial: solo lo que alguien podria
 * necesitar reconstruir despues (cambios de reserva, pagos, datos medicos,
 * permisos de cámara, estados de estancia).
 *
 * `changes` guarda el delta, nunca el registro completo: un log de auditoria
 * lleno de datos personales duplicados es un problema, no una ayuda.
 */
export async function recordAudit(
  actor: SessionUser,
  input: {
    action: string
    entityType: string
    entityId: string
    changes?: Record<string, unknown>
  }
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        organizationId: actor.organizationId,
        actorId: actor.id,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        changes: input.changes ? (input.changes as object) : undefined,
      },
    })
  } catch (error) {
    // La auditoria nunca debe tumbar la operacion que estaba auditando.
    console.error('[audit] no se pudo registrar:', error)
  }
}
