import { NextResponse, type NextRequest } from 'next/server'

import { createClient } from '@/lib/supabase/server'

/**
 * Punto de aterrizaje de los enlaces que Supabase envia por correo
 * (confirmacion de cuenta y restablecimiento de contrasena).
 * Cambia el `code` por una sesion y redirige adentro de la app.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const next = searchParams.get('next')

  // Solo rutas internas: un `next` absoluto seria un open redirect.
  const destination = next?.startsWith('/') ? next : '/inicio'

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=enlace-invalido`)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=enlace-expirado`)
  }

  return NextResponse.redirect(`${origin}${destination}`)
}
