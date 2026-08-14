import { Camera, Clock3, LogIn, LogOut, MapPin, Waypoints } from 'lucide-react'
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
      className="overflow-hidden rounded-[1.5rem] border border-line bg-surface shadow-raised"
    >
      <div className="sm:grid sm:grid-cols-[minmax(15rem,0.9fr)_minmax(0,1.25fr)]">
        <div className="relative aspect-[16/10] w-full bg-brand-50 sm:aspect-auto sm:min-h-[24rem]">
          {stay.pet.photoUrl ? (
            <Image
              src={stay.pet.photoUrl}
              alt={`Foto de ${stay.pet.name}`}
              fill
              sizes="(max-width: 640px) 100vw, 380px"
              className="object-cover"
              priority
            />
          ) : (
            <span className="flex size-full items-center justify-center text-5xl font-semibold text-brand-300">
              {stay.pet.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        <div className="flex min-w-0 flex-col justify-center gap-5 p-5 sm:p-7">
          <div className="space-y-2.5">
            <p className="text-xs font-extrabold tracking-[0.14em] text-brand-600 uppercase">Ahora en el club</p>
            <div className="flex flex-wrap items-center gap-2">
              <h2 id="mascota-activa" className="text-3xl leading-none text-navy-900">
                {stay.pet.name}
              </h2>
              <StatusBadge tone={stayStatusTones[stay.status]}>
                {isReady ? 'Listo para recoger' : stayStatusLabels[stay.status]}
              </StatusBadge>
            </div>

            <p className="leading-relaxed text-ink-muted">
              {isReady
                ? `${stay.pet.name} termino su día y te esta esperando.`
                : `${stay.pet.name} está disfrutando su ${stay.reservation.service.name.toLowerCase()}.`}
            </p>
          </div>

          <dl className="grid grid-cols-2 gap-3 text-sm">
            {stay.currentLocation && (
              <div className="col-span-2 flex items-center gap-2 rounded-field bg-brand-50 px-3.5 py-3 text-brand-800">
                <MapPin className="size-4 shrink-0 text-brand-600" aria-hidden />
                <dt className="sr-only">Lugar</dt>
                <dd className="font-extrabold">{stay.currentLocation}</dd>
              </div>
            )}

            <div className="flex items-center gap-2.5 rounded-field bg-canvas px-3.5 py-3">
              <LogIn className="size-4 shrink-0 text-navy-400" aria-hidden />
              <div>
                <dt className="text-xs font-bold text-ink-muted">Entrada</dt>
                <dd className="font-extrabold text-navy-900 tabular-nums">
                  {formatTime(stay.checkInAt)}
                </dd>
              </div>
            </div>

            <div className="flex items-center gap-2.5 rounded-field bg-canvas px-3.5 py-3">
              <LogOut className="size-4 shrink-0 text-navy-400" aria-hidden />
              <div>
                <dt className="text-xs font-bold text-ink-muted">Salida estimada</dt>
                <dd className="font-extrabold text-navy-900 tabular-nums">
                  {formatTime(stay.expectedCheckOutAt)}
                </dd>
              </div>
            </div>
          </dl>

          <p className="flex items-center gap-2 text-sm font-semibold text-ink-muted">
            <Clock3 className="size-4 text-ink-subtle" aria-hidden />
            Última actualización: {relativeTime(lastUpdate)}
          </p>

          <div className="grid grid-cols-2 gap-2">
            <LinkButton size="sm" href="/mi-mascota" className="px-3">
              <Waypoints aria-hidden />
              Ver actividad
            </LinkButton>
            {/* La cámara llega en la Fase 6; el boton ya ocupa su lugar. */}
            <Button size="sm" variant="outline" disabled className="px-3">
              <Camera aria-hidden />
              Cámara en vivo
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
