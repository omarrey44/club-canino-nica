import 'server-only'

import { randomBytes } from 'node:crypto'

import type { Role } from '@/generated/prisma/client'
import { prisma } from '@/lib/prisma'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Crea la cuenta de acceso (Supabase) y el perfil (`users`) de una vez, con una
 * contrasena temporal que el personal entrega en persona. La devuelve una sola
 * vez y no se guarda en ningun lado.
 */
export async function createAccount(input: {
  organizationId: string
  email: string
  fullName: string
  phone?: string | null
  role: Role
}): Promise<{ userId: string; tempPassword: string } | { error: string }> {
  // 19 caracteres base64url: sin '$' ni '#', que ya dieron problemas en .env.
  const tempPassword = randomBytes(14).toString('base64url')
  const admin = createAdminClient()

  const { data, error } = await admin.auth.admin.createUser({
    email: input.email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { full_name: input.fullName },
  })

  if (error || !data.user) {
    console.error('[accounts.create] createUser fallo:', error)
    return {
      error: error?.message.toLowerCase().includes('already')
        ? 'Ese correo ya tiene acceso pero no tiene perfil en el club. Revísalo en Supabase.'
        : 'No pudimos crear la cuenta. Intenta de nuevo.',
    }
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
    return { userId: user.id, tempPassword }
  } catch (dbError) {
    // Sin la fila en `users` la cuenta de acceso quedaria huerfana: se deshace.
    console.error('[accounts.create] alta en base fallo:', dbError)
    await admin.auth.admin.deleteUser(data.user.id)
    return { error: 'No pudimos crear la cuenta. Intenta de nuevo.' }
  }
}
