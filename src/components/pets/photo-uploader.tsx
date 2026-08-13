'use client'

import { Camera } from 'lucide-react'
import { useActionState, useRef } from 'react'

import { Alert } from '@/components/ui/alert'
import { PetAvatar } from '@/components/ui/pet-avatar'
import { idleState, type ActionState } from '@/server/actions/types'

/**
 * Cambio de foto en un solo gesto: el input vive oculto detras del avatar y el
 * formulario se envia solo al elegir el archivo. Pedir "elegir" y despues
 * "subir" son dos toques donde basta uno.
 */
export function PhotoUploader({
  action,
  petName,
  photoUrl,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>
  petName: string
  photoUrl: string | null
}) {
  const [state, formAction, pending] = useActionState(action, idleState)
  const formRef = useRef<HTMLFormElement>(null)

  return (
    <div className="space-y-2">
      <form ref={formRef} action={formAction}>
        <label
          className="group relative inline-flex cursor-pointer rounded-full"
          aria-busy={pending}
        >
          <PetAvatar name={petName} photoUrl={photoUrl} size="xl" />

          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-navy-800/0 text-white opacity-0 transition-all group-hover:bg-navy-800/45 group-hover:opacity-100 group-focus-within:bg-navy-800/45 group-focus-within:opacity-100">
            <Camera className="size-6" aria-hidden />
          </span>

          <input
            type="file"
            name="photo"
            accept="image/jpeg,image/png,image/webp"
            // `capture` no se fuerza: en movil el sistema ofrece camara y galeria.
            className="sr-only"
            disabled={pending}
            onChange={(event) => {
              if (event.target.files?.length) formRef.current?.requestSubmit()
            }}
          />
          <span className="sr-only">Cambiar la foto de {petName}</span>
        </label>
      </form>

      {pending && <p className="text-sm text-ink-muted">Subiendo foto...</p>}
      {state.status === 'error' && state.message && (
        <Alert tone="danger">{state.message}</Alert>
      )}
    </div>
  )
}
