import 'server-only'

import { cache } from 'react'
import { redirect } from 'next/navigation'

import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import type { Role, User } from '@/generated/prisma/client'

export type SessionUser = Pick<
  User,
  'id' | 'organizationId' | 'authUserId' | 'email' | 'fullName' | 'phone' | 'avatarUrl' | 'role'
>

const STAFF_ROLES: Role[] = ['EMPLOYEE', 'ADMIN', 'VETERINARIAN', 'SUPER_ADMIN']

export function isStaff(role: Role): boolean {
  return STAFF_ROLES.includes(role)
}

/**
 * Usuario de la peticion actual, o null.
 *
 * `cache()` deduplica: aunque diez componentes lo llamen durante el mismo
 * render, se ejecuta una sola vez.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) return null

  const user = await prisma.user.findUnique({
    where: { authUserId: authUser.id },
    select: {
      id: true,
      organizationId: true,
      authUserId: true,
      email: true,
      fullName: true,
      phone: true,
      avatarUrl: true,
      role: true,
      isActive: true,
    },
  })

  // Cuenta suspendida por el personal: la sesion de Supabase sigue viva pero
  // la app la trata como no autenticada.
  if (!user || !user.isActive) return null

  // `isActive` no se propaga: fuera de esta funcion siempre es true.
  const sessionUser: SessionUser = {
    id: user.id,
    organizationId: user.organizationId,
    authUserId: user.authUserId,
    email: user.email,
    fullName: user.fullName,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    role: user.role,
  }
  return sessionUser
})

/** Corta el render y redirige al login si no hay sesion. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  return user
}

/**
 * Exige un rol concreto. Usar en cada layout privado y en cada Server Action
 * que toque datos de otros usuarios.
 */
export async function requireRole(...roles: Role[]): Promise<SessionUser> {
  const user = await requireUser()
  if (!roles.includes(user.role)) redirect('/inicio')
  return user
}

/** Atajo para el panel administrativo. */
export async function requireStaff(): Promise<SessionUser> {
  const user = await requireUser()
  if (!isStaff(user.role)) redirect('/inicio')
  return user
}
