import { z } from 'zod'

// En minusculas: Supabase ya las compara asi, y `users.email` es unico sensible
// a mayusculas, asi que "Ana@" y "ana@" serian dos perfiles para una cuenta.
const email = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, 'Escribe tu correo.')
  .email('Ese correo no parece válido.')

const fullName = z.string().trim().min(2, 'Escribe tu nombre completo.').max(120)

const phone = z
  .string()
  .trim()
  .min(8, 'El teléfono necesita al menos 8 dígitos.')
  .max(20)
  .optional()
  .or(z.literal(''))

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
    fullName,
    email,
    phone,
    password,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden.',
    path: ['confirmPassword'],
  })

/** El correo no entra: es la credencial de Supabase y cambiarlo exige confirmarlo. */
export const profileSchema = z.object({ fullName, phone })

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
