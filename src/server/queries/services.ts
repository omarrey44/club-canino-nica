import 'server-only'

import type { BookingDefaults, BookingService } from '@/components/reservations/booking-types'
import { prisma } from '@/lib/prisma'
import type { ServiceKind } from '@/generated/prisma/client'
import { getBusinessSettings } from '@/server/organization'

const listSelect = {
  id: true,
  slug: true,
  name: true,
  description: true,
  kind: true,
  basePrice: true,
  priceUnit: true,
  durationMinutes: true,
  dailyCapacity: true,
  isActive: true,
  sortOrder: true,
} as const

/** Catalogo visible al cliente: solo lo que se puede reservar hoy. */
export async function getBookableServices(organizationId: string) {
  const services = await prisma.service.findMany({
    where: { organizationId, isActive: true },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    select: listSelect,
  })

  return {
    main: services.filter((s) => s.kind !== 'ADDON'),
    addons: services.filter((s) => s.kind === 'ADDON'),
  }
}

/**
 * Todo lo que necesita el paso a paso de reserva, ya serializable: lo usan el
 * portal del cliente y el mostrador del panel.
 */
export async function getBookingOptions(organizationId: string) {
  const [catalog, { hours, billing }] = await Promise.all([
    getBookableServices(organizationId),
    getBusinessSettings(),
  ])

  const toBooking = (service: (typeof catalog.main)[number]): BookingService => ({
    id: service.id,
    name: service.name,
    description: service.description,
    kind: service.kind,
    basePrice: String(service.basePrice),
    priceUnit: service.priceUnit,
    dailyCapacity: service.dailyCapacity,
  })

  const defaults: BookingDefaults = {
    daycareOpen: hours.daycareOpen,
    daycareClose: hours.daycareClose,
    boardingCheckIn: hours.boardingCheckIn,
    boardingCheckOut: hours.boardingCheckOut,
    hoursAreDemo: hours.isDemo,
    taxRate: billing.taxRate,
    taxLabel: billing.taxLabel,
  }

  return { services: catalog.main.map(toBooking), addons: catalog.addons.map(toBooking), defaults }
}

/** Catalogo completo del panel, incluidos los servicios desactivados. */
export async function getAllServices(organizationId: string) {
  return prisma.service.findMany({
    where: { organizationId },
    orderBy: [{ isActive: 'desc' }, { sortOrder: 'asc' }, { name: 'asc' }],
    select: { ...listSelect, _count: { select: { reservations: true } } },
  })
}

export async function getService(serviceId: string, organizationId: string) {
  return prisma.service.findFirst({
    where: { id: serviceId, organizationId },
    select: listSelect,
  })
}

export type ServiceListItem = Awaited<ReturnType<typeof getAllServices>>[number]
export type BookableService = Awaited<ReturnType<typeof getBookableServices>>['main'][number]

/** Texto de la unidad de cobro, para no repetirlo en cada pantalla. */
export function priceUnitLabel(kind: ServiceKind, priceUnit: string): string {
  if (priceUnit === 'UNIT') return 'por servicio'
  return kind === 'BOARDING' ? 'por noche' : 'por día'
}
