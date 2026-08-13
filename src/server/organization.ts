import 'server-only'

import { cache } from 'react'

import { prisma } from '@/lib/prisma'
import { business } from '@/config/business'

export const DEFAULT_ORGANIZATION_SLUG = 'club-canino-nica'

/**
 * Organizacion activa.
 *
 * Hoy siempre es la misma fila. Cuando la plataforma sea multi-tenant, este es
 * el unico punto que cambia: se resolvera por subdominio o por el usuario.
 */
export const getOrganization = cache(async () => {
  const org = await prisma.organization.findUnique({
    where: { slug: DEFAULT_ORGANIZATION_SLUG },
  })

  if (!org) {
    throw new Error(
      `No existe la organizacion "${DEFAULT_ORGANIZATION_SLUG}". Ejecuta: npm run db:seed`
    )
  }

  return org
})

/** Branding resuelto: base de negocio + overrides guardados en base de datos. */
export const getBranding = cache(async () => {
  const org = await getOrganization()
  const overrides = (org.settings ?? {}) as Partial<{
    name: string
    tagline: string
    logoUrl: string
  }>

  return {
    name: overrides.name ?? org.name ?? business.name,
    tagline: overrides.tagline ?? business.tagline,
    logoUrl: overrides.logoUrl ?? business.logoUrl,
  }
})
