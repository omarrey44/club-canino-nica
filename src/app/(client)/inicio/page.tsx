import { CalendarPlus, Camera, PawPrint, Plus } from 'lucide-react'
import Image from 'next/image'
import type { Metadata } from 'next'

import { ActivePetCard } from '@/components/stays/active-pet-card'
import { ActivityTimeline } from '@/components/stays/activity-timeline'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { LinkButton } from '@/components/ui/button'
import { ReservationCard } from '@/components/reservations/reservation-card'
import { formatDate, firstName, greeting } from '@/lib/datetime'
import { getClientHome } from '@/server/queries/client-home'
import { requireUser } from '@/server/auth/session'

export const metadata: Metadata = { title: 'Inicio' }

export default async function ClientHomePage() {
  const user = await requireUser()
  const { activeStay, nextReservation, petCount } = await getClientHome(user)

  const lastPhoto = activeStay?.photos[0]

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-navy-800">
          {greeting()}, {firstName(user.fullName)}
        </h1>
        <p className="text-ink-muted">
          {activeStay
            ? `Asi esta ${activeStay.pet.name} hoy.`
            : petCount > 0
              ? 'Hoy no tienes ninguna mascota en el club.'
              : 'Empecemos por registrar a tu mascota.'}
        </p>
      </header>

      {activeStay ? (
        <ActivePetCard stay={activeStay} />
      ) : petCount === 0 ? (
        <EmptyState
          icon={PawPrint}
          title="Todavia no tienes mascotas registradas"
          description="Con su ficha completa el equipo del club sabe como cuidarla: alimentacion, alergias y contactos de emergencia."
          action={
            <LinkButton size="sm" href="/mascotas/nueva">
              <Plus aria-hidden />
              Registrar mascota
            </LinkButton>
          }
        />
      ) : null}

      {nextReservation && (
        <section className="space-y-3" aria-labelledby="proxima-reservacion">
          <h2 id="proxima-reservacion" className="text-base font-semibold text-ink">
            Proxima reservacion
          </h2>
          <ReservationCard reservation={nextReservation} />
        </section>
      )}

      {activeStay && activeStay.activities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Ultimas actualizaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityTimeline activities={activeStay.activities} />
          </CardContent>
        </Card>
      )}

      {lastPhoto && (
        <Card>
          <CardHeader>
            <CardTitle>Ultima foto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="relative aspect-[4/3] overflow-hidden rounded-field bg-navy-50">
              <Image
                src={lastPhoto.url}
                alt={lastPhoto.caption ?? `Foto de ${activeStay.pet.name}`}
                fill
                sizes="(max-width: 768px) 100vw, 640px"
                className="object-cover"
              />
            </div>
            {lastPhoto.caption && <p className="text-sm text-ink-muted">{lastPhoto.caption}</p>}
            <p className="text-2xs text-ink-subtle">{formatDate(lastPhoto.takenAt)}</p>
          </CardContent>
        </Card>
      )}

      <section className="space-y-3" aria-labelledby="acciones-rapidas">
        <h2 id="acciones-rapidas" className="text-base font-semibold text-ink">
          Acciones rapidas
        </h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {/* La reserva llega en la Fase 3; el lugar ya esta reservado. */}
          <LinkButton variant="outline" href="/reservas" className="justify-start">
            <CalendarPlus aria-hidden />
            Ver mis reservaciones
          </LinkButton>
          <LinkButton variant="outline" href="/mascotas" className="justify-start">
            <PawPrint aria-hidden />
            {petCount > 0 ? 'Mis mascotas' : 'Registrar mascota'}
          </LinkButton>
          {activeStay && (
            <LinkButton variant="outline" href="/mi-mascota" className="justify-start">
              <Camera aria-hidden />
              El dia de {activeStay.pet.name}
            </LinkButton>
          )}
        </div>
      </section>
    </div>
  )
}
