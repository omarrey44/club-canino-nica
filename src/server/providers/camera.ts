import 'server-only'

import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto'

import type { StreamProtocol } from '@/generated/prisma/client'

/**
 * Abstraccion de streaming de camaras.
 *
 * Reglas que este modulo existe para hacer cumplir:
 *
 * 1. Ninguna credencial del proveedor sale del servidor. `providerRef` es un
 *    identificador opaco guardado en base; el navegador nunca lo ve.
 * 2. El acceso se concede por tiempo limitado y se puede revocar.
 * 3. Cambiar de proveedor no toca ningun componente visual: la interfaz recibe
 *    una URL y un protocolo, y no sabe quien los produjo.
 *
 * Sin proveedor real configurado, `demo` devuelve una transmision de
 * demostracion que la interfaz marca visiblemente como tal. No se simula una
 * camara real: el propietario debe saber que no esta viendo a su mascota.
 */

export type StreamGrant = {
  /** Lo que el reproductor consume. En modo demo no hay video real. */
  url: string | null
  protocol: StreamProtocol
  expiresAt: Date
  /** true cuando no hay proveedor conectado y la interfaz debe advertirlo. */
  isDemo: boolean
}

export type CameraForStream = {
  id: string
  provider: string
  providerRef: string
  protocol: StreamProtocol
}

/** Duracion de un permiso de reproduccion. Corto a proposito: se renueva solo. */
const GRANT_MINUTES = 5

function grantExpiry(): Date {
  return new Date(Date.now() + GRANT_MINUTES * 60_000)
}

/**
 * Firma un identificador opaco con el secreto del servidor.
 *
 * El token viaja al navegador; `providerRef` no. Un proveedor real valida esta
 * firma antes de servir el stream, con lo que una URL copiada deja de servir
 * al expirar.
 */
function signToken(cameraRef: string, expiresAt: Date): string {
  const secret = process.env.CAMERA_SIGNING_SECRET
  if (!secret) {
    throw new Error(
      'Falta CAMERA_SIGNING_SECRET. Sin secreto no se pueden firmar accesos a camara.'
    )
  }

  const nonce = randomUUID()
  const payload = `${cameraRef}.${expiresAt.getTime()}.${nonce}`
  const signature = createHmac('sha256', secret).update(payload).digest('hex')
  return `${expiresAt.getTime()}.${nonce}.${signature}`
}

/** Verifica un token firmado. Comparacion en tiempo constante. */
export function verifyStreamToken(cameraRef: string, token: string): boolean {
  const secret = process.env.CAMERA_SIGNING_SECRET
  if (!secret) return false

  const [expiry, nonce, signature] = token.split('.')
  if (!expiry || !nonce || !signature) return false
  if (Number(expiry) < Date.now()) return false

  const expected = createHmac('sha256', secret)
    .update(`${cameraRef}.${expiry}.${nonce}`)
    .digest('hex')

  const a = Buffer.from(signature, 'hex')
  const b = Buffer.from(expected, 'hex')
  return a.length === b.length && timingSafeEqual(a, b)
}

/**
 * Concede una reproduccion temporal.
 *
 * Esta funcion NO decide si el usuario tiene derecho a ver la camara: eso lo
 * resuelve `server/queries/cameras.ts` recorriendo la cadena
 * usuario -> mascota -> estancia -> CameraAccess. Aqui solo se emite el permiso
 * una vez que esa cadena ya dijo que si.
 */
export function createTemporaryStreamAccess(camera: CameraForStream): StreamGrant {
  const expiresAt = grantExpiry()
  const provider = process.env.CAMERA_PROVIDER ?? 'demo'

  if (provider === 'demo' || camera.protocol === 'DEMO') {
    return { url: null, protocol: 'DEMO', expiresAt, isDemo: true }
  }

  const base = process.env.CAMERA_STREAM_BASE_URL
  if (!base) {
    // Configuracion incompleta: se degrada a demo en vez de exponer el
    // `providerRef` en una URL a medio armar.
    console.error('[camera] CAMERA_PROVIDER real sin CAMERA_STREAM_BASE_URL definido.')
    return { url: null, protocol: 'DEMO', expiresAt, isDemo: true }
  }

  const token = signToken(camera.providerRef, expiresAt)
  const path = camera.protocol === 'HLS' ? 'index.m3u8' : 'webrtc'

  return {
    // El `providerRef` va en la ruta porque el proveedor lo necesita para
    // resolver la camara, pero acompanado siempre de la firma.
    url: `${base.replace(/\/$/, '')}/${encodeURIComponent(camera.providerRef)}/${path}?token=${token}`,
    protocol: camera.protocol,
    expiresAt,
    isDemo: false,
  }
}

/** Minutos que dura un permiso, para que la interfaz sepa cuando renovarlo. */
export const STREAM_GRANT_MINUTES = GRANT_MINUTES
