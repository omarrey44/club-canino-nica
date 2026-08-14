/**
 * Prueba del flujo de cobro.
 *
 * Es la logica donde un error se traduce directo en dinero: cobros que no
 * entran, cobros ajenos que se marcan como pagados, o reembolsos que hace quien
 * no debe.
 *
 * Lo que verifica, en orden:
 *   1. Abrir el cobro deja una referencia del proveedor en la base.
 *   2. Un cobro ajeno no se puede cerrar.
 *   3. Al pagar, la reservacion se confirma y el cliente recibe aviso.
 *   4. Pagar dos veces no duplica nada.
 *   5. Un colaborador no puede reembolsar; un administrador si.
 *   6. El webhook sin firma valida no toca nada.
 *
 * Deja la base como estaba.
 *
 *   npm run check:payment      (con `npm run dev` corriendo)
 */
import 'dotenv/config'
import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'

import { chromium } from 'playwright'
import { createClient } from '@supabase/supabase-js'
import { Client } from 'pg'

const BASE = 'http://localhost:3000'
const MANIFEST = '.next/dev/server/server-reference-manifest.json'
const CODE = 'CCN-PAY01'

const ref = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname.split('.')[0]

/** Un cliente por sesion: signOut() revocaria el token ya capturado. */
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
const adminCookie = await sessionFor('admin@clubcaninonica.com')

function actionId(exportedName) {
  const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'))
  for (const [id, meta] of Object.entries(manifest.node)) {
    if (meta.filename === 'src/server/actions/payments.ts' && meta.exportedName === exportedName) {
      return id
    }
  }
  throw new Error(`No se encontro ${exportedName}.`)
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

// --- Preparacion --------------------------------------------------------------

const db = new Client({ connectionString: process.env.DIRECT_URL })
await db.connect()

const limpiar = () => db.query(`DELETE FROM reservations WHERE code = $1`, [CODE])
await limpiar()

const { rows: base } = await db.query(
  `SELECT
     (SELECT id FROM organizations LIMIT 1) AS org,
     (SELECT id FROM users WHERE email = 'camila@correo.com') AS client,
     (SELECT id FROM pets WHERE name = 'Rocky' LIMIT 1) AS pet,
     (SELECT id FROM services WHERE slug = 'guarderia-dia') AS service`
)
const { org, client, pet, service } = base[0]

const inicio = new Date(Date.now() + 5 * 86_400_000).toISOString()
const fin = new Date(Date.now() + 5 * 86_400_000 + 9 * 3_600_000).toISOString()

const { rows: creada } = await db.query(
  `INSERT INTO reservations
     (id, code, "organizationId", "clientId", "petId", "serviceId", "startAt", "endAt",
      status, subtotal, taxes, total, currency, "createdAt", "updatedAt")
   VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7,
           'PENDING', 450, 67.5, 517.5, 'NIO', now(), now())
   RETURNING id`,
  [CODE, org, client, pet, service, inicio, fin]
)
const reservationId = creada[0].id

const { rows: pagoCreado } = await db.query(
  `INSERT INTO payments (id, "reservationId", provider, status, amount, currency, "createdAt", "updatedAt")
   VALUES (gen_random_uuid()::text, $1, 'demo', 'PENDING', 517.5, 'NIO', now(), now())
   RETURNING id`,
  [reservationId]
)
const paymentId = pagoCreado[0].id

console.log(`Reservación ${CODE} creada, pendiente de pago.`)

/**
 * Calentamiento.
 *
 * Las acciones de cobro las importan componentes cliente, y esos modulos solo
 * compilan cuando un navegador pide su chunk. Renderizar el HTML en el servidor
 * no basta.
 */
{
  const browser = await chromium.launch()
  const page = await browser.newPage()
  await page.goto(`${BASE}/login`)
  await page.getByRole('textbox', { name: 'Correo' }).fill('camila@correo.com')
  await page.getByRole('textbox', { name: 'Contraseña' }).fill(process.env.SEED_DEMO_PASSWORD)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 20000 })

  await page.goto(`${BASE}/reservas/${reservationId}`)
  await page.waitForSelector('text=Pagar', { timeout: 30000 })
  await page.goto(`${BASE}/pagos/demo/${paymentId}`)
  await page.waitForSelector('text=Simular pago exitoso', { timeout: 30000 })
  await browser.close()
}

await fetch(`${BASE}/admin/pagos`, { headers: { cookie: adminCookie } })

const estadoPago = async () => {
  const { rows } = await db.query(
    `SELECT p.status, p."providerRef", p."paidAt", p."refundedAt", r.status AS reserva
     FROM payments p JOIN reservations r ON r.id = p."reservationId" WHERE p.id = $1`,
    [paymentId]
  )
  return rows[0]
}

