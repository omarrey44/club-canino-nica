'use server'

import { revalidatePath } from 'next/cache'

import { prisma } from '@/lib/prisma'
import { recordAudit } from '@/server/audit'
import { requireRole } from '@/server/auth/session'
import { serviceSchema } from '@/validations/service'
import { errorState, successState, type ActionState } from './types'

/** Slug estable a partir del nombre, para URLs y para el seed. */
function slugify(name: string): string {
  return name
    .normalize('NFD')
    // Quita los diacriticos que NFD dejo sueltos: "Baño" pasa a "bano".
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
}

export async function saveService(
  serviceId: string | null,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  // El catalogo y los precios los toca un administrador, no cualquier colaborador.
  const user = await requireRole('ADMIN', 'SUPER_ADMIN')

  const parsed = serviceSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return errorState('Revisa los datos del servicio.', parsed.error.flatten().fieldErrors)
  }

  const data = parsed.data
  const slug = slugify(data.name)

  try {
    if (serviceId) {
      const existing = await prisma.service.findFirst({
        where: { id: serviceId, organizationId: user.organizationId },
        select: { id: true, basePrice: true, name: true },
      })
      if (!existing) return errorState('No encontramos ese servicio.')

      await prisma.service.update({
        where: { id: existing.id },
        data: { ...data, slug },
      })

      await recordAudit(user, {
        action: 'SERVICE_UPDATED',
        entityType: 'Service',
        entityId: existing.id,
        // El precio se audita porque afecta lo que se cobra a partir de ahora.
        changes: {
          name: data.name,
          priceFrom: String(existing.basePrice),
          priceTo: String(data.basePrice),
        },
      })
    } else {
      const created = await prisma.service.create({
        data: { ...data, slug, organizationId: user.organizationId },
        select: { id: true },
      })

      await recordAudit(user, {
        action: 'SERVICE_CREATED',
        entityType: 'Service',
        entityId: created.id,
        changes: { name: data.name, price: String(data.basePrice) },
      })
    }
  } catch (error) {
    const isDuplicateSlug =
      typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002'
    if (isDuplicateSlug) {
      return errorState('Ya existe un servicio con ese nombre.')
    }
    console.error('[services.save]', error)
    return errorState('No pudimos guardar el servicio. Intenta de nuevo.')
  }

  revalidatePath('/admin/servicios')
  revalidatePath('/reservas/nueva')
  return successState(serviceId ? 'Servicio actualizado.' : 'Servicio creado.')
}

/**
 * Activa o desactiva. No hay borrado: las reservaciones pasadas apuntan al
 * servicio y perderian su nombre y su precio historico.
 */
export async function toggleService(serviceId: string): Promise<ActionState> {
  const user = await requireRole('ADMIN', 'SUPER_ADMIN')

  const service = await prisma.service.findFirst({
    where: { id: serviceId, organizationId: user.organizationId },
    select: { id: true, name: true, isActive: true },
  })
  if (!service) return errorState('No encontramos ese servicio.')

  await prisma.service.update({
    where: { id: service.id },
    data: { isActive: !service.isActive },
  })

  await recordAudit(user, {
    action: service.isActive ? 'SERVICE_DEACTIVATED' : 'SERVICE_ACTIVATED',
    entityType: 'Service',
    entityId: service.id,
    changes: { name: service.name },
  })

  revalidatePath('/admin/servicios')
  revalidatePath('/reservas/nueva')
  return successState(service.isActive ? 'Servicio desactivado.' : 'Servicio activado.')
}
