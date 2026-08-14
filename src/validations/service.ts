import { z } from 'zod'

export const serviceSchema = z.object({
  name: z.string().trim().min(2, 'Escribe el nombre del servicio.').max(80),
  description: z
    .string()
    .trim()
    .max(300)
    .optional()
    .or(z.literal(''))
    .transform((value) => (value ? value : null)),
  kind: z.enum(['DAYCARE', 'BOARDING', 'ADDON'], { message: 'Elige el tipo.' }),

  basePrice: z
    .string()
    .trim()
    .min(1, 'Escribe el precio.')
    .transform((value) => Number(value))
    .refine((n) => !Number.isNaN(n) && n >= 0 && n < 1_000_000, {
      message: 'Escribe un precio valido.',
    }),

  priceUnit: z.enum(['DAY', 'UNIT']),

  durationMinutes: z
    .string()
    .trim()
    .optional()
    .or(z.literal(''))
    .transform((value) => (value ? Number(value) : null))
    .refine((n) => n === null || (Number.isInteger(n) && n > 0 && n <= 1440), {
      message: 'La duracion va en minutos, entre 1 y 1440.',
    }),

  /** Vacio significa "sin limite configurado", no cero. */
  dailyCapacity: z
    .string()
    .trim()
    .optional()
    .or(z.literal(''))
    .transform((value) => (value ? Number(value) : null))
    .refine((n) => n === null || (Number.isInteger(n) && n > 0 && n <= 500), {
      message: 'El cupo va entre 1 y 500. Dejalo vacio si no hay limite.',
    }),

  isActive: z
    .union([z.literal('on'), z.literal('true'), z.literal('')])
    .optional()
    .transform((value) => value === 'on' || value === 'true'),
})

export type ServiceInput = z.infer<typeof serviceSchema>
