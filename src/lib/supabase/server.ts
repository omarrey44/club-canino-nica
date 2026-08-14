import 'server-only'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Cliente ligado a las cookies de la peticion. Usar en Server Components,
 * Server Actions y Route Handlers.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options)
            }
          } catch {
            // Los Server Components no pueden escribir cookies. La renovacion de
            // sesion la hace proxy.ts, asi que ignorar aquí es seguro.
          }
        },
      },
    }
  )
}
