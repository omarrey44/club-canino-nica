/**
 * Prueba de la Server Action de reserva contra el servidor de desarrollo.
 *
 * Una Server Action es un endpoint POST con un id que Next publica en su
 * manifiesto. Invocarla directamente ejercita lo que ninguna prueba de
 * renderizado alcanza: validacion, propiedad de la mascota, cupo, calculo del
 * total y escritura en base.
 *
 * Limpia lo que crea, para no ensuciar los datos demo.
 *
 *   npm run check:booking      (con `npm run dev` corriendo)
 */
import 'dotenv/config'
import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'

import { createClient } from '@supabase/supabase-js'
import { Client } from 'pg'

const BASE = 'http://localhost:3000'
const MANIFEST = '.next/dev/server/server-reference-manifest.json'

// --- Localizar la accion en el manifiesto de Next ----------------------------

function actionId(filename, exportedName) {
  const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'))
  for (const [id, meta] of Object.entries(manifest.node)) {
    if (meta.filename === filename && meta.exportedName === exportedName) return id
  }
  throw new Error(
    `No se encontro la accion ${exportedName} en ${filename}. ` +
      'Abre alguna pagina que la use para que Next la compile y vuelve a intentar.'
  )
}

// --- Sesion ------------------------------------------------------------------

const ref = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname.split('.')[0]
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const { data: session, error: loginError } = await supabase.auth.signInWithPassword({
  email: 'camila@correo.com',
  password: process.env.SEED_DEMO_PASSWORD,
})
if (loginError) throw new Error(`login: ${loginError.message}`)

const cookie = `sb-${ref}-auth-token=base64-${Buffer.from(
  JSON.stringify(session.session)
).toString('base64')}`

/**
 * En desarrollo Next compila cada ruta la primera vez que se pide, y hasta
 * entonces sus Server Actions no estan en el manifiesto. Hay que pedirla ya con
 * sesion: sin ella el proxy redirige al login y la pagina no llega a compilarse.
 */
await fetch(`${BASE}/reservas/nueva`, { headers: { cookie } })

// --- Datos de referencia -----------------------------------------------------

const db = new Client({ connectionString: process.env.DIRECT_URL })
await db.connect()

const { rows: pets } = await db.query(
  `SELECT id FROM pets WHERE name = 'Rocky' LIMIT 1`
)
const { rows: servicios } = await db.query(
  `SELECT id, slug FROM services WHERE slug IN ('guarderia-dia','hospedaje','bano')`
)

const petId = pets[0].id
const idOf = (slug) => servicios.find((s) => s.slug === slug).id

/** Fecha del club (UTC-6) desplazada N dias, como YYYY-MM-DD. */
const clubDate = (offsetDays) =>
  new Date(Date.now() - 6 * 3_600_000 + offsetDays * 86_400_000).toISOString().slice(0, 10)

// --- Invocacion --------------------------------------------------------------

const CREATE = actionId('src/server/actions/reservations.ts', 'createReservation')

async function reservar(input) {
  const res = await fetch(`${BASE}/reservas/nueva`, {
    method: 'POST',
    headers: {
      cookie,
      'Next-Action': CREATE,
      'Content-Type': 'text/plain;charset=UTF-8',
    },
    body: JSON.stringify([input]),
    redirect: 'manual',
  })
  return { status: res.status, body: await res.text() }
}

const creadas = []
async function codigosNuevos() {
  const { rows } = await db.query(
    `SELECT code, subtotal, taxes, total, status FROM reservations
     WHERE code NOT IN ('CCN-1001','CCN-1042','CCN-0980','CCN-0964')
     ORDER BY "createdAt" DESC`
  )
  return rows
}

const antes = (await codigosNuevos()).length

// Caso 1: guarderia de un dia. 450 + 15% = 517.50
await reservar({
  petId,
  serviceId: idOf('guarderia-dia'),
  startDate: clubDate(10),
  startTime: '08:00',
  endDate: clubDate(10),
  endTime: '18:00',
  extras: [],
  clientNotes: 'Prueba automatica',
})

