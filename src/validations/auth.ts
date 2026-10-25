import { z } from 'zod'

const email = z
  .string()
  .trim()
  .min(1, 'Escribe tu correo.')
  .email('Ese correo no parece valido.')

const password = z
  .string()
  .min(8, 'La contraseña necesita al menos 8 caracteres.')
  .max(72, 'La contraseña es demasiado larga.')

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Escribe tu contraseña.'),
  redirectTo: z.string().optional(),
})

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(2, 'Escribe tu nombre completo.').max(120),
    email,
    phone: z
      .string()
      .trim()
      .min(8, 'El teléfono necesita al menos 8 digitos.')
      .max(20)
      .optional()
      .or(z.literal('')),
    password,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden.',
    path: ['confirmPassword'],
  })

export const forgotPasswordSchema = z.object({ email })

export const resetPasswordSchema = z
  .object({
    password,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden.',
    path: ['confirmPassword'],
  })

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
