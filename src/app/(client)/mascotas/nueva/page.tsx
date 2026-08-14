import { ArrowLeft, PawPrint } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

import { PageHeader } from '@/components/ui/page-header'
import { PetForm } from '@/components/pets/pet-form'
import { createPet } from '@/server/actions/pets'
import { requireUser } from '@/server/auth/session'

export const metadata: Metadata = { title: 'Registrar mascota' }

export default async function NewPetPage() {
  await requireUser()

  return (
    <div className="mx-auto max-w-6xl space-y-4 sm:space-y-5">
      <Link
        href="/mascotas"
        className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Mis mascotas
      </Link>

      <PageHeader
        eyebrow="Nueva ficha"
        icon={PawPrint}
        title="Registrar mascota"
        description="Solo el nombre y el sexo son obligatorios. Lo demás lo puedes completar después."
      />

      <PetForm action={createPet} submitLabel="Registrar mascota" />
    </div>
  )
}
