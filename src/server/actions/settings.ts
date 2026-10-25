'use server'

import { revalidatePath } from 'next/cache'

import { prisma } from '@/lib/prisma'
import { recordAudit } from '@/server/audit'
import { requireRole } from '@/server/auth/session'
import type { StoredSettings } from '@/server/organization'
import { businessSettingsSchema } from '@/validations/settings'
import { errorState, successState, type ActionState } from './types'

/**
 * Guarda contacto, horarios y cobros del negocio. Al guardarse dejan de ser
 * DEMO: el IVA que se guarda aqui es el que cobran las reservas nuevas.
 */
export async function saveBusinessSettings(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireRole('ADMIN', 'SUPER_ADMIN')

  const parsed = businessSettingsSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return errorState('Revisa los campos marcados.', parsed.error.flatten().fieldErrors)
  }
  const data = parsed.data

  const org = await prisma.organization.findUniqueOrThrow({
    where: { id: user.organizationId },
    select: { settings: true },
  })

  const settings: StoredSettings = {
    // Conserva lo que este formulario no edita (por ejemplo `logoUrl`).
    ...((org.settings ?? {}) as StoredSettings),
    tagline: data.tagline || undefined,
    contact: { phone: data.phone, email: data.email, address: data.address },
    hours: {
      daycareOpen: data.daycareOpen,
      daycareClose: data.daycareClose,
      boardingCheckIn: data.boardingCheckIn,
      boardingCheckOut: data.boardingCheckOut,
    },
    billing: {
      taxLabel: data.taxLabel,
      // El formulario habla en porcentaje; el calculo de precios usa la fraccion.
      taxRate: Math.round(data.taxPercent * 100) / 10_000,
      cancellationPolicy: data.cancellationPolicy,
    },
  }

  await prisma.organization.update({
    where: { id: user.organizationId },
    data: { name: data.name, settings },
  })

  await recordAudit(user, {
    action: 'BUSINESS_SETTINGS_UPDATED',
    entityType: 'Organization',
    entityId: user.organizationId,
    changes: { taxRate: settings.billing!.taxRate, hours: settings.hours },
  })

  // Nombre, horarios e IVA se ven en ambos portales.
  revalidatePath('/', 'layout')
  return successState('Configuración guardada. Ya se usa en el panel y en el portal.')
}
