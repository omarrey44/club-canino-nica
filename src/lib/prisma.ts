import { PrismaPg } from '@prisma/adapter-pg'

import { PrismaClient } from '@/generated/prisma/client'

// En dev, Next recarga modulos en cada edicion. Sin este cache global se abre
// una conexion nueva por recarga hasta agotar el pool de Supabase.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

function createPrismaClient() {
  // Prisma 7 conecta a traves de un driver adapter. En runtime usamos
  // DATABASE_URL (el pooler de Supabase); las migraciones usan DIRECT_URL.
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
