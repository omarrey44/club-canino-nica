import { business } from '@/config/business'

/**
 * Saludo segun la hora local del club (no la del navegador del usuario:
 * el personal y el cliente deben ver lo mismo).
 */
export function greeting(now: Date = new Date()): string {
  const hour = Number(
    new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      hour12: false,
      timeZone: business.timezone,
    }).format(now)
  )

  if (hour < 12) return 'Buenos dias'
  if (hour < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

/** Primer nombre, para saludos ("Buenos dias, Camila"). */
export function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? fullName
}

export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat(business.locale, {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: business.timezone,
  }).format(date)
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat(business.locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: business.timezone,
  }).format(date)
}

export function formatDateTime(date: Date): string {
  return `${formatDate(date)}, ${formatTime(date)}`
}

/**
 * Nicaragua no observa horario de verano, asi que America/Managua es UTC-6 todo
 * el ano y un desfase fijo basta para calcular los limites del dia operativo.
 * Si la plataforma se abre a una zona con DST, esto debe pasar a `date-fns-tz`.
 */
const CLUB_UTC_OFFSET_HOURS = -6

/** Rango [inicio, fin) del dia del club, expresado en UTC para consultar Postgres. */
export function clubDayRange(reference: Date = new Date()): { start: Date; end: Date } {
  const shifted = new Date(reference.getTime() + CLUB_UTC_OFFSET_HOURS * 3_600_000)
  const start = new Date(
    Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate())
  )
  start.setUTCHours(start.getUTCHours() - CLUB_UTC_OFFSET_HOURS)

  const end = new Date(start.getTime() + 24 * 3_600_000)
  return { start, end }
}
