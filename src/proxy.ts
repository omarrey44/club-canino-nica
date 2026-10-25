import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_ROUTES = [
  // Solo la raiz exacta: `startsWith('//')` nunca coincide con una ruta real.
  '/',
  '/login',
  '/registro',
  '/recuperar',
  '/restablecer',
  '/auth',
  // El proveedor de pagos no tiene sesion. Esa ruta se protege verificando la
  // firma del webhook, no con cookies.
  '/api/webhooks',
]

/**
 * Renueva la sesion de Supabase y bloquea rutas privadas.
 *
 * Esto es la primera barrera, no la unica: cada Server Action y cada consulta
 * vuelve a verificar sesion y permisos. Un proxy no protege datos por si solo.
 *
 * En Next.js 16 este archivo se llama `proxy.ts` (antes `middleware.ts`).
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value)
          }
          response = NextResponse.next({ request })
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options)
          }
        },
      },
    }
  )

  // getUser() valida el token contra Supabase. getSession() solo lee la cookie
  // y por eso no sirve como control de acceso.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isPublic = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  )

  if (!user && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(url)
  }

  // El proxy no conoce el rol (vive en Postgres): la raiz decide entre /admin e /inicio.
  if (user && (pathname === '/login' || pathname === '/registro')) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    url.search = ''
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  // El manifest y los iconos deben servirse sin sesion: el navegador los pide
  // antes de instalar la PWA, y una redireccion al login rompe la instalacion.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|brand|manifest.webmanifest|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|webp|avif|ico|webmanifest|mp4)$).*)',
  ],
}
