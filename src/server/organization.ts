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

type StoredContact = { phone: string; email: string; address: string }
type StoredHours = {
  daycareOpen: string
  daycareClose: string
  boardingCheckIn: string
  boardingCheckOut: string
}
type StoredBilling = { taxRate: number; taxLabel: string; cancellationPolicy: string }

/** Lo que el panel guarda en `Organization.settings`. Cada bloque se guarda entero. */
export type StoredSettings = Partial<{
  tagline: string
  logoUrl: string
  contact: StoredContact
  hours: StoredHours
  billing: StoredBilling
}>

export type BusinessSettings = {
  name: string
  tagline: string
  contact: StoredContact & { isDemo: boolean }
  hours: StoredHours & { isDemo: boolean }
  billing: StoredBilling & { isDemo: boolean }
}

/**
 * Datos de negocio vigentes. Lo guardado desde Configuración manda; lo que
 * nunca se guardo cae a `business.ts` y queda marcado como DEMO.
 */
export const getBusinessSettings = cache(async (): Promise<BusinessSettings> => {
  const org = await getOrganization()
  const stored = (org.settings ?? {}) as StoredSettings
  const { contact, hours, billing } = business

  return {
    name: org.name,
    tagline: stored.tagline ?? business.tagline,
    contact: stored.contact
      ? { ...stored.contact, isDemo: false }
      : { phone: contact.phone, email: contact.email, address: contact.address, isDemo: true },
    hours: stored.hours ? { ...stored.hours, isDemo: false } : { ...hours, isDemo: true },
    billing: stored.billing
      ? { ...stored.billing, isDemo: false }
      : {
          taxRate: billing.taxRate,
          taxLabel: billing.taxLabel,
          cancellationPolicy: billing.cancellationPolicy,
          isDemo: true,
        },
  }
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
