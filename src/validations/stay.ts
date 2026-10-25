import { z } from 'zod'

const notes = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Maximo ${max} caracteres.`)
    .optional()
    .or(z.literal(''))
    .transform((value) => (value ? value : null))

export const checkInSchema = z.object({
  reservationId: z.string().min(1),
  currentLocation: notes(80),
  checkInNotes: notes(400),
})

export const checkOutSchema = z.object({
  stayId: z.string().min(1),
  checkOutNotes: notes(400),
})

/**
 * Tipos que el personal puede registrar a mano.
 *
 * CHECK_IN y CHECK_OUT quedan fuera a proposito: los genera el sistema al
 * abrir y cerrar la estancia, y permitir escribirlos sueltos desharia la
 * correspondencia entre el timeline y el estado real.
 */
export const STAFF_ACTIVITY_TYPES = [
  'FOOD',
  'WATER',
  'PLAY',
  'WALK',
  'REST',
  'PHOTO',
  'MEDICATION',
  'GROOMING',
  'NOTE',
] as const

export const activitySchema = z.object({
  type: z.enum(STAFF_ACTIVITY_TYPES, { message: 'Elige el tipo de actividad.' }),
  description: notes(400),
  /**
   * Hora en formato HH:MM del reloj del club. Vacio significa "ahora": el caso
   * normal es registrar algo que acaba de pasar.
   */
  time: z
    .string()
    .trim()
    .regex(/^\d{2}:\d{2}$/, 'Hora inválida.')
    .optional()
    .or(z.literal(''))
    .transform((value) => (value ? value : null)),
  /**
   * Un checkbox sin marcar no viaja en el FormData, asi que el formulario pone
   * un input oculto con "" delante: sin el, no habria forma de distinguir
   * "desmarcado" de "el campo no venia".
   */
  isVisibleToOwner: z
    .string()
    .optional()
    .transform((value) => value === 'on' || value === 'true'),
})

export const stayLocationSchema = z.object({
  stayId: z.string().min(1),
  currentLocation: z.string().trim().min(1, 'Escribe el area.').max(80),
})