try {
  // 1. Abrir el cobro deja la referencia del proveedor.
  await callAction('startCheckout', [reservationId], ownerCookie, `/reservas/${reservationId}`)
  let pago = await estadoPago()
  assert.ok(pago.providerRef, 'debería guardarse la referencia del proveedor')
  assert.ok(
    pago.providerRef.startsWith('demo_'),
    'sin pasarela conectada la referencia debe marcarse como demo'
  )
  assert.equal(pago.status, 'PENDING', 'abrir el cobro no lo marca como pagado')
  console.log('OK  abrir el cobro: referencia demo guardada, sigue pendiente')

  // 2. Un cobro ajeno no se cierra.
  await callAction('completeDemoPayment', [paymentId, 'paid'], staffCookie, `/pagos/demo/${paymentId}`)
  pago = await estadoPago()
  assert.equal(pago.status, 'PENDING', 'un cobro de otro cliente no debe poder cerrarse')
  console.log('OK  cobro ajeno: rechazado')

  // 3. El cliente paga.
  const avisosAntes = await db.query(
    `SELECT count(*)::int AS n FROM notifications WHERE "userId" = $1 AND type = 'PAYMENT_CONFIRMED'`,
    [client]
  )

  await callAction('completeDemoPayment', [paymentId, 'paid'], ownerCookie, `/pagos/demo/${paymentId}`)
  pago = await estadoPago()
  assert.equal(pago.status, 'PAID', 'el cobro debería quedar pagado')
  assert.ok(pago.paidAt, 'se registra la fecha de pago')
  assert.equal(pago.reserva, 'CONFIRMED', 'pagar confirma la reservación pendiente')

  const avisosDespues = await db.query(
    `SELECT count(*)::int AS n FROM notifications WHERE "userId" = $1 AND type = 'PAYMENT_CONFIRMED'`,
    [client]
  )
  assert.equal(
    avisosDespues.rows[0].n,
    avisosAntes.rows[0].n + 1,
    'el cliente recibe un aviso de pago confirmado'
  )
  console.log('OK  pago: reservación confirmada y cliente avisado')

  // 4. Pagar de nuevo no duplica.
  await callAction('completeDemoPayment', [paymentId, 'paid'], ownerCookie, `/pagos/demo/${paymentId}`)
  const avisosFinal = await db.query(
    `SELECT count(*)::int AS n FROM notifications WHERE "userId" = $1 AND type = 'PAYMENT_CONFIRMED'`,
    [client]
  )
  assert.equal(
    avisosFinal.rows[0].n,
    avisosDespues.rows[0].n,
    'pagar dos veces no debe duplicar el aviso'
  )
  console.log('OK  pago repetido: sin efecto')

  // 5. Reembolso: colaborador no, administrador si.
  await callAction('refundPayment', [paymentId], staffCookie, '/admin/pagos')
  pago = await estadoPago()
  assert.equal(pago.status, 'PAID', 'un colaborador no debe poder reembolsar')

  await callAction('refundPayment', [paymentId], adminCookie, '/admin/pagos')
  pago = await estadoPago()
  assert.equal(pago.status, 'REFUNDED', 'un administrador sí debe poder reembolsar')
  assert.ok(pago.refundedAt, 'se registra la fecha del reembolso')
  console.log('OK  reembolso: bloqueado a colaborador, permitido a administrador')

  // 6. El webhook sin firma no toca nada.
  const sinFirma = await fetch(`${BASE}/api/webhooks/stripe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'checkout.session.completed',
      data: { object: { id: pago.providerRef } },
    }),
  })
  assert.equal(sinFirma.status, 400, 'un webhook sin firma debe rechazarse')

  const conFirmaFalsa = await fetch(`${BASE}/api/webhooks/stripe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'stripe-signature': `t=${Math.floor(Date.now() / 1000)},v1=${'0'.repeat(64)}`,
    },
    body: JSON.stringify({
      type: 'checkout.session.completed',
      data: { object: { id: pago.providerRef } },
    }),
  })
  assert.equal(conFirmaFalsa.status, 400, 'una firma inválida debe rechazarse')

  pago = await estadoPago()
  assert.equal(pago.status, 'REFUNDED', 'el webhook rechazado no debe alterar el cobro')
  console.log('OK  webhook sin firma válida: rechazado y sin efecto')
} finally {
  await limpiar()
  await db.end()
}

console.log('\nFlujo de cobro: todas las comprobaciones pasan.')
