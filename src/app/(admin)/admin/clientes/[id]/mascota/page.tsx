import { ArrowLeft, PawPrint } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

import { PetForm } from '@/components/pets/pet-form'
import { PageHeader } from '@/components/ui/page-header'
import { createPetForClient } from '@/server/actions/pets'
import { requireStaff } from '@/server/auth/session'
import { getClientDetail } from '@/server/queries/admin-users'

export const metadata: Metadata = { title: 'Registrar mascota' }

export default async function CounterNewPetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await requireStaff()
  const client = await getClientDetail(user.organizationId, id)
  if (!client) notFound()

  return (
    <div className="mx-auto max-w-6xl space-y-4 sm:space-y-5">
      <Link
        href={`/admin/clientes/${client.id}`}
        className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-ink-muted hover:text-navy-900"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {client.fullName}
      </Link>

      <PageHeader
        eyebrow="Mostrador"
        icon={PawPrint}
        title={`Mascota de ${client.fullName}`}
        description="Solo el nombre y el sexo son obligatorios. El cliente puede completar el resto desde la app."
      />

      {/* El cliente va atado en el servidor; la accion vuelve a comprobarlo. */}
      <PetForm action={createPetForClient.bind(null, client.id)} submitLabel="Registrar mascota" />
    </div>
  )
}
