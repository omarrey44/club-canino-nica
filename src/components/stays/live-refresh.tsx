'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

/**
 * Refresca la pantalla cada cierto tiempo para que el propietario vea las
 * actualizaciones sin recargar.
 *
 * Es sondeo, no tiempo real. Con un evento cada pocos minutos por mascota, una
 * conexion persistente costaria mas de lo que aporta. Cuando el timeline pida
 * inmediatez de verdad, esto se cambia por Supabase Realtime y el resto de la
 * pagina no se entera.
 *
 * ponytail: sondeo cada 60 s, cambiar a Realtime si hace falta inmediatez.
 */
export function LiveRefresh({ seconds = 60 }: { seconds?: number }) {
  const router = useRouter()

  useEffect(() => {
    // Con la pestana en segundo plano no se pide nada: el usuario no lo ve y
    // gastaria bateria y datos en el teléfono.
    const tick = () => {
      if (document.visibilityState === 'visible') router.refresh()
    }

    const interval = setInterval(tick, seconds * 1000)
    document.addEventListener('visibilitychange', tick)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [router, seconds])

  return null
}
