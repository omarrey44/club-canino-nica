import { PawPrint, Plus } from 'lucide-react'
import { Suspense } from 'react'
import type { Metadata } from 'next'

import { EmptyState } from '@/components/ui/empty-state'
import { LinkButton } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/page-header'
import { PetCard } from '@/components/pets/pet-card'
import { SkeletonCard } from '@/components/ui/skeleton'
import { getMyPets } from '@/server/queries/pets'
import { requireUser } from '@/server/auth/session'

export const metadata: Metadata = { title: 'Mis mascotas' }

/**
 * El esqueleto va aqui dentro y no en un `loading.tsx` del segmento.
 *
 * Un `loading.tsx` en /mascotas tambien envuelve a /mascotas/[id], y al
 * enviar el shell de inmediato la respuesta sale con 200: cuando la ficha
 * llama a `notFound()` los encabezados ya viajaron y el 404 se pierde.
 */
async function PetList() {
  const user = await requireUser()
  const pets = await getMyPets(user)

  if (pets.length === 0) {
    return (
      <EmptyState
        icon={PawPrint}
        title="Aun no registras ninguna mascota"
        description="Con su ficha completa el equipo del club sabe como cuidarla: alimentacion, alergias y contactos de emergencia."
        action={
          <LinkButton size="sm" href="/mascotas/nueva">
            <Plus aria-hidden />
            Registrar mascota
          </LinkButton>
        }
      />
    )
  }

  return (
    <ul className="space-y-3">
      {pets.map((pet) => (
        <li key={pet.id}>
          <PetCard pet={pet} />
        </li>
      ))}
    </ul>
  )
}

export default function MyPetsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Mis mascotas"
        description="Su informacion, salud y vacunas."
        action={
          <LinkButton size="sm" href="/mascotas/nueva">
            <Plus aria-hidden />
            Agregar
          </LinkButton>
        }
      />

      <Suspense
        fallback={
          <div className="space-y-3">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        }
      >
        <PetList />
      </Suspense>
    </div>
  )
}
