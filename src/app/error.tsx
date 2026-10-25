'use client'

import { RefreshCw } from 'lucide-react'
import { useEffect } from 'react'

import { Button } from '@/components/ui/button'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // El detalle tecnico se queda en el servidor; el usuario ve un mensaje claro.
    console.error(error)
  }, [error])

  return (
    <main className="flex min-h-dvh items-center justify-center px-6">
      <div className="max-w-sm space-y-4 text-center">
        <h1 className="text-xl font-semibold text-navy-800">
          Algo no cargó como esperábamos
        </h1>
        <p className="text-ink-muted">
          Ya estamos al tanto. Intenta de nuevo en un momento.
        </p>
        <Button onClick={reset}>
          <RefreshCw aria-hidden />
          Reintentar
        </Button>
      </div>
    </main>
  )
}
