'use client'

import { CheckCircle2, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'

import { cn } from '@/lib/utils'
import type { ActionState } from '@/server/actions/types'

type ToastItem = { id: number; message: string; tone: 'success' | 'danger' }

const EVENT = 'app:toast'
let nextId = 0

/**
 * Aviso flotante. Existe porque en formularios largos el mensaje en linea
 * quedaba arriba, fuera de pantalla, mientras el boton estaba abajo.
 */
export function toast(message: string, tone: ToastItem['tone'] = 'success') {
  nextId += 1
  window.dispatchEvent(new CustomEvent<ToastItem>(EVENT, { detail: { id: nextId, message, tone } }))
}

/** Muestra el mensaje general de una Server Action. Los errores por campo siguen en linea. */
export function useActionToast(state: ActionState) {
  useEffect(() => {
    if (state.message) toast(state.message, state.status === 'error' ? 'danger' : 'success')
  }, [state])
}

export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([])

  useEffect(() => {
    function onToast(event: Event) {
      const item = (event as CustomEvent<ToastItem>).detail
      // Tres a la vez como maximo: mas que eso tapa la pantalla en movil.
      setItems((current) => [...current.slice(-2), item])
      setTimeout(() => setItems((current) => current.filter((t) => t.id !== item.id)), 4500)
    }
    window.addEventListener(EVENT, onToast)
    return () => window.removeEventListener(EVENT, onToast)
  }, [])

  return (
    // Encima de la barra inferior del portal en movil; abajo a la derecha en escritorio.
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-[calc(6rem+env(safe-area-inset-bottom))] z-60 flex flex-col items-center gap-2 md:inset-x-auto md:right-6 md:bottom-6 md:items-end"
    >
      {items.map((item) => (
        <div
          key={item.id}
          className={cn(
            'route-enter pointer-events-auto flex w-full max-w-sm items-start gap-2.5 rounded-field border px-4 py-3 text-sm font-semibold shadow-overlay',
            item.tone === 'danger'
              ? 'border-danger/25 bg-danger-soft text-danger'
              : 'border-success/25 bg-surface text-navy-900'
          )}
        >
          {item.tone === 'danger' ? (
            <XCircle className="mt-0.5 size-4.5 shrink-0" aria-hidden />
          ) : (
            <CheckCircle2 className="mt-0.5 size-4.5 shrink-0 text-success" aria-hidden />
          )}
          <p>{item.message}</p>
        </div>
      ))}
    </div>
  )
}
