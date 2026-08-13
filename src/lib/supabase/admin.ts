import 'server-only'

import { createClient } from '@supabase/supabase-js'

/**
 * Cliente con clave de servicio. Ignora RLS y puede administrar usuarios.
 *
 * Solo para: seed, alta de usuarios por parte del personal y firmas de storage.
 * Nunca importar desde un componente cliente ni pasar su resultado al navegador.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) {
    throw new Error('Falta SUPABASE_SERVICE_ROLE_KEY en el entorno.')
  }

  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
