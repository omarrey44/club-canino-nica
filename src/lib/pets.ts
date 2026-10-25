/**
 * Logica de mascotas sin dependencias de servidor.
 *
 * Vive fuera de `server/queries` a proposito: estas funciones las necesitan
 * tambien componentes cliente, y arrastrar el modulo de consultas al navegador
 * meteria Prisma y `pg` en el bundle.
 */

/** Dias de anticipacion con que se avisa que una vacuna vence. */
export const VACCINATION_WARNING_DAYS = 30

export type VaccinationStatus = 'ok' | 'expiring' | 'expired' | 'unknown'

export function vaccinationStatus(
  expiresAt: Date | null,
  now: Date = new Date()
): VaccinationStatus {
  if (!expiresAt) return 'unknown'
  if (expiresAt < now) return 'expired'
  const limit = new Date(now.getTime() + VACCINATION_WARNING_DAYS * 86_400_000)
  return expiresAt <= limit ? 'expiring' : 'ok'
}

export function needsAttention(expiresAt: Date | null, now?: Date): boolean {
  const status = vaccinationStatus(expiresAt, now)
  return status === 'expired' || status === 'expiring'
}

/** Edad legible a partir de la fecha de nacimiento. */
export function formatAge(birthDate: Date | null, now: Date = new Date()): string | null {
  if (!birthDate) return null

  const months =
    (now.getUTCFullYear() - birthDate.getUTCFullYear()) * 12 +
    (now.getUTCMonth() - birthDate.getUTCMonth())

  if (months < 1) return 'Menos de un mes'
  if (months < 24) return `${months} ${months === 1 ? 'mes' : 'meses'}`

  const years = Math.floor(months / 12)
  return `${years} ${years === 1 ? 'año' : 'años'}`
}
