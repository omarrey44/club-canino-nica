/**
 * Prueba de la cadena de autorizacion de camaras.
 *
 * Es lo mas delicado del producto: quien puede ver el video de un area donde
 * hay perros ajenos. Las acciones involucradas reciben argumentos planos, asi
 * que se invocan por HTTP y se comprueba la respuesta directamente.
 *
 * Lo que verifica, en orden:
 *   1. Sin permiso, el propietario no puede abrir la camara.
 *   2. Con permiso, si.
 *   3. Al revocar, deja de poder.
 *   4. Al cerrar la estancia, deja de poder aunque el permiso siga vigente.
 *   5. El navegador nunca recibe el identificador del proveedor.
 *
 * Deja la base como estaba.
 *
 *   npm run check:camera      (con `npm run dev` corriendo)
 */
import 'dotenv/config'
import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'

import { chromium } from 'playwright'
import { createClient } from '@supabase/supabase-js'
import { Client } from 'pg'

const BASE = 'http://localhost:3000'
const MANIFEST = '.next/dev/server/server-reference-manifest.json'
const CODE = 'CCN-CAM01'
const PROVIDER_REF = 'prueba-camara-privada-01'

const ref = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname.split('.')[0]

/**
 * Un cliente nuevo por sesion.
 *
 * Reutilizar uno solo obliga a `signOut()` entre logins, y eso revoca del lado
 * del servidor el token que ya se habia capturado: la primera cookie dejaria de
 * servir en cuanto se cree la segunda.
 */
async function sessionFor(email) {
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password: process.env.SEED_DEMO_PASSWORD,
  })
  if (error) throw new Error(`login ${email}: ${error.message}`)
  return `sb-${ref}-auth-token=base64-${Buffer.from(JSON.stringify(data.session)).toString('base64')}`
}

const ownerCookie = await sessionFor('camila@correo.com')
const staffCookie = await sessionFor('cuidador@clubcaninonica.com')

function actionId(exportedName) {
  const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'))
  for (const [id, meta] of Object.entries(manifest.node)) {
    if (meta.filename === 'src/server/actions/cameras.ts' && meta.exportedName === exportedName) {
      return id
    }
  }
  throw new Error(`No se encontro ${exportedName}. Abre /camaras y /admin/camaras primero.`)
}

async function callAction(exportedName, args, cookie, path) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: {
      cookie,
      'Next-Action': actionId(exportedName),
      'Content-Type': 'text/plain;charset=UTF-8',
    },
    body: JSON.stringify(args),
    redirect: 'manual',
  })
  return res.text()
}

const abrir = (cookie) => callAction('openCameraStream', [cameraId], cookie, '/camaras')

// --- Preparacion --------------------------------------------------------------

const db = new Client({ connectionString: process.env.DIRECT_URL })
await db.connect()

async function limpiar() {
  await db.query(`DELETE FROM reservations WHERE code = $1`, [CODE])
  await db.query(`DELETE FROM cameras WHERE "providerRef" = $1`, [PROVIDER_REF])
}
await limpiar()

const { rows: base } = await db.query(
  `SELECT
     (SELECT id FROM organizations LIMIT 1) AS org,
     (SELECT id FROM users WHERE email = 'camila@correo.com') AS client,
     (SELECT id FROM pets WHERE name = 'Rocky' LIMIT 1) AS pet,
     (SELECT id FROM services WHERE slug = 'guarderia-dia') AS service`
)
const { org, client, pet, service } = base[0]

// La salida se pone unas horas adelante del reloj real, no a las 23:59 de hoy:
// si la prueba corre de noche, esa hora ya paso y el permiso naceria vencido.
const entrada = new Date(Date.now() - 3_600_000).toISOString()
const salida = new Date(Date.now() + 6 * 3_600_000).toISOString()

const { rows: creada } = await db.query(
  `INSERT INTO reservations
     (id, code, "organizationId", "clientId", "petId", "serviceId", "startAt", "endAt",
      status, subtotal, taxes, total, currency, "createdAt", "updatedAt")
   VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7,
           'IN_PROGRESS', 450, 67.5, 517.5, 'NIO', now(), now())
   RETURNING id`,
  [CODE, org, client, pet, service, entrada, salida]
)
const reservationId = creada[0].id

const { rows: estancia } = await db.query(
  `INSERT INTO stays (id, "reservationId", "petId", status, "checkInAt", "expectedCheckOutAt",
                      "createdAt", "updatedAt")
   VALUES (gen_random_uuid()::text, $1, $2, 'ACTIVE', now(), $3, now(), now())
   RETURNING id`,
  [reservationId, pet, salida]
)
const stayId = estancia[0].id

