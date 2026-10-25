import { ArrowLeft, CalendarPlus, PawPrint } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

import { BookingStepper } from '@/components/reservations/booking-stepper'
import { EmptyState } from '@/components/ui/empty-state'
import { LinkButton } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/page-header'
import { getBookingOptions } from '@/server/queries/services'
import { getMyPets } from '@/server/queries/pets'
import { requireUser } from '@/server/auth/session'

export const metadata: Metadata = { title: 'Reservar estancia' }

export default async function NewReservationPage() {
  const user = await requireUser()
  const [pets, booking] = await Promise.all([
    getMyPets(user),
    getBookingOptions(user.organizationId),
  ])

  return (
    <div className="mx-auto max-w-4xl space-y-4 sm:space-y-5">
      <Link
        href="/reservas"
        className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Mis reservaciones
      </Link>

      <PageHeader
        eyebrow="Nueva reserva"
        icon={CalendarPlus}
        title="Aparta el lugar de tu mascota"
        description="Son cinco pasos y puedes volver atrás en cualquier momento."
      />

      {pets.length === 0 ? (
        <EmptyState
          icon={PawPrint}
          title="Primero registra a tu mascota"
          description="Necesitamos su ficha para saber como cuidarla durante la estancia."
          action={
            <LinkButton size="sm" href="/mascotas/nueva">
              Registrar mascota
            </LinkButton>
          }
        />
      ) : booking.services.length === 0 ? (
        <EmptyState
          icon={PawPrint}
          title="No hay servicios disponibles"
          description="El club aún no publica su catálogo. Escríbenos y te ayudamos a reservar."
        />
      ) : (
        <BookingStepper
          pets={pets.map((pet) => ({
            id: pet.id,
            name: pet.name,
            breed: pet.breed,
            photoUrl: pet.photoUrl,
          }))}
          services={booking.services}
          addons={booking.addons}
          defaults={booking.defaults}
        />
      )}
    </div>
  )
}
