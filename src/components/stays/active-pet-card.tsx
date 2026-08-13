import { Camera, LogIn, LogOut, MapPin, Waypoints } from 'lucide-react'
import Image from 'next/image'

import { Button, LinkButton } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import { formatTime, relativeTime } from '@/lib/datetime'
import { stayStatusLabels, stayStatusTones } from '@/lib/constants/labels'
import type { ActiveStay } from '@/server/queries/client-home'

/**
 * La pieza central del producto.
 *
 * Responde de un vistazo la pregunta por la que existe la plataforma: como
 * esta mi perro ahora mismo. La foto ocupa el espacio que ocupa a proposito:
 * el protagonista es el perro, no la interfaz.
 */
export function ActivePetCard({ stay }: { stay: ActiveStay }) {
  const lastUpdate = stay.activities[0]?.occurredAt ?? stay.checkInAt
  const isReady = stay.status === 'READY_FOR_PICKUP'

  return (
    <section
      aria-labelledby="mascota-activa"
      className="overflow-hidden rounded-card border border-line bg-surface shadow-card"
    >
      <div className="sm:flex">
        <div className="relative aspect-[16/10] w-full bg-brand-50 sm:aspect-auto sm:w-56 sm:shrink-0">
          {stay.pet.photoUrl ? (
            <Image
              src={stay.pet.photoUrl}
              alt={`Foto de ${stay.pet.name}`}
              fill
              sizes="(max-width: 640px) 100vw, 224px"
              className="object-cover"
              priority
            />
          ) : (
            <span className="flex size-full items-center justify-center text-5xl font-semibold text-brand-300">
              {stay.pet.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-4 p-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 id="mascota-activa" className="text-xl font-semibold text-navy-800">
                {stay.pet.name}
              </h2>
              <StatusBadge tone={stayStatusTones[stay.status]}>
                {isReady ? 'Listo para recoger' : stayStatusLabels[stay.status]}
              </StatusBadge>
            </div>

            <p className="text-sm text-ink-muted">
              {isReady
                ? `${stay.pet.name} termino su dia y te esta esperando.`
                : `${stay.pet.name} esta disfrutando su ${stay.reservation.service.name.toLowerCase()}.`}
            </p>
          </div>

          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            {stay.currentLocation && (
              <div className="col-span-2 flex items-center gap-2">
                <MapPin className="size-4 shrink-0 text-ink-subtle" aria-hidden />
                <dt className="sr-only">Lugar</dt>
                <dd className="font-medium text-ink">{stay.currentLocation}</dd>
              </div>
            )}

            <div className="flex items-center gap-2">
              <LogIn className="size-4 shrink-0 text-ink-subtle" aria-hidden />
              <div>
                <dt className="text-ink-muted">Entrada</dt>
                <dd className="font-medium text-ink tabular-nums">
                  {formatTime(stay.checkInAt)}
                </dd>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <LogOut className="size-4 shrink-0 text-ink-subtle" aria-hidden />
              <div>
                <dt className="text-ink-muted">Salida estimada</dt>
                <dd className="font-medium text-ink tabular-nums">
                  {formatTime(stay.expectedCheckOutAt)}
                </dd>
              </div>
            </div>
          </dl>

          <p className="text-sm text-ink-subtle">
            Ultima actualizacion: {relativeTime(lastUpdate)}
          </p>

          <div className="flex flex-wrap gap-2">
            <LinkButton size="sm" href="/mi-mascota">
              <Waypoints aria-hidden />
              Ver actividad
            </LinkButton>
            {/* La camara llega en la Fase 6; el boton ya ocupa su lugar. */}
            <Button size="sm" variant="outline" disabled>
              <Camera aria-hidden />
              Camara en vivo
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
