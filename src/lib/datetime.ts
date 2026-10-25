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

  if (hour < 12) return 'Buenos días'
  if (hour < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

/** Primer nombre, para saludos ("Buenos días, Camila"). */
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

/** Solo la hora si cae hoy en el club; si no, con fecha, para que una salida vieja no parezca de hoy. */
export function formatTimeOrDate(date: Date, now: Date = new Date()): string {
  return clubDayIndex(date) === clubDayIndex(now) ? formatTime(date) : formatDateTime(date)
}

export function isPast(date: Date, now: Date = new Date()): boolean {
  return date.getTime() < now.getTime()
}

/** "Hace 4 minutos", para la ultima actualización de la mascota. */
export function relativeTime(date: Date, now: Date = new Date()): string {
  const seconds = Math.round((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return 'Hace un momento'
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `Hace ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `Hace ${hours} ${hours === 1 ? 'hora' : 'horas'}`
  const days = Math.round(hours / 24)
  if (days < 7) return `Hace ${days} ${days === 1 ? 'día' : 'días'}`
  return formatDate(date)
}

/**
 * Nicaragua no observa horario de verano, asi que America/Managua es UTC-6 todo
 * el ano y un desfase fijo basta para calcular los limites del día operativo.
 * Si la plataforma se abre a una zona con DST, esto debe pasar a `date-fns-tz`.
 */
export const CLUB_UTC_OFFSET_HOURS = -6

/**
 * Número de día calendario del club para un instante dado.
 *
 * Sirve para contar días entre dos fechas sin que el huso los desplace: un día
 * de guardería de 8:00 a 18:00 en Managua cruza la medianoche UTC, asi que
 * compararlo en UTC lo contaria como dos días.
 */
export function clubDayIndex(date: Date): number {
  const shifted = new Date(date.getTime() + CLUB_UTC_OFFSET_HOURS * 3_600_000)
  return Math.floor(
    Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate()) / 86_400_000
  )
}

/**
 * Convierte fecha y hora escritas en el calendario del club a un instante UTC.
 *
 * Los inputs nativos `type="date"` y `type="time"` devuelven la hora local que
 * el usuario ve, sin huso. Aquí se le pega el del club para no depender del
 * reloj del dispositivo.
 */
export function clubDateTime(dateInput: string, timeInput: string): Date {
  const [year, month, day] = dateInput.split('-').map(Number)
  const [hour, minute] = timeInput.split(':').map(Number)
  return new Date(
    Date.UTC(year, month - 1, day, hour - CLUB_UTC_OFFSET_HOURS, minute)
  )
}

/** Fecha del club en formato YYYY-MM-DD, para inicializar inputs `type="date"`. */
export function clubDateInput(date: Date = new Date()): string {
  const shifted = new Date(date.getTime() + CLUB_UTC_OFFSET_HOURS * 3_600_000)
  return shifted.toISOString().slice(0, 10)
}

/** Rango [inicio, fin) del día del club, expresado en UTC para consultar Postgres. */
export function clubDayRange(reference: Date = new Date()): { start: Date; end: Date } {
  const shifted = new Date(reference.getTime() + CLUB_UTC_OFFSET_HOURS * 3_600_000)
  const start = new Date(
    Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate())
  )
  start.setUTCHours(start.getUTCHours() - CLUB_UTC_OFFSET_HOURS)

  const end = new Date(start.getTime() + 24 * 3_600_000)
  return { start, end }
}
