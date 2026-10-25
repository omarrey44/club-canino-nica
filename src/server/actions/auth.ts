'use server'

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import type { Route } from 'next'

import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { getOrganization } from '@/server/organization'
import { isStaff } from '@/server/auth/session'
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from '@/validations/auth'
import { errorState, successState, type ActionState } from './types'

async function appOrigin() {
  const headerList = await headers()
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    `https://${headerList.get('host') ?? 'localhost:3000'}`
  )
}

export async function login(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return errorState('Revisa los datos.', parsed.error.flatten().fieldErrors)
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error || !data.user) {
    // Mensaje deliberadamente ambiguo: no revelar si el correo existe.
    return errorState('Correo o contraseña incorrectos.')
  }

  const user = await prisma.user.findUnique({
    where: { authUserId: data.user.id },
    select: { role: true, isActive: true },
  })

  if (!user || !user.isActive) {
    await supabase.auth.signOut()
    return errorState('Esta cuenta no está activa. Contacta al equipo del club.')
  }

  // Solo rutas internas: un redirectTo absoluto seria un open redirect.
  // El destino se resuelve en runtime, asi que typedRoutes no puede validarlo.
  const destination = (
    parsed.data.redirectTo?.startsWith('/') && !parsed.data.redirectTo.startsWith('//')
      ? parsed.data.redirectTo
      : isStaff(user.role)
        ? '/admin'
        : '/inicio'
  ) as Route

  redirect(destination)
}

export async function register(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return errorState('Revisa los datos.', parsed.error.flatten().fieldErrors)
  }

  const { fullName, email, phone, password } = parsed.data
  const organization = await getOrganization()
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${await appOrigin()}/auth/callback`,
      data: { full_name: fullName },
    },
  })

  if (error || !data.user) {
    if (error?.message.toLowerCase().includes('already')) {
      return errorState('Ya existe una cuenta con ese correo. Inicia sesión.')
    }
    console.error('[auth.register] signUp fallo:', error)
    return errorState('No pudimos crear tu cuenta. Intenta de nuevo en unos minutos.')
  }

  // El rol se asigna aquí, no desde el formulario: registrarse siempre crea un
  // CLIENT. Los roles internos los otorga un administrador.
  await prisma.user.upsert({
    where: { authUserId: data.user.id },
    create: {
      authUserId: data.user.id,
      organizationId: organization.id,
      email,
      fullName,
      phone: phone || null,
      role: 'CLIENT',
    },
    update: { fullName, phone: phone || null },
  })

  // Si el proyecto exige confirmar el correo, signUp no devuelve sesion.
  if (!data.session) {
    return successState(
      `Te enviamos un correo a ${email} para confirmar tu cuenta. Revisa tu bandeja.`
    )
  }

  redirect('/inicio')
}

export async function requestPasswordReset(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = forgotPasswordSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return errorState('Revisa los datos.', parsed.error.flatten().fieldErrors)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${await appOrigin()}/auth/callback?next=/restablecer`,
  })

  if (error) console.error('[auth.requestPasswordReset]', error)

  // Respuesta identica exista o no la cuenta, para no filtrar correos registrados.
  return successState(
    'Si ese correo tiene una cuenta, te enviamos las instrucciones para restablecer tu contraseña.'
  )
}

export async function resetPassword(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = resetPasswordSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return errorState('Revisa los datos.', parsed.error.flatten().fieldErrors)
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // El enlace del correo deja una sesion de recuperacion activa. Sin ella,
  // cualquiera podria cambiar contraseñas ajenas llamando esta accion.
  if (!user) {
    return errorState('El enlace expiró. Solicita uno nuevo desde "Olvidé mi contraseña".')
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password })
  if (error) {
    console.error('[auth.resetPassword]', error)
    return errorState('No pudimos actualizar tu contraseña. Intenta de nuevo.')
  }

  redirect('/inicio')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
