'use client'

import { RefreshCw, Video, VideoOff } from 'lucide-react'
import { useState, useTransition } from 'react'

import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { openCameraStream, type StreamResponse } from '@/server/actions/cameras'

/**
 * Reproductor de camara.
 *
 * No recibe ninguna URL como prop: la pide al servidor al pulsar, y el servidor
 * decide si el usuario tiene derecho. Un permiso dura pocos minutos, asi que
 * incluso una URL copiada deja de servir enseguida.
 *
 * Sin proveedor conectado no se inventa un video: se muestra un cartel que dice
 * que es una demostracion. Un propietario no debe poder confundir una animacion
 * con su mascota.
 */
export function CameraPlayer({
  cameraId,
  cameraName,
  area,
}: {
  cameraId: string
  cameraName: string
  area: string
}) {
  const [stream, setStream] = useState<StreamResponse | null>(null)
  const [pending, startTransition] = useTransition()

  function open() {
    startTransition(async () => {
      setStream(await openCameraStream(cameraId))
    })
  }

  if (!stream) {
    return (
      <div className="flex aspect-video flex-col items-center justify-center gap-3 rounded-card border border-line bg-navy-800 p-6 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-navy-700 text-navy-200">
          <Video className="size-5" aria-hidden />
        </span>
        <p className="font-bold text-white">{cameraName}</p>
        <p className="text-sm text-navy-200">{area}</p>
        <Button onClick={open} loading={pending} loadingLabel="Conectando">
          Ver transmisión
        </Button>
      </div>
    )
  }

  if (!stream.ok) {
    return (
      <div className="space-y-3">
        <div className="flex aspect-video flex-col items-center justify-center gap-2 rounded-card border border-line bg-navy-50 p-6 text-center">
          <VideoOff className="size-6 text-ink-subtle" aria-hidden />
          <p className="text-sm text-ink-muted">{cameraName}</p>
        </div>
        <Alert tone="warning">{stream.message}</Alert>
      </div>
    )
  }

  if (stream.isDemo) {
    return (
      <div className="space-y-3">
        <div className="relative flex aspect-video flex-col items-center justify-center gap-2 overflow-hidden rounded-card bg-navy-800 p-6 text-center">
          {/* Franja diagonal: se lee como "esto no es real" antes que el texto. */}
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                'repeating-linear-gradient(45deg, #fff 0 12px, transparent 12px 24px)',
            }}
            aria-hidden
          />

          <span className="relative rounded-pill bg-white/15 px-3 py-1 text-2xs font-extrabold tracking-[0.16em] text-white uppercase">
            Demostración
          </span>
          <p className="relative font-bold text-white">{cameraName}</p>
          <p className="relative max-w-xs text-sm text-navy-200">
            Todavía no hay una cámara conectada a esta área. Cuando el club instale el
            equipo, el video en vivo aparecerá aquí.
          </p>
        </div>

        <Alert tone="info">
          Esto es una vista de demostración, no una transmisión real de {area}.
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="relative aspect-video overflow-hidden rounded-card bg-black">
        {/* Reproduccion nativa: Safari toca HLS directo. Para el resto de
            navegadores hara falta hls.js, y se agrega cuando exista un
            proveedor real que probar. */}
        <video
          src={stream.url ?? undefined}
          controls
          autoPlay
          muted
          playsInline
          className="size-full object-contain"
        />
        <span className="absolute top-3 left-3 flex items-center gap-1.5 rounded-pill bg-danger px-2.5 py-1 text-2xs font-extrabold text-white uppercase">
          <span className="size-1.5 animate-pulse rounded-full bg-white" aria-hidden />
          En vivo
        </span>
      </div>

      <Button variant="outline" size="sm" onClick={open} loading={pending}>
        <RefreshCw aria-hidden />
        Reconectar
      </Button>
    </div>
  )
}
