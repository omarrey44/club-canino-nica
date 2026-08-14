import { LogIn } from 'lucide-react'
import type { Metadata } from 'next'

import { CheckInCard } from '@/components/stays/check-in-card'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { formatTime } from '@/lib/datetime'
import { getCheckInCandidates } from '@/server/queries/stays'
import { requireStaff } from '@/server/auth/session'

export const metadata: Metadata = { title: 'Check-in' }

export default async function CheckInPage() {
  const user = await requireStaff()
  const candidates = await getCheckInCandidates(user.organizationId)

  return (
    <div className="space-y-4 sm:space-y-5">
      <PageHeader
        eyebrow="Recepción"
        icon={LogIn}
        title="Entradas de hoy"
        description="Reservaciones confirmadas que todavía no ingresan."
      />

      {candidates.length === 0 ? (
        <EmptyState
          icon={LogIn}
          title="No hay entradas pendientes"
          description="Todas las reservaciones confirmadas de hoy ya ingresaron."
        />
      ) : (
        <ul className="space-y-3">
          {candidates.map((reservation) => {
            const medical = reservation.pet.medicalInfo
            const alerts = [
              medical?.allergies && `Alergias: ${medical.allergies}`,
              medical?.medications && `Medicamentos: ${medical.medications}`,
              medical?.specialNotes,
            ].filter((value): value is string => Boolean(value))

            return (
              <li key={reservation.id}>
                <CheckInCard
                  data={{
                    reservationId: reservation.id,
                    code: reservation.code,
                    scheduled: formatTime(reservation.startAt),
                    serviceName: reservation.service.name,
                    clientName: reservation.client.fullName,
                    clientPhone: reservation.client.phone,
                    pet: {
                      name: reservation.pet.name,
                      breed: reservation.pet.breed,
                      photoUrl: reservation.pet.photoUrl,
                    },
                    alerts,
                  }}
                />
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
