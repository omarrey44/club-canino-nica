/**
 * Prueba del ciclo de estancia en un navegador real.
 *
 * Check-in, registro de actividad, aviso de salida y check-out pasan por
 * componentes cliente con `useActionState`, que no se pueden invocar por HTTP
 * sin falsificar la codificacion interna de React. Se manejan aqui como los
 * maneja el personal: haciendo clic.
 *
 * Tambien comprueba lo que ninguna prueba de servidor ve: que una nota interna
 * no aparezca en la pantalla del propietario.
 *
 * Deja la base como estaba.
 *
 *   npm run check:stay      (con `npm run dev` corriendo)
 */
import 'dotenv/config'
import assert from 'node:assert/strict'

import { chromium } from 'playwright'
import { Client } from 'pg'

const BASE = 'http://localhost:3000'
const CODE = 'CCN-TEST1'
const PASSWORD = process.env.SEED_DEMO_PASSWORD

const db = new Client({ connectionString: process.env.DIRECT_URL })
await db.connect()

// --- Reservacion de prueba: confirmada y para hoy ----------------------------

async function limpiar() {
  await db.query(`DELETE FROM reservations WHERE code = $1`, [CODE])
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

const hoy = new Date(Date.now() - 6 * 3_600_000).toISOString().slice(0, 10)
const { rows: creada } = await db.query(
  `INSERT INTO reservations
     (id, code, "organizationId", "clientId", "petId", "serviceId", "startAt", "endAt",
      status, subtotal, taxes, total, currency, "createdAt", "updatedAt")
   VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7,
           'CONFIRMED', 450, 67.5, 517.5, 'NIO', now(), now())
   RETURNING id`,
  [CODE, org, client, pet, service, `${hoy}T14:00:00Z`, `${hoy}T23:59:00Z`]
)
const reservationId = creada[0].id

const browser = await chromium.launch()

async function entrar(email) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const page = await context.newPage()
  await page.goto(`${BASE}/login`)
  // Por rol, no por etiqueta: el campo comparte nombre accesible con el boton
  // de "Mostrar contraseña" que vive dentro de el.
  await page.getByRole('textbox', { name: 'Correo' }).fill(email)
  await page.getByRole('textbox', { name: 'Contraseña' }).fill(PASSWORD)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 20000 })
  return { context, page }
}

