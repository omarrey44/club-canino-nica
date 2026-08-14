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

async function get(email, path) {
  const cookie = await sessionCookie(email)
  return fetch(`${BASE}${path}`, { headers: { cookie }, redirect: 'manual' })
}

async function check(label, email, path, needles) {
  const res = await get(email, path)
  console.log(`\n${label}  GET ${path} -> ${res.status} ${res.headers.get('location') ?? ''}`)
  if (res.status !== 200) return ''

  const html = await res.text()
  for (const n of needles) console.log(`   ${html.includes(n) ? 'OK   ' : 'FALTA'} "${n}"`)

  // Los KPI se rinden con Suspense: el valor llega en un trozo posterior.
  const kpis = [...html.matchAll(/tabular-nums[^>]*>(\d+)</g)].map((m) => m[1])
  if (kpis.length) console.log(`   KPIs en orden: ${kpis.join(' ')}`)
  return html
}

await check('ADMIN ', 'admin@clubcaninonica.com', '/admin', [
  'Mascotas presentes',
  'Reportes pendientes',
])
await check('ADMIN ', 'admin@clubcaninonica.com', '/admin/configuracion', ['America/Managua', 'DEMO'])
await check('ADMIN ', 'admin@clubcaninonica.com', '/admin/mascotas?q=Rocky', [
  'Rocky',
  'Camila Ruiz',
])

// --- Portal del cliente -----------------------------------------------------
await check('CLIENTE', 'camila@correo.com', '/inicio', [
  'Camila',
  'Rocky',
  'Actividad reciente',
  'Próxima reservación',
])

const listado = await check('CLIENTE', 'camila@correo.com', '/mascotas', ['Rocky', 'Labrador'])
await check('CLIENTE', 'camila@correo.com', '/mascotas/nueva', ['Registrar mascota', 'Alergias'])

const petId = listado.match(/\/mascotas\/([a-z0-9]{20,})"/)?.[1]
if (petId) {
  await check('CLIENTE', 'camila@correo.com', `/mascotas/${petId}`, [
    'Rocky',
    'Vacunas',
    'Rabia',
    'Veterinario',
    'Andres Ruiz',
  ])
  await check('CLIENTE', 'camila@correo.com', `/mascotas/${petId}/editar`, ['Editar a Rocky'])
  await check('CLIENTE', 'camila@correo.com', `/mascotas/${petId}/historial`, [
    'Estancias de Rocky',
    'Con reporte',
  ])
} else {
  console.log('\n   FALTA no se pudo extraer el id de la mascota del listado')
}

await check('CLIENTE', 'camila@correo.com', '/perfil', ['camila@correo.com', 'Cliente'])
await check('CLIENTE', 'camila@correo.com', '/camaras', ['Cámaras'])
await check('ADMIN ', 'admin@clubcaninonica.com', '/admin/camaras', [
  'Quién puede verla ahora',
  'nunca se guardan',
])

// --- Reservaciones ----------------------------------------------------------
const reservas = await check('CLIENTE', 'camila@correo.com', '/reservas', ['Rocky'])
await check('CLIENTE', 'camila@correo.com', '/reservas?filtro=past', ['Finalizadas'])
await check('CLIENTE', 'camila@correo.com', '/reservas/nueva', [
  'Mascota',
  'Servicio',
  'Fechas',
  'Adicionales',
  'Resumen',
])

const reservaId = reservas.match(/\/reservas\/([a-z0-9]{20,})"/)?.[1]
if (reservaId) {
  await check('CLIENTE', 'camila@correo.com', `/reservas/${reservaId}`, [
    'Detalle del cobro',
    'Total',
    'Estado del pago',
  ])
} else {
  console.log('\n   FALTA no se pudo extraer el id de una reservacion')
}

await check('ADMIN ', 'admin@clubcaninonica.com', '/admin/check-in', ['Entradas de hoy'])
await check('ADMIN ', 'admin@clubcaninonica.com', '/admin/reportes', ['Pendientes'])
await check('ADMIN ', 'admin@clubcaninonica.com', '/admin/estancias', ['Estancias'])
await check('CLIENTE', 'camila@correo.com', '/mi-mascota', ['Su día, paso a paso'])
await check('ADMIN ', 'admin@clubcaninonica.com', '/admin/pagos', ['Pagos', 'Pagado'])
await check('ADMIN ', 'admin@clubcaninonica.com', '/admin/reservaciones', ['Reservaciones'])
await check('ADMIN ', 'admin@clubcaninonica.com', '/admin/reservaciones?rango=week', ['Semana'])
await check('ADMIN ', 'admin@clubcaninonica.com', '/admin/servicios', [
  'Guarderia de dia',
  'Hospedaje',
  'DEMO',
])

// --- Permisos ---------------------------------------------------------------
console.log('\n--- permisos ---')

// El catalogo y los precios son de ADMIN, no de todo el personal.
const serviciosEmpleado = await get('cuidador@clubcaninonica.com', '/admin/servicios')
console.log(
  `COLABORADOR -> /admin/servicios ${serviciosEmpleado.status} ${
    serviciosEmpleado.headers.get('location') ?? ''
  }  ${serviciosEmpleado.status === 307 ? '(bloqueado, correcto)' : '(REVISAR)'}`
)

// Una reservacion de otro cliente no debe ser alcanzable.
const reservaAjena = await get('camila@correo.com', '/reservas/clnoexistenoexiste0000')
console.log(
  `CLIENTE -> reserva inexistente  ${reservaAjena.status}  ${
    reservaAjena.status === 404 ? '(404, correcto)' : '(REVISAR)'
  }`
)

const denied = await get('camila@correo.com', '/admin')
console.log(
  `CLIENTE -> /admin              ${denied.status} ${denied.headers.get('location') ?? ''}  ${
    denied.status === 307 ? '(bloqueado, correcto)' : '(REVISAR)'
  }`
)

// Un id que no pertenece al usuario debe dar 404, nunca datos de otro.
const foreign = await get('camila@correo.com', '/mascotas/clnoexistenoexiste0000')
console.log(
  `CLIENTE -> mascota inexistente ${foreign.status}  ${
    foreign.status === 404 ? '(404, correcto)' : '(REVISAR)'
  }`
)
