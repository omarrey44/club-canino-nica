import 'server-only'

import { prisma } from '@/lib/prisma'
import { clubDateInput } from '@/lib/datetime'

/** Estados que ocupan un cupo. Una reservacion cancelada libera su lugar. */
const OCCUPYING = [
  'PENDING',
  'CONFIRMED',
  'CHECKED_IN',
  'IN_PROGRESS',
  'READY_FOR_PICKUP',
] as const

const MS_PER_DAY = 86_400_000

/**
 * Todos los dias del club que toca una reservacion, como YYYY-MM-DD.
 *
 * Una estancia de tres noches ocupa cupo los tres dias, no solo el de entrada.
 */
function daysCovered(startAt: Date, endAt: Date): string[] {
  const days: string[] = []
  const first = clubDateInput(startAt)
  const last = clubDateInput(endAt)

  let cursor = new Date(startAt)
  let guard = 0

  // El guard evita que un rango corrupto en base de datos cuelgue la peticion.
  while (guard < 400) {
    const day = clubDateInput(cursor)
    days.push(day)
    if (day >= last) break
    cursor = new Date(cursor.getTime() + MS_PER_DAY)
    guard += 1
  }

  return days.length ? days : [first]
}

export type DayAvailability = {
  date: string
  booked: number
  capacity: number | null
  full: boolean
}

/**
 * Ocupacion diaria de un servicio para los proximos `days` dias.
 *
 * Una sola consulta: se traen las reservaciones de la ventana y se expanden en
 * memoria. Con los volumenes de una guarderia esto es mas barato que una
 * consulta por dia, y mucho mas simple que un `generate_series` en SQL.
 *
 * ponytail: expansion en memoria, mover a SQL si la ventana crece a meses.
 */
export async function getServiceAvailability(
  serviceId: string,
  organizationId: string,
  { from = new Date(), days = 60 }: { from?: Date; days?: number } = {}
): Promise<{ capacity: number | null; byDay: Record<string, DayAvailability> }> {
  const service = await prisma.service.findFirst({
    where: { id: serviceId, organizationId },
    select: { dailyCapacity: true },
  })

  const capacity = service?.dailyCapacity ?? null
  const until = new Date(from.getTime() + days * MS_PER_DAY)

  const reservations = await prisma.reservation.findMany({
    where: {
      organizationId,
      serviceId,
      status: { in: [...OCCUPYING] },
      startAt: { lt: until },
      endAt: { gte: from },
    },
    select: { startAt: true, endAt: true },
  })

  const counts: Record<string, number> = {}
  for (const reservation of reservations) {
    for (const day of daysCovered(reservation.startAt, reservation.endAt)) {
      counts[day] = (counts[day] ?? 0) + 1
    }
  }

  const byDay: Record<string, DayAvailability> = {}
  for (let i = 0; i < days; i += 1) {
    const date = clubDateInput(new Date(from.getTime() + i * MS_PER_DAY))
    const booked = counts[date] ?? 0
    byDay[date] = {
      date,
      booked,
      capacity,
      full: capacity !== null && booked >= capacity,
    }
  }

  return { capacity, byDay }
}

/**
 * Comprueba el cupo antes de crear una reservacion.
 *
 * Se vuelve a verificar en el servidor aunque la interfaz ya haya deshabilitado
 * los dias llenos: entre que el cliente abrio el formulario y lo envio pudieron
 * entrar otras reservaciones.
 *
 * ponytail: sin bloqueo de fila, asi que dos envios simultaneos podrian pasarse
 * del cupo por uno. Si el club llega a llenarse a diario, esto pide una
 * restriccion en base de datos o una transaccion serializable.
 */
export async function findFullDays(
  serviceId: string,
  organizationId: string,
  startAt: Date,
  endAt: Date
): Promise<string[]> {
  const { capacity, byDay } = await getServiceAvailability(serviceId, organizationId, {
    from: startAt,
    days: Math.max(1, daysCovered(startAt, endAt).length),
  })

  if (capacity === null) return []

  return daysCovered(startAt, endAt).filter((day) => byDay[day]?.full)
}
