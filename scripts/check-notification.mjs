/**
 * Prueba de las notificaciones.
 *
 * Lo que importa aquí es el límite: un aviso ajeno no se puede marcar como
 * leído, porque eso serviría para saber si existe.
 *
 *   npm run check:notification      (con `npm run dev` corriendo)
 */
import 'dotenv/config'
import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'

import { chromium } from 'playwright'
import { createClient } from '@supabase/supabase-js'
import { Client } from 'pg'

const BASE = 'http://localhost:3000'
const MANIFEST = '.next/dev/server/server-reference-manifest.json'
const MARCA = 'Prueba automatica de avisos'

const ref = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname.split('.')[0]

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

function actionId(exportedName) {
  const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'))
  for (const [id, meta] of Object.entries(manifest.node)) {
    if (
      meta.filename === 'src/server/actions/notifications.ts' &&
      meta.exportedName === exportedName
    ) {
      return id
    }
  }
  throw new Error(`No se encontro ${exportedName}.`)
}

async function callAction(exportedName, args, cookie) {
  const res = await fetch(`${BASE}/notificaciones`, {
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

const db = new Client({ connectionString: process.env.DIRECT_URL })
await db.connect()

const limpiar = () => db.query(`DELETE FROM notifications WHERE body = $1`, [MARCA])
await limpiar()

const { rows: base } = await db.query(
  `SELECT
     (SELECT id FROM organizations LIMIT 1) AS org,
     (SELECT id FROM users WHERE email = 'camila@correo.com') AS cliente,
     (SELECT id FROM users WHERE email = 'cuidador@clubcaninonica.com') AS personal`
)
const { org, cliente, personal } = base[0]

async function crearAviso(userId, titulo) {
  const { rows } = await db.query(
    `INSERT INTO notifications (id, "organizationId", "userId", type, title, body, "createdAt")
     VALUES (gen_random_uuid()::text, $1, $2, 'NEW_ACTIVITY', $3, $4, now())
     RETURNING id`,
    [org, userId, titulo, MARCA]
  )
  return rows[0].id
}

const mios = [
  await crearAviso(cliente, 'Aviso de prueba 1'),
  await crearAviso(cliente, 'Aviso de prueba 2'),
]
const ajeno = await crearAviso(personal, 'Aviso del personal')

console.log('Avisos de prueba creados.')

// Calentamiento: la acción la importa un componente cliente, y ese módulo solo
// compila cuando un navegador pide su chunk.
{
  const browser = await chromium.launch()
  const page = await browser.newPage()
  await page.goto(`${BASE}/login`)
  await page.getByRole('textbox', { name: 'Correo' }).fill('camila@correo.com')
  await page.getByRole('textbox', { name: 'Contraseña' }).fill(process.env.SEED_DEMO_PASSWORD)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 20000 })

  await page.goto(`${BASE}/notificaciones`)
  await page.waitForSelector('text=Aviso de prueba 1', { timeout: 30000 })

  // Se comprueba por el texto para lectores de pantalla y no por el número
  // dibujado: la insignia debe anunciarse, no solo verse.
  const enlace = await page.locator('a[href="/notificaciones"]').first().textContent()
  assert.ok(
    enlace?.includes('sin leer'),
    'la navegación debe anunciar cuántos avisos hay sin leer'
  )
  console.log('OK  la navegación anuncia el contador de no leídos')

  await browser.close()
}

const sinLeer = async (userId) => {
  const { rows } = await db.query(
    `SELECT count(*)::int AS n FROM notifications WHERE "userId" = $1 AND "readAt" IS NULL AND body = $2`,
    [userId, MARCA]
  )
  return rows[0].n
}

try {
  assert.equal(await sinLeer(cliente), 2, 'deberían quedar dos avisos sin leer')

  // 1. Un aviso ajeno no se marca.
  await callAction('markNotificationRead', [ajeno], ownerCookie)
  assert.equal(await sinLeer(personal), 1, 'un aviso de otro usuario no debe marcarse')
  console.log('OK  aviso ajeno: no se puede marcar como leído')

  // 2. Uno propio sí.
  await callAction('markNotificationRead', [mios[0]], ownerCookie)
  assert.equal(await sinLeer(cliente), 1, 'el aviso propio debería quedar leído')
  console.log('OK  aviso propio: marcado como leído')

  // 3. Marcar todo.
  await callAction('markAllNotificationsRead', [], ownerCookie)
  assert.equal(await sinLeer(cliente), 0, 'no debería quedar ninguno sin leer')
  assert.equal(await sinLeer(personal), 1, 'marcar todo no debe tocar avisos de otros')
  console.log('OK  marcar todo: solo afecta los propios')
} finally {
  await limpiar()
  await db.end()
}

console.log('\nNotificaciones: todas las comprobaciones pasan.')
