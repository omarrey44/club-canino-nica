import { createBrowserClient } from '@supabase/ssr'

/** Cliente de navegador. Solo usa la clave publicable; nunca la de servicio. */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
