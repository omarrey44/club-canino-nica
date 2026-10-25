import { z } from 'zod'

/**
 * Reporte del dia.
 *
 * Es un resumen administrativo escrito por el cuidador, no un diagnostico.
 * La plataforma no interpreta estos valores ni saca conclusiones de salud:
 * solo los guarda y se los muestra al propietario.
 */
export const dailyReportSchema = z.object({
  foodIntake: z.enum(['ALL', 'MOST', 'HALF', 'LITTLE', 'NONE'], {
    message: 'Elige cuanto comio.',
  }),
  waterIntake: z.enum(['LOW', 'NORMAL', 'HIGH'], { message: 'Elige la hidratacion.' }),
  energy: z.enum(['LOW', 'NORMAL', 'HIGH'], { message: 'Elige el nivel de energia.' }),
  mood: z.enum(['HAPPY', 'CALM', 'TIRED', 'NERVOUS'], { message: 'Elige el estado de animo.' }),

  walkCount: z.coerce
    .number()
    .int('Escribe un número entero.')
    .min(0, 'No puede ser negativo.')
    .max(20, 'Maximo 20 paseos.'),

  restMinutes: z.coerce
    .number()
    .int('Escribe un número entero.')
    .min(0, 'No puede ser negativo.')
    .max(1440, 'No puede pasar de un día.'),

  activitiesSummary: z
    .string()
    .trim()
    .max(600, 'Maximo 600 caracteres.')
    .optional()
    .or(z.literal(''))
    .transform((value) => (value ? value : null)),

  caregiverNotes: z
    .string()
    .trim()
    .max(800, 'Maximo 800 caracteres.')
    .optional()
    .or(z.literal(''))
    .transform((value) => (value ? value : null)),
})

export type DailyReportInput = z.infer<typeof dailyReportSchema>