try {
  // --- Personal: check-in ---------------------------------------------------
  const { context: staffContext, page: staff } = await entrar('cuidador@clubcaninonica.com')

  await staff.goto(`${BASE}/admin/check-in`)
  const ficha = staff.locator('li', { hasText: CODE })
  await ficha.getByRole('button', { name: 'Registrar ingreso' }).click()
  await ficha.getByLabel('Área inicial').fill('Recepción')
  await ficha.getByLabel('Observaciones de llegada').fill('Prueba automatica')
  await ficha.getByRole('button', { name: /Confirmar llegada/ }).click()

  await staff.waitForURL(/\/admin\/estancias\/[a-z0-9]+/, { timeout: 20000 })
  const stayUrl = staff.url()

  const { rows: estancias } = await db.query(
    `SELECT id, status, "currentLocation" FROM stays WHERE "reservationId" = $1`,
    [reservationId]
  )
  assert.equal(estancias.length, 1, 'el check-in deberia abrir una estancia')
  const stayId = estancias[0].id
  assert.equal(estancias[0].status, 'ACTIVE')
  assert.equal(estancias[0].currentLocation, 'Recepción')

  const { rows: trasIngreso } = await db.query(
    `SELECT status FROM reservations WHERE id = $1`,
    [reservationId]
  )
  assert.equal(trasIngreso[0].status, 'IN_PROGRESS', 'la reservacion pasa a en estancia')

  const { rows: llegada } = await db.query(
    `SELECT type FROM pet_activities WHERE "stayId" = $1`,
    [stayId]
  )
  assert.equal(llegada.length, 1, 'el check-in registra la llegada')
  assert.equal(llegada[0].type, 'CHECK_IN')
  console.log('OK  check-in: estancia abierta y llegada registrada')

  // --- Actividad visible ----------------------------------------------------
  await staff.getByRole('button', { name: 'Alimentación' }).click()
  await staff.getByLabel('Comentario').fill('Comió todo.')
  await staff.getByRole('button', { name: /Guardar alimentación/i }).click()
  await staff.waitForSelector('text=Alimentación registrada', { timeout: 20000 })

  const { rows: comida } = await db.query(
    `SELECT description, "isVisibleToOwner" FROM pet_activities
     WHERE "stayId" = $1 AND type = 'FOOD'`,
    [stayId]
  )
  assert.equal(comida.length, 1, 'la actividad deberia registrarse')
  assert.equal(comida[0].description, 'Comió todo.')
  assert.equal(comida[0].isVisibleToOwner, true)
  console.log('OK  actividad visible registrada')

  // --- Nota interna ---------------------------------------------------------
  await staff.getByRole('button', { name: 'Más tipos' }).click()
  await staff.getByRole('button', { name: 'Observación' }).click()
  await staff.getByLabel('Comentario').fill('Nota interna del equipo.')
  await staff.getByRole('button', { name: 'Cambiar hora o visibilidad' }).click()
  await staff.getByLabel('El propietario lo ve').uncheck()
  await staff.getByRole('button', { name: /Guardar observación/i }).click()
  await staff.waitForSelector('text=Observación registrada', { timeout: 20000 })

  const { rows: interna } = await db.query(
    `SELECT "isVisibleToOwner" FROM pet_activities WHERE "stayId" = $1 AND type = 'NOTE'`,
    [stayId]
  )
  assert.equal(interna.length, 1, 'la nota interna deberia registrarse')
  assert.equal(interna[0].isVisibleToOwner, false, 'la nota interna no puede ser visible')
  console.log('OK  nota interna guardada como no visible')

  // --- El propietario ve lo suyo y solo lo suyo -----------------------------
  const { context: ownerContext, page: owner } = await entrar('camila@correo.com')
  await owner.goto(`${BASE}/mi-mascota`)
  await owner.waitForSelector('text=Su día, paso a paso', { timeout: 20000 })

  const visto = await owner.content()
  assert.ok(visto.includes('Comió todo.'), 'el propietario debe ver la actividad visible')
  assert.ok(
    !visto.includes('Nota interna del equipo.'),
    'el propietario NUNCA debe ver una nota interna'
  )
  assert.ok(visto.includes('Recepción'), 'el propietario ve donde esta su mascota')
  console.log('OK  el propietario ve la actividad visible y no la interna')

  // --- Listo para recoger ---------------------------------------------------
  await staff.goto(stayUrl)
  await staff.getByRole('button', { name: 'Avisar que está listo' }).click()
  // La insignia de la estancia concuerda en femenino ("Lista"); la pantalla del
  // propietario habla de la mascota y dice "Listo". Son sujetos distintos.
  await staff.waitForSelector('text=Lista para recoger', { timeout: 20000 })

  const { rows: lista } = await db.query(`SELECT status FROM stays WHERE id = $1`, [stayId])
  assert.equal(lista[0].status, 'READY_FOR_PICKUP')

  const { rows: aviso } = await db.query(
    `SELECT type FROM notifications WHERE "userId" = $1 AND type = 'READY_FOR_PICKUP'
     ORDER BY "createdAt" DESC LIMIT 1`,
    [client]
  )
  assert.equal(aviso.length, 1, 'el propietario recibe el aviso de que esta listo')
  console.log('OK  listo para recoger: estado y aviso correctos')

  // --- Check-out ------------------------------------------------------------
  await staff.getByRole('button', { name: 'Registrar salida' }).click()
  await staff.getByLabel('Observaciones de salida').fill('Salió tranquilo.')
  await staff.getByRole('button', { name: 'Confirmar salida' }).click()
  await staff.waitForURL(/\/admin\/estancias$/, { timeout: 20000 })

  const { rows: cerrada } = await db.query(
    `SELECT status, "checkOutAt" FROM stays WHERE id = $1`,
    [stayId]
  )
  assert.equal(cerrada[0].status, 'COMPLETED', 'la estancia queda completada')
  assert.ok(cerrada[0].checkOutAt, 'se registra la hora de salida')

  const { rows: trasSalida } = await db.query(
    `SELECT status FROM reservations WHERE id = $1`,
    [reservationId]
  )
  assert.equal(trasSalida[0].status, 'COMPLETED', 'la reservacion queda completada')

  const { rows: salida } = await db.query(
    `SELECT type FROM pet_activities WHERE "stayId" = $1 AND type = 'CHECK_OUT'`,
    [stayId]
  )
  assert.equal(salida.length, 1, 'el check-out se registra en el timeline')
  console.log('OK  check-out: estancia y reservacion completadas')

  await staffContext.close()
  await ownerContext.close()
} finally {
  await browser.close()
  await db.query(
    `DELETE FROM notifications WHERE "userId" = $1 AND body LIKE '%Prueba automatica%'`,
    [client]
  )
  await limpiar()
  await db.end()
}

console.log('\nCiclo de estancia: todas las comprobaciones pasan.')