const { rows: camara } = await db.query(
  `INSERT INTO cameras (id, "organizationId", name, area, provider, "providerRef", protocol,
                        status, "isActive", "createdAt", "updatedAt")
   VALUES (gen_random_uuid()::text, $1, 'Cámara de prueba', 'Área de prueba', 'demo', $2,
           'DEMO', 'ONLINE', true, now(), now())
   RETURNING id`,
  [org, PROVIDER_REF]
)
const cameraId = camara[0].id

console.log('Estancia y cámara de prueba creadas.')

/**
 * Calentamiento.
 *
 * Next registra una Server Action cuando compila el modulo cliente que la
 * importa, y ese modulo solo compila cuando un navegador de verdad pide su
 * chunk: renderizar el HTML en el servidor no basta. Por eso se abre la pagina
 * una vez con Playwright, con un permiso temporal para que el reproductor
 * llegue a aparecer. Despues todo va por HTTP, que permite afirmar sobre la
 * respuesta exacta de la accion.
 */
await db.query(
  `INSERT INTO camera_access (id, "cameraId", "stayId", "grantedAt")
   VALUES (gen_random_uuid()::text, $1, $2, now())`,
  [cameraId, stayId]
)

{
  const browser = await chromium.launch()
  const page = await browser.newPage()

  // Entrar por el formulario y no inyectando la cookie: @supabase/ssr la parte
  // y la firma a su manera, y replicarlo a mano es fragil.
  await page.goto(`${BASE}/login`)
  await page.getByRole('textbox', { name: 'Correo' }).fill('camila@correo.com')
  await page.getByRole('textbox', { name: 'Contraseña' }).fill(process.env.SEED_DEMO_PASSWORD)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 20000 })

  await page.goto(`${BASE}/camaras`)
  await page.waitForSelector('text=Ver transmisión', { timeout: 30000 })
  await browser.close()
}

await fetch(`${BASE}/admin/camaras`, { headers: { cookie: staffCookie } })
await db.query(`DELETE FROM camera_access WHERE "cameraId" = $1`, [cameraId])

try {
  // 1. Sin permiso, no se abre.
  let respuesta = await abrir(ownerCookie)
  assert.ok(
    !respuesta.includes('"ok":true'),
    'sin permiso, el propietario no debe poder abrir la cámara'
  )
  assert.ok(
    respuesta.includes('no está disponible'),
    'debe responder que no está disponible, sin revelar si existe'
  )
  console.log('OK  sin permiso: acceso denegado')

  // 2. El personal autoriza la estancia.
  await callAction('grantCameraAccess', [stayId, cameraId], staffCookie, '/admin/camaras')

  const { rows: permiso } = await db.query(
    `SELECT id, "revokedAt" FROM camera_access WHERE "cameraId" = $1 AND "stayId" = $2`,
    [cameraId, stayId]
  )
  assert.equal(permiso.length, 1, 'debería crearse el permiso')
  assert.equal(permiso[0].revokedAt, null)

  respuesta = await abrir(ownerCookie)
  assert.ok(
    respuesta.includes('"ok":true'),
    `con permiso, el propietario sí debe poder abrir. Respuesta: ${respuesta.slice(-300)}`
  )
  assert.ok(respuesta.includes('"isDemo":true'), 'sin proveedor real, la respuesta es demo')
  console.log('OK  con permiso: acceso concedido en modo demostración')

  // 3. El identificador del proveedor nunca viaja al navegador.
  assert.ok(
    !respuesta.includes(PROVIDER_REF),
    'el providerRef NUNCA debe aparecer en la respuesta al navegador'
  )
  console.log('OK  el identificador del proveedor no sale del servidor')

  // 4. Revocar corta el acceso.
  await callAction('revokeCameraAccess', [permiso[0].id], staffCookie, '/admin/camaras')
  respuesta = await abrir(ownerCookie)
  assert.ok(!respuesta.includes('"ok":true'), 'tras revocar, el acceso debe cortarse')
  console.log('OK  al revocar: acceso cortado')

  // 5. Con el permiso vigente pero la estancia cerrada, tampoco.
  await callAction('grantCameraAccess', [stayId, cameraId], staffCookie, '/admin/camaras')
  respuesta = await abrir(ownerCookie)
  assert.ok(respuesta.includes('"ok":true'), 'el permiso vuelve a funcionar al reautorizar')

  await db.query(`UPDATE stays SET status = 'COMPLETED' WHERE id = $1`, [stayId])
  respuesta = await abrir(ownerCookie)
  assert.ok(
    !respuesta.includes('"ok":true'),
    'con la estancia cerrada no debe haber acceso, aunque el permiso siga vigente'
  )
  console.log('OK  estancia cerrada: acceso cortado aunque el permiso no se haya revocado')
} finally {
  await limpiar()
  await db.end()
}

console.log('\nAutorización de cámaras: todas las comprobaciones pasan.')
