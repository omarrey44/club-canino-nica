import 'server-only'

import { randomBytes } from 'node:crypto'

import type { Role } from '@/generated/prisma/client'
import { prisma } from '@/lib/prisma'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Correos de autenticacion (confirmar cuenta, recuperar contrasena).
 *
 * Apagados mientras el proyecto no tenga SMTP propio: el correo incluido en
 * Supabase solo entrega a miembros del equipo, asi que un cliente real nunca
 * recibiria la confirmacion y se quedaria sin poder entrar. Sin correos, el
 * registro crea la cuenta ya confirmada y las contrasenas olvidadas las
 * restablece un administrador. Con SMTP listo: AUTH_EMAILS_ENABLED=true.
 */
export function authEmailsEnabled(): boolean {
  return process.env.AUTH_EMAILS_ENABLED === 'true'
}

/** 19 caracteres base64url: sin '$' ni '#', que ya dieron problemas en .env. */
export function generateTempPassword(): string {
  return randomBytes(14).toString('base64url')
}

/**
 * Crea la cuenta de acceso (Supabase) y el perfil (`users`) de una vez, ya
 * confirmada y sin enviar correo. Sin `password` genera una temporal que el
 * personal entrega en persona; se devuelve una sola vez y no se guarda.
 */
export async function createAccount(input: {
  organizationId: string
  email: string
  fullName: string
  phone?: string | null
  role: Role
  password?: string
}): Promise<
  { userId: string; tempPassword: string } | { error: string; code: 'exists' | 'failed' }
> {
  const password = input.password ?? generateTempPassword()
  const admin = createAdminClient()

  const { data, error } = await admin.auth.admin.createUser({
    email: input.email,
    password,
    email_confirm: true,
    user_metadata: { full_name: input.fullName },
  })

  if (error || !data.user) {
    const exists = Boolean(error?.message.toLowerCase().includes('already'))
    if (!exists) console.error('[accounts.create] createUser fallo:', error)
    return exists
      ? {
          code: 'exists',
          error: 'Ese correo ya tiene acceso pero no tiene perfil en el club. Revísalo en Supabase.',
        }
      : { code: 'failed', error: 'No pudimos crear la cuenta. Intenta de nuevo.' }
  }

  try {
    const user = await prisma.user.create({
      data: {
        authUserId: data.user.id,
        organizationId: input.organizationId,
        email: input.email,
        fullName: input.fullName,
        phone: input.phone || null,
        role: input.role,
      },
      select: { id: true },
    })
    return { userId: user.id, tempPassword: password }
  } catch (dbError) {
    // Sin la fila en `users` la cuenta de acceso quedaria huerfana: se deshace.
    console.error('[accounts.create] alta en base fallo:', dbError)
    await admin.auth.admin.deleteUser(data.user.id)
    return { code: 'failed', error: 'No pudimos crear la cuenta. Intenta de nuevo.' }
  }
}
