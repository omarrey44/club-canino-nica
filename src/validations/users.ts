import { z } from 'zod'

/** Roles que un administrador puede otorgar. SUPER_ADMIN no se asigna desde la app. */
export const ASSIGNABLE_STAFF_ROLES = ['EMPLOYEE', 'VETERINARIAN', 'ADMIN'] as const

export const staffMemberSchema = z.object({
  email: z.string().trim().toLowerCase().email('Ese correo no parece válido.'),
  fullName: z.string().trim().min(2, 'Escribe el nombre completo.').max(120),
  role: z.enum(ASSIGNABLE_STAFF_ROLES, { message: 'Elige un rol.' }),
})

export const roleChangeSchema = z.object({
  userId: z.string().min(1),
  // CLIENT incluido: es como se saca a alguien del equipo sin borrar su cuenta.
  role: z.enum(['CLIENT', ...ASSIGNABLE_STAFF_ROLES]),
})

export const activeChangeSchema = z.object({
  userId: z.string().min(1),
  active: z.boolean(),
})
