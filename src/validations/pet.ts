import { z } from 'zod'

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Maximo ${max} caracteres.`)
    .optional()
    .or(z.literal(''))
    .transform((value) => (value ? value : null))

/** Fecha en formato del input nativo `type="date"` (YYYY-MM-DD). */
const dateInput = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida.')

export const petSchema = z.object({
  name: z.string().trim().min(1, 'Escribe el nombre de tu mascota.').max(60),
  breed: optionalText(80),
  sex: z.enum(['MALE', 'FEMALE'], { message: 'Elige el sexo.' }),
  size: z.enum(['SMALL', 'MEDIUM', 'LARGE', 'GIANT']),

  birthDate: dateInput
    .optional()
    .or(z.literal(''))
    .transform((value) => (value ? new Date(`${value}T00:00:00Z`) : null))
    .refine((date) => !date || date <= new Date(), {
      message: 'La fecha de nacimiento no puede estar en el futuro.',
    }),

  weightKg: z
    .string()
    .trim()
    .optional()
    .or(z.literal(''))
    .transform((value) => (value ? Number(value) : null))
    .refine((n) => n === null || (!Number.isNaN(n) && n > 0 && n < 200), {
      message: 'Escribe un peso valido en kilos.',
    }),

  colorMarks: optionalText(160),
  temperament: optionalText(240),
})

/**
 * Información de cuidado, no expediente clinico. El personal la consulta
 * durante la estancia; la plataforma no interpreta nada de esto.
 */
export const petMedicalSchema = z.object({
  allergies: optionalText(300),
  medications: optionalText(300),
  medicalConditions: optionalText(300),
  dietNotes: optionalText(300),
  feedingSchedule: optionalText(160),
  isSterilized: z
    .union([z.literal('on'), z.literal('true'), z.literal('')])
    .optional()
    .transform((value) => value === 'on' || value === 'true'),
  vetName: optionalText(120),
  vetPhone: optionalText(30),
  vetClinic: optionalText(120),
  specialNotes: optionalText(400),
})

export const emergencyContactSchema = z.object({
  name: z.string().trim().min(2, 'Escribe el nombre del contacto.').max(120),
  relationship: optionalText(60),
  phone: z.string().trim().min(8, 'El teléfono necesita al menos 8 digitos.').max(30),
})

export const vaccinationSchema = z
  .object({
    name: z.string().trim().min(2, 'Escribe el nombre de la vacuna.').max(80),
    appliedAt: dateInput.transform((value) => new Date(`${value}T00:00:00Z`)),
    expiresAt: dateInput
      .optional()
      .or(z.literal(''))
      .transform((value) => (value ? new Date(`${value}T00:00:00Z`) : null)),
    notes: optionalText(240),
  })
  .refine((data) => !data.expiresAt || data.expiresAt > data.appliedAt, {
    message: 'El vencimiento debe ser posterior a la aplicacion.',
    path: ['expiresAt'],
  })
  .refine((data) => data.appliedAt <= new Date(), {
    message: 'La fecha de aplicacion no puede estar en el futuro.',
    path: ['appliedAt'],
  })

export type PetInput = z.infer<typeof petSchema>
export type VaccinationInput = z.infer<typeof vaccinationSchema>
