import { z } from 'zod'

const dateInput = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Elige una fecha.')

const timeInput = z
  .string()
  .trim()
  .regex(/^\d{2}:\d{2}$/, 'Elige un horario.')

/**
 * Entrada del flujo de reserva.
 *
 * Nunca incluye precios. El total se recalcula en el servidor con los precios
 * vigentes: si viniera del formulario, cualquiera podria reservar por un peso.
 */
export const createReservationSchema = z.object({
  /** Solo en mostrador: el cliente por quien reserva el personal. */
  clientId: z.string().min(1).optional(),
  petId: z.string().min(1, 'Elige una mascota.'),
  serviceId: z.string().min(1, 'Elige un servicio.'),
  startDate: dateInput,
  startTime: timeInput,
  endDate: dateInput,
  endTime: timeInput,
  extras: z
    .array(
      z.object({
        serviceId: z.string().min(1),
        quantity: z.number().int().min(0).max(20),
      })
    )
    .max(20)
    .default([]),
  clientNotes: z
    .string()
    .trim()
    .max(400, 'Máximo 400 caracteres.')
    .optional()
    .or(z.literal(''))
    .transform((value) => (value ? value : null)),
})

export const cancelReservationSchema = z.object({
  reservationId: z.string().min(1),
  reason: z
    .string()
    .trim()
    .max(240)
    .optional()
    .or(z.literal(''))
    .transform((value) => (value ? value : null)),
})

export type CreateReservationInput = z.infer<typeof createReservationSchema>
