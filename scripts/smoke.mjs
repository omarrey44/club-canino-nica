/**
 * Prueba de extremo a extremo sin navegador: inicia sesion contra Supabase,
 * arma la cookie que espera @supabase/ssr y pide las rutas privadas.
 *
 * Verifica la cadena completa: proxy -> sesion -> Prisma -> render.
 */
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const BASE = 'http://localhost:3000'
const ref = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname.split('.')[0]
const CHUNK = 3180

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function sessionCookie(email) {
  await supabase.auth.signOut()
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: process.env.SEED_DEMO_PASSWORD,
  })
  if (error) throw new Error(`login ${email}: ${error.message}`)

  // @supabase/ssr guarda la sesion en base64 y la parte si excede el limite.
  const name = `sb-${ref}-auth-token`
  const value = 'base64-' + Buffer.from(JSON.stringify(data.session)).toString('base64')
  const parts =
    value.length <= CHUNK
      ? [`${name}=${value}`]
      : Array.from({ length: Math.ceil(value.length / CHUNK) }, (_, i) =>
          `${name}.${i}=${value.slice(i * CHUNK, (i + 1) * CHUNK)}`
        )
  return parts.join('; ')
}

async function check(label, email, path, needles) {
  const cookie = await sessionCookie(email)
  const res = await fetch(`${BASE}${path}`, { headers: { cookie }, redirect: 'manual' })
  console.log(`\n${label}  GET ${path} -> ${res.status} ${res.headers.get('location') ?? ''}`)
  if (res.status !== 200) return

  const html = await res.text()
  for (const n of needles) console.log(`   ${html.includes(n) ? 'OK   ' : 'FALTA'} "${n}"`)

  // Los KPI se rinden con Suspense: el valor llega en un trozo posterior.
  const kpis = [...html.matchAll(/tabular-nums[^>]*>(\d+)</g)].map((m) => m[1])
  if (kpis.length) console.log(`   KPIs en orden: ${kpis.join(' ')}`)
}

await check('ADMIN ', 'admin@clubcaninonica.com', '/admin', [
  'Mascotas presentes',
  'Reportes pendientes',
])
await check('ADMIN ', 'admin@clubcaninonica.com', '/admin/configuracion', ['America/Managua', 'DEMO'])
await check('CLIENTE', 'camila@correo.com', '/inicio', ['Camila'])
await check('CLIENTE', 'camila@correo.com', '/perfil', ['camila@correo.com', 'Cliente'])

// Un cliente no debe poder entrar al panel.
const cookie = await sessionCookie('camila@correo.com')
const denied = await fetch(`${BASE}/admin`, { headers: { cookie }, redirect: 'manual' })
console.log(
  `\nCLIENTE -> /admin  ${denied.status} ${denied.headers.get('location') ?? ''}  ${
    denied.status === 307 ? '(bloqueado, correcto)' : '(REVISAR)'
  }`
)
