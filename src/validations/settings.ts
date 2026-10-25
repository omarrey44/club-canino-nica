import { z } from 'zod'

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Usa el formato HH:MM.')

export const businessSettingsSchema = z
  .object({
    name: z.string().trim().min(2, 'Escribe el nombre del negocio.').max(80),
    tagline: z.string().trim().max(140, 'Máximo 140 caracteres.'),
    phone: z.string().trim().min(8, 'El teléfono necesita al menos 8 dígitos.').max(20),
    email: z.string().trim().email('Ese correo no parece válido.'),
    address: z.string().trim().min(5, 'Escribe la dirección.').max(200),
    daycareOpen: time,
    daycareClose: time,
    boardingCheckIn: time,
    boardingCheckOut: time,
    taxLabel: z.string().trim().min(2, 'Escribe el nombre del impuesto.').max(20),
    taxPercent: z.coerce
      .number({ message: 'Escribe un número.' })
      .min(0, 'No puede ser negativo.')
      .max(100, 'No puede pasar de 100.'),
    cancellationPolicy: z.string().trim().max(1000, 'Máximo 1000 caracteres.'),
  })
  // "HH:MM" con ceros a la izquierda se compara bien como texto.
  .refine((data) => data.daycareOpen < data.daycareClose, {
    message: 'El cierre debe ser después de la apertura.',
    path: ['daycareClose'],
  })
