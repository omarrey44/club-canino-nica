/**
 * Crea el bucket de almacenamiento si no existe.
 *
 * Publico a proposito: las rutas llevan un UUID, asi que una URL no se
 * adivina, pero tampoco se protege por sesion. Es un compromiso consciente
 * para el MVP (fotos de mascotas, no documentos sensibles) que mantiene
 * simple next/image y su cache. Para pasarlo a privado basta cambiar `public`
 * aqui y devolver URLs firmadas desde src/server/providers/storage.ts.
 *
 *   node scripts/init-storage.mjs
 */
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? 'club-canino'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env')
  process.exit(1)
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const { data: buckets, error: listError } = await supabase.storage.listBuckets()
if (listError) {
  console.error('No se pudieron listar los buckets:', listError.message)
  process.exit(1)
}

if (buckets.some((b) => b.name === BUCKET)) {
  console.log(`El bucket "${BUCKET}" ya existe.`)
  process.exit(0)
}

const { error } = await supabase.storage.createBucket(BUCKET, {
  public: true,
  fileSizeLimit: 8 * 1024 * 1024,
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/heic'],
})

if (error) {
  console.error('No se pudo crear el bucket:', error.message)
  process.exit(1)
}

console.log(`Bucket "${BUCKET}" creado.`)
