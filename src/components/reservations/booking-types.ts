import type { ServiceKind } from '@/generated/prisma/client'

/**
 * Formas que cruzan del servidor al cliente en el flujo de reserva.
 *
 * `basePrice` viaja como texto: Prisma devuelve Decimal, que no sobrevive la
 * serializacion a un componente cliente. La conversion a centavos ocurre en
 * lib/pricing.
 */
export type BookingPet = {
  id: string
  name: string
  breed: string | null
  photoUrl: string | null
}

export type BookingService = {
  id: string
  name: string
  description: string | null
  kind: ServiceKind
  basePrice: string
  priceUnit: string
  dailyCapacity: number | null
}

export type BookingDefaults = {
  daycareOpen: string
  daycareClose: string
  boardingCheckIn: string
  boardingCheckOut: string
  hoursAreDemo: boolean
  taxRate: number
  taxLabel: string
}
