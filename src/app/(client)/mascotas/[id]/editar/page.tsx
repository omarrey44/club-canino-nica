import { ArrowLeft, Pencil } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

import { PageHeader } from '@/components/ui/page-header'
import { PetForm } from '@/components/pets/pet-form'
import { getPetDetail } from '@/server/queries/pets'
import { updatePet } from '@/server/actions/pets'
import { requireUser } from '@/server/auth/session'

export const metadata: Metadata = { title: 'Editar mascota' }

/** `<input type="date">` solo acepta YYYY-MM-DD. */
function toDateInput(date: Date | null): string {
  return date ? date.toISOString().slice(0, 10) : ''
}

export default async function EditPetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await requireUser()
  const pet = await getPetDetail(id, user)

  if (!pet) notFound()

  const medical = pet.medicalInfo

  return (
    <div className="mx-auto max-w-6xl space-y-4 sm:space-y-5">
      <Link
        href={`/mascotas/${pet.id}`}
        className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {pet.name}
      </Link>

      <PageHeader eyebrow="Ficha de mascota" icon={Pencil} title={`Editar a ${pet.name}`} />

      <PetForm
        action={updatePet.bind(null, pet.id)}
        submitLabel="Guardar cambios"
        defaults={{
          name: pet.name,
          breed: pet.breed,
          sex: pet.sex,
          size: pet.size,
          birthDate: toDateInput(pet.birthDate),
          weightKg: pet.weightKg ? String(pet.weightKg) : '',
          colorMarks: pet.colorMarks,
          temperament: pet.temperament,
          allergies: medical?.allergies,
          medications: medical?.medications,
          medicalConditions: medical?.medicalConditions,
          dietNotes: medical?.dietNotes,
          feedingSchedule: medical?.feedingSchedule,
          isSterilized: medical?.isSterilized,
          vetName: medical?.vetName,
          vetPhone: medical?.vetPhone,
          vetClinic: medical?.vetClinic,
          specialNotes: medical?.specialNotes,
        }}
      />
    </div>
  )
}
