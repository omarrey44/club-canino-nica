import 'server-only'

import { randomUUID } from 'node:crypto'

import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Abstraccion de almacenamiento.
 *
 * Ningun componente visual sabe si detras hay Supabase Storage, Cloudinary u
 * otro proveedor: reciben una URL y ya. Cambiar de proveedor es implementar
 * esta interfaz y cambiar STORAGE_PROVIDER.
 */
export type StoredFile = {
  /** Ruta dentro del proveedor. Es lo que se guarda en base de datos. */
  storageKey: string
  /** URL lista para mostrar. Puede caducar segun el proveedor. */
  url: string
}

export type UploadResult =
  | { ok: true; file: StoredFile }
  | { ok: false; error: string }

const MAX_BYTES = 8 * 1024 * 1024
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/heic']

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? 'club-canino'

/**
 * Valida antes de tocar la red. El tipo declarado por el navegador no es
 * confiable, pero descarta lo obvio y ahorra subidas inutiles; el proveedor
 * vuelve a validar del lado del servidor.
 */
function validateImage(file: File): string | null {
  if (file.size === 0) return 'El archivo esta vacio.'
  if (file.size > MAX_BYTES) return 'La imagen no puede pesar mas de 8 MB.'
  if (!ALLOWED.includes(file.type)) return 'Sube una imagen JPG, PNG o WEBP.'
  return null
}

function extensionFor(file: File): string {
  const fromName = file.name.split('.').pop()?.toLowerCase()
  if (fromName && /^[a-z0-9]{2,5}$/.test(fromName)) return fromName
  return file.type.split('/')[1] ?? 'jpg'
}

/**
 * Sube al bucket de Supabase.
 *
 * El bucket es publico y las rutas llevan un UUID, asi que una URL no se
 * adivina, pero tampoco se protege por sesion. Es un compromiso consciente
 * para el MVP: fotos de mascotas, no documentos sensibles. Si mas adelante
 * hace falta, se pasa el bucket a privado y esta funcion devuelve URLs
 * firmadas; el resto de la aplicacion no cambia.
 */
async function uploadToSupabase(folder: string, file: File): Promise<UploadResult> {
  const invalid = validateImage(file)
  if (invalid) return { ok: false, error: invalid }

  const storageKey = `${folder}/${randomUUID()}.${extensionFor(file)}`
  const supabase = createAdminClient()

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storageKey, file, { contentType: file.type, upsert: false })

  if (error) {
    console.error('[storage.upload]', error)
    return { ok: false, error: 'No pudimos guardar la imagen. Intenta de nuevo.' }
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storageKey)
  return { ok: true, file: { storageKey, url: data.publicUrl } }
}

export async function uploadPetPhoto(petId: string, file: File): Promise<UploadResult> {
  return uploadToSupabase(`pets/${petId}`, file)
}

export async function uploadActivityPhoto(stayId: string, file: File): Promise<UploadResult> {
  return uploadToSupabase(`stays/${stayId}`, file)
}

export async function uploadVaccinationDocument(
  petId: string,
  file: File
): Promise<UploadResult> {
  return uploadToSupabase(`vaccinations/${petId}`, file)
}

export async function deleteFile(storageKey: string): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase.storage.from(BUCKET).remove([storageKey])
  // Un archivo huerfano es preferible a romper la operacion del usuario.
  if (error) console.error('[storage.delete]', error)
}

/** Extrae el storageKey de una URL publica, para poder borrar el archivo. */
export function storageKeyFromUrl(url: string | null): string | null {
  if (!url) return null
  const marker = `/object/public/${BUCKET}/`
  const index = url.indexOf(marker)
  return index === -1 ? null : url.slice(index + marker.length)
}
