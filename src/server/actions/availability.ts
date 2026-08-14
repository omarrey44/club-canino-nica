'use server'

import { clubDateTime } from '@/lib/datetime'
import { requireUser } from '@/server/auth/session'
import { getServiceAvailability } from '@/server/queries/availability'

export type AvailabilityAnswer = {
  /** null = el servicio no tiene cupo maximo configurado. */
  capacity: number | null
  /** Lugares libres el día de entrada. */
  remaining: number | null
  /** Dias sin cupo dentro del rango pedido, como YYYY-MM-DD. */
  fullDays: string[]
}

/**
 * Cupo del servicio para un rango, consultado mientras el cliente elige fechas.
 *
 * Es solo para mostrar: la comprobacion que decide vive en `createReservation`,
 * porque entre esta consulta y el envio pueden entrar otras reservaciones.
 */
export async function checkAvailability(
  serviceId: string,
  startDate: string,
  endDate: string
): Promise<AvailabilityAnswer> {
  const user = await requireUser()

  const startAt = clubDateTime(startDate, '00:00')
  const endAt = clubDateTime(endDate, '23:59')
  const days = Math.max(1, Math.round((endAt.getTime() - startAt.getTime()) / 86_400_000) + 1)

  const { capacity, byDay } = await getServiceAvailability(serviceId, user.organizationId, {
    from: startAt,
    days,
  })

  const fullDays = Object.values(byDay)
    .filter((day) => day.full)
    .map((day) => day.date)

  const firstDay = byDay[startDate]

  return {
    capacity,
    remaining:
      capacity === null || !firstDay ? null : Math.max(0, capacity - firstDay.booked),
    fullDays,
  }
}
