/**
 * Vacia la base y las cuentas de autenticacion.
 *
 * Borra TODAS las filas de las tablas de la aplicacion y TODOS los usuarios de
 * Supabase Auth. No se puede deshacer. Deja intacta `_prisma_migrations`: el
 * esquema no se toca, solo los datos.
 *
 * Pensado para volver a un punto de partida limpio antes de `npm run db:seed`.
 * No confundir con `npm run db:reset` (`prisma migrate reset`), que ademas
 * destruye y reconstruye el esquema.
 *
 *   npm run db:wipe -- --si-borrar-todo
 */
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import { Client } from 'pg'

const CONFIRMACION = '--si-borrar-todo'

/** El esquema vive en las migraciones, no en los datos: esta tabla se queda. */
const INTOCABLES = new Set(['_prisma_migrations'])

if (!process.argv.includes(CONFIRMACION)) {
  console.error(
    `Esto borra todos los datos y todas las cuentas, sin vuelta atras.\n` +
      `Si es lo que quieres:  npm run db:reset -- ${CONFIRMACION}`
  )
  process.exit(1)
}

function requireEnv(name) {
  const value = process.env[name]
  if (!value) throw new Error(`Falta ${name}.`)
  return value
}

const db = new Client({ connectionString: requireEnv('DIRECT_URL') })
await db.connect()

const { rows } = await db.query(
  `SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`
)
const tablas = rows.map((r) => r.tablename).filter((t) => !INTOCABLES.has(t))

if (tablas.length === 0) {
  console.log('No hay tablas de aplicacion que vaciar.')
} else {
  // Un solo TRUNCATE con CASCADE: las claves foraneas hacen imposible borrar
  // tabla por tabla sin acertar el orden, y CASCADE lo resuelve de una vez.
  const lista = tablas.map((t) => `"public"."${t}"`).join(', ')
  await db.query(`TRUNCATE TABLE ${lista} RESTART IDENTITY CASCADE`)
  console.log(`Vaciadas ${tablas.length} tablas:`)
  for (const t of tablas) console.log(`  · ${t}`)
}

await db.end()

const supabase = createClient(
  requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
  requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
if (error) throw error

for (const user of data.users) {
  const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id)
  if (deleteError) throw deleteError
  console.log(`Cuenta borrada: ${user.email}`)
}

console.log(
  `\nBase vacia y ${data.users.length} cuentas borradas. ` +
    `Siguiente paso: npm run db:seed`
)
