import { ArrowLeft, CalendarPlus, PawPrint, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

import { BookingStepper } from '@/components/reservations/booking-stepper'
import { LinkButton } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { requireStaff } from '@/server/auth/session'
import { getClientDetail } from '@/server/queries/admin-users'
import { getBookingOptions } from '@/server/queries/services'

export const metadata: Metadata = { title: 'Nueva reserva' }

export default async function CounterReservationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await requireStaff()
  const [client, booking] = await Promise.all([
    getClientDetail(user.organizationId, id),
    getBookingOptions(user.organizationId),
  ])
  if (!client) notFound()

  const pets = client.pets.filter((pet) => pet.isActive)

  return (
    <div className="mx-auto max-w-4xl space-y-4 sm:space-y-5">
      <Link
        href={`/admin/clientes/${client.id}`}
        className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-ink-muted hover:text-navy-900"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {client.fullName}
      </Link>

      <PageHeader
        eyebrow="Mostrador"
        icon={CalendarPlus}
        title={`Reserva para ${client.fullName}`}
        description="Queda confirmada al terminar, y el cliente la ve en su app con un aviso."
      />

      {pets.length === 0 ? (
        <EmptyState
          icon={PawPrint}
          title="Primero registra su mascota"
          description="La reserva necesita la ficha de la mascota."
          action={
            <LinkButton size="sm" href={`/admin/clientes/${client.id}/mascota`}>
              Registrar mascota
            </LinkButton>
          }
        />
      ) : booking.services.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="No hay servicios activos"
          description="Crea al menos uno en Servicios para poder reservar."
          action={
            user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' ? (
              <LinkButton size="sm" href="/admin/servicios">
                Ir a Servicios
              </LinkButton>
            ) : undefined
          }
        />
      ) : (
        <BookingStepper
          clientId={client.id}
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
