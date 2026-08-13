import 'dotenv/config'

import { defineConfig, env } from 'prisma/config'

/**
 * Configuracion de la CLI de Prisma (v7+).
 *
 * Desde Prisma 7 las URLs de conexion salen del schema y viven aqui. Migrate e
 * introspeccion usan `DIRECT_URL` (conexion directa, puerto 5432) porque el
 * pooler de Supabase no soporta las sentencias DDL que necesitan.
 * La app en runtime usa `DATABASE_URL` (pooler) a traves del adaptador.
 */
export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: env('DIRECT_URL'),
  },
  migrations: {
    seed: 'tsx prisma/seed.ts',
  },
})
