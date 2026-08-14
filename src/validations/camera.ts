import { z } from 'zod'

const optional = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Maximo ${max} caracteres.`)
    .optional()
    .or(z.literal(''))
    .transform((value) => (value ? value : null))

export const cameraSchema = z.object({
  name: z.string().trim().min(2, 'Escribe el nombre de la camara.').max(80),
  area: z.string().trim().min(2, 'Escribe el area que cubre.').max(80),
  description: optional(240),

  provider: z.string().trim().min(1).max(40).default('demo'),

  /**
   * Identificador opaco del proveedor. Nunca es una URL con credenciales: si
   * alguien pega aqui un `rtsp://usuario:clave@...`, se rechaza.
   */
  providerRef: z
    .string()
    .trim()
    .min(1, 'Escribe el identificador de la camara.')
    .max(200)
    .refine((value) => !value.includes('@'), {
      message: 'No pegues credenciales aqui. Usa solo el identificador de la camara.',
    })
    .refine((value) => !/^[a-z]+:\/\//i.test(value), {
      message: 'Escribe solo el identificador, no la URL completa del stream.',
    }),

  protocol: z.enum(['HLS', 'WEBRTC', 'MJPEG', 'DEMO']),
  status: z.enum(['ONLINE', 'OFFLINE', 'MAINTENANCE']),

  isActive: z
    .string()
    .optional()
    .transform((value) => value === 'on' || value === 'true'),
})

export type CameraInput = z.infer<typeof cameraSchema>
