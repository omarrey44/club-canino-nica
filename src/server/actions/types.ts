/**
 * Forma unica de respuesta de las Server Actions, consumida con `useActionState`.
 *
 * `fieldErrors` se pinta bajo cada input; `message` es el error general.
 * Nunca contiene detalles tecnicos: los errores de base o de proveedor se
 * registran en el servidor y al usuario se le devuelve un texto entendible.
 */
export type ActionState = {
  status: 'idle' | 'success' | 'error'
  message?: string
  fieldErrors?: Record<string, string[]>
}

export const idleState: ActionState = { status: 'idle' }

export function errorState(message: string, fieldErrors?: Record<string, string[]>): ActionState {
  return { status: 'error', message, fieldErrors }
}

export function successState(message?: string): ActionState {
  return { status: 'success', message }
}