let filas = await codigosNuevos()
assert.equal(filas.length, antes + 1, 'la guarderia de un dia deberia crear una reservacion')
const guarderia = filas[0]
creadas.push(guarderia.code)
assert.equal(Number(guarderia.subtotal), 450, 'subtotal de un dia de guarderia')
assert.equal(Number(guarderia.taxes), 67.5, 'impuesto del 15%')
assert.equal(Number(guarderia.total), 517.5, 'total de un dia de guarderia')
assert.equal(guarderia.status, 'PENDING', 'una reserva nueva nace pendiente')
console.log(`OK  guarderia 1 dia -> ${guarderia.code} total ${guarderia.total}`)

// Caso 2: hospedaje de 3 noches con 2 banos. 750x3 + 250x2 = 2750, +15% = 3162.50
await reservar({
  petId,
  serviceId: idOf('hospedaje'),
  startDate: clubDate(20),
  startTime: '08:00',
  endDate: clubDate(23),
  endTime: '17:00',
  extras: [{ serviceId: idOf('bano'), quantity: 2 }],
  clientNotes: '',
})

filas = await codigosNuevos()
assert.equal(filas.length, antes + 2, 'el hospedaje deberia crear una reservacion')
const hospedaje = filas[0]
creadas.push(hospedaje.code)
assert.equal(Number(hospedaje.subtotal), 2750, '3 noches mas 2 banos')
assert.equal(Number(hospedaje.total), 3162.5, 'total del hospedaje con adicionales')
console.log(`OK  hospedaje 3 noches + 2 banos -> ${hospedaje.code} total ${hospedaje.total}`)

// El pago se crea junto con la reservacion, en pendiente.
const { rows: pagos } = await db.query(
  `SELECT p.status, p.amount FROM payments p
   JOIN reservations r ON r.id = p."reservationId" WHERE r.code = $1`,
  [hospedaje.code]
)
assert.equal(pagos.length, 1, 'toda reservacion nace con su fila de pago')
assert.equal(pagos[0].status, 'PENDING')
assert.equal(Number(pagos[0].amount), 3162.5)
console.log('OK  pago pendiente creado con el monto correcto')

// Caso 3: mascota que no es del cliente. No debe crear nada.
await reservar({
  petId: 'clnoexistenoexiste0000',
  serviceId: idOf('guarderia-dia'),
  startDate: clubDate(11),
  startTime: '08:00',
  endDate: clubDate(11),
  endTime: '18:00',
  extras: [],
  clientNotes: '',
})
filas = await codigosNuevos()
assert.equal(filas.length, antes + 2, 'una mascota ajena no debe crear reservacion')
console.log('OK  mascota ajena rechazada')

// Caso 4: salida antes de la entrada.
await reservar({
  petId,
  serviceId: idOf('guarderia-dia'),
  startDate: clubDate(12),
  startTime: '18:00',
  endDate: clubDate(12),
  endTime: '08:00',
  extras: [],
  clientNotes: '',
})
filas = await codigosNuevos()
assert.equal(filas.length, antes + 2, 'un rango invertido no debe crear reservacion')
console.log('OK  rango invertido rechazado')

// Caso 5: fecha en el pasado.
await reservar({
  petId,
  serviceId: idOf('guarderia-dia'),
  startDate: clubDate(-5),
  startTime: '08:00',
  endDate: clubDate(-5),
  endTime: '18:00',
  extras: [],
  clientNotes: '',
})
filas = await codigosNuevos()
assert.equal(filas.length, antes + 2, 'una fecha pasada no debe crear reservacion')
console.log('OK  fecha pasada rechazada')

// --- Limpieza ----------------------------------------------------------------

if (creadas.length) {
  await db.query(`DELETE FROM reservations WHERE code = ANY($1::text[])`, [creadas])
  console.log(`\nLimpieza: ${creadas.length} reservaciones de prueba eliminadas.`)
}

await db.end()
console.log('Flujo de reserva: todas las comprobaciones pasan.')
