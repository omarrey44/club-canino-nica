'use server'

import { randomBytes } from 'node:crypto'
import { revalidatePath } from 'next/cache'

import type { Role } from '@/generated/prisma/client'
import { roleLabels } from '@/lib/constants/labels'
import { prisma } from '@/lib/prisma'
import { createAdminClient } from '@/lib/supabase/admin'
import { recordAudit } from '@/server/audit'
import { requireRole, type SessionUser } from '@/server/auth/session'
import { activeChangeSchema, roleChangeSchema, staffMemberSchema } from '@/validations/users'
import { errorState, successState, type ActionState } from './types'

/** La contrasena temporal viaja una sola vez, en la respuesta, y no se guarda. */
export type StaffMemberState = ActionState & { tempPassword?: string; email?: string }

function revalidateUsers() {
  revalidatePath('/admin/personal')
  revalidatePath('/admin/clientes', 'layout')
}

/**
 * Suma a alguien al equipo. Si ya tiene cuenta de cliente se le cambia el rol y
 * entra con su contrasena de siempre; si no, se crea la cuenta con una
 * contrasena temporal que el administrador le entrega en persona.
 */
export async function addStaffMember(
  _prev: StaffMemberState,
  formData: FormData
): Promise<StaffMemberState> {
  const actor = await requireRole('ADMIN', 'SUPER_ADMIN')

  const parsed = staffMemberSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return errorState('Revisa los datos.', parsed.error.flatten().fieldErrors)
  }
  const { email, fullName, role } = parsed.data

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    if (existing.organizationId !== actor.organizationId) {
      return errorState('Ese correo ya se usa en otra organización.')
    }
    if (existing.role !== 'CLIENT') {
      return errorState(`${existing.fullName} ya es parte del equipo.`)
    }

    await prisma.user.update({ where: { id: existing.id }, data: { role, isActive: true } })
    await recordAudit(actor, {
      action: 'USER_ROLE_CHANGED',
      entityType: 'User',
      entityId: existing.id,
      changes: { from: existing.role, to: role },
    })
    revalidateUsers()
    return successState(
      `${existing.fullName} ahora es ${roleLabels[role]}. Entra con su contraseña de siempre.`
    )
  }

  // 18 caracteres base64url: sin '$' ni '#', que ya dieron problemas en .env.
  const tempPassword = randomBytes(14).toString('base64url')
  const admin = createAdminClient()
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  })

  if (error || !data.user) {
    console.error('[users.addStaffMember] createUser fallo:', error)
    return errorState(
      error?.message.toLowerCase().includes('already')
        ? 'Ese correo ya tiene acceso pero no tiene perfil en el club. Revísalo en Supabase.'
        : 'No pudimos crear la cuenta. Intenta de nuevo.'
    )
  }

  try {
    const created = await prisma.user.create({
      data: {
        authUserId: data.user.id,
        organizationId: actor.organizationId,
        email,
        fullName,
        role,
      },
    })
    await recordAudit(actor, {
      action: 'STAFF_CREATED',
      entityType: 'User',
      entityId: created.id,
      changes: { role },
    })
  } catch (dbError) {
    // Sin la fila en `users` la cuenta de acceso quedaria huerfana: se deshace.
    console.error('[users.addStaffMember] alta en base fallo:', dbError)
    await admin.auth.admin.deleteUser(data.user.id)
    return errorState('No pudimos crear la cuenta. Intenta de nuevo.')
  }

  revalidateUsers()
  return { ...successState(`Cuenta creada para ${fullName}.`), tempPassword, email }
}

/** Busca al usuario afectado y aplica las reglas comunes a rol y activacion. */
async function loadTarget(actor: SessionUser, userId: string) {
  const target = await prisma.user.findFirst({
    where: { id: userId, organizationId: actor.organizationId },
    select: { id: true, fullName: true, role: true, isActive: true },
  })
  if (!target) return { target: null, error: 'No encontramos a esa persona.' }
  // Evita quedarse sin acceso al panel por accidente.
  if (target.id === actor.id) {
    return { target: null, error: 'No puedes cambiar tu propia cuenta desde aquí.' }
  }
  if (target.role === 'SUPER_ADMIN' && actor.role !== 'SUPER_ADMIN') {
    return { target: null, error: 'Solo un super administrador puede modificar esa cuenta.' }
  }
  return { target, error: null }
}

export async function setUserRole(userId: string, role: Role): Promise<ActionState> {
  const actor = await requireRole('ADMIN', 'SUPER_ADMIN')

  const parsed = roleChangeSchema.safeParse({ userId, role })
  if (!parsed.success) return errorState('Ese rol no se puede asignar.')

  const { target, error } = await loadTarget(actor, parsed.data.userId)
  if (!target) return errorState(error)
  if (target.role === parsed.data.role) return successState()

  await prisma.user.update({ where: { id: target.id }, data: { role: parsed.data.role } })
  await recordAudit(actor, {
    action: 'USER_ROLE_CHANGED',
    entityType: 'User',
    entityId: target.id,
    changes: { from: target.role, to: parsed.data.role },
  })

  revalidateUsers()
  return successState(
    parsed.data.role === 'CLIENT'
      ? `${target.fullName} ya no es parte del equipo. Conserva su cuenta de cliente.`
      : `${target.fullName} ahora es ${roleLabels[parsed.data.role]}.`
  )
}

/**
 * Desactivar no borra nada: la persona deja de poder entrar (`getCurrentUser`
 * la trata como sin sesion) y su historial queda intacto.
 */
export async function setUserActive(userId: string, active: boolean): Promise<ActionState> {
  const actor = await requireRole('ADMIN', 'SUPER_ADMIN')

  const parsed = activeChangeSchema.safeParse({ userId, active })
  if (!parsed.success) return errorState('Solicitud inválida.')

  const { target, error } = await loadTarget(actor, parsed.data.userId)
  if (!target) return errorState(error)

  await prisma.user.update({ where: { id: target.id }, data: { isActive: parsed.data.active } })
  await recordAudit(actor, {
    action: parsed.data.active ? 'USER_REACTIVATED' : 'USER_DEACTIVATED',
    entityType: 'User',
    entityId: target.id,
  })

  revalidateUsers()
  return successState(
    parsed.data.active
      ? `${target.fullName} puede volver a entrar.`
      : `${target.fullName} ya no puede entrar. Su historial se conserva.`
  )
}
