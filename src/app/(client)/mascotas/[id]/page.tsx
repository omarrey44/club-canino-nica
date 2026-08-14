import { ArrowLeft, History, Pencil } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LinkButton } from '@/components/ui/button'
import { PhotoUploader } from '@/components/pets/photo-uploader'
import { StatusBadge } from '@/components/ui/status-badge'
import { VaccinationSection } from '@/components/pets/vaccination-section'
import { formatAge } from '@/lib/pets'
import { getPetDetail } from '@/server/queries/pets'
import { formatDate } from '@/lib/datetime'
import { petSexLabels, petSizeLabels } from '@/lib/constants/labels'
import { addVaccination } from '@/server/actions/vaccinations'
import { uploadPetPhoto } from '@/server/actions/pets'
import { requireUser } from '@/server/auth/session'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const user = await requireUser()
  const pet = await getPetDetail(id, user)
  return { title: pet?.name ?? 'Mascota' }
}

/** Fila de dato. Omite el campo si no hay valor, en vez de mostrar un guion. */
function Row({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <div className="flex justify-between gap-4 py-2.5">
      <dt className="shrink-0 text-ink-muted">{label}</dt>
      <dd className="text-right font-medium text-ink">{value}</dd>
    </div>
  )
}

export default async function PetDetailPage({ params }: Props) {
  const { id } = await params
  const user = await requireUser()
  const pet = await getPetDetail(id, user)

  if (!pet) notFound()

  const stay = pet.stays[0]
  const medical = pet.medicalInfo
  const hasCareInfo =
    medical &&
    (medical.allergies ||
      medical.medications ||
      medical.medicalConditions ||
      medical.dietNotes ||
      medical.feedingSchedule ||
      medical.isSterilized)

  return (
    <div className="space-y-6">
      <Link
        href="/mascotas"
        className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Mis mascotas
      </Link>

      <header className="flex flex-wrap items-center gap-4">
        <PhotoUploader
          action={uploadPetPhoto.bind(null, pet.id)}
          petName={pet.name}
          photoUrl={pet.photoUrl}
        />

        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold text-navy-800">{pet.name}</h1>
            {stay && (
              <StatusBadge tone="success">
                {stay.currentLocation ? `En ${stay.currentLocation}` : 'En el club'}
              </StatusBadge>
            )}
          </div>
          {pet.breed && <p className="text-ink-muted">{pet.breed}</p>}
        </div>

        <div className="flex gap-2">
          <LinkButton size="sm" variant="outline" href={`/mascotas/${pet.id}/historial`}>
            <History aria-hidden />
            Historial
          </LinkButton>
          <LinkButton size="sm" variant="outline" href={`/mascotas/${pet.id}/editar`}>
            <Pencil aria-hidden />
            Editar
          </LinkButton>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Datos</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="divide-y divide-line text-sm">
            <Row label="Sexo" value={petSexLabels[pet.sex]} />
            <Row label="Tamaño" value={petSizeLabels[pet.size]} />
            <Row label="Edad" value={formatAge(pet.birthDate)} />
            <Row
              label="Fecha de nacimiento"
              value={pet.birthDate ? formatDate(pet.birthDate) : null}
            />
            <Row label="Peso" value={pet.weightKg ? `${pet.weightKg} kg` : null} />
            <Row label="Color y señas" value={pet.colorMarks} />
            <Row label="Carácter" value={pet.temperament} />
          </dl>
        </CardContent>
      </Card>

      <VaccinationSection
        vaccinations={pet.vaccinations}
        addAction={addVaccination.bind(null, pet.id)}
        canEdit
      />

      {hasCareInfo && (
        <Card>
          <CardHeader>
            <CardTitle>Cuidado</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="divide-y divide-line text-sm">
              <Row label="Alergias" value={medical.allergies} />
              <Row label="Medicamentos" value={medical.medications} />
              <Row label="Condiciones" value={medical.medicalConditions} />
              <Row label="Alimentación" value={medical.dietNotes} />
              <Row label="Horario de comida" value={medical.feedingSchedule} />
              <Row label="Esterilizado" value={medical.isSterilized ? 'Si' : null} />
            </dl>
          </CardContent>
        </Card>
      )}

      {medical && (medical.vetName || medical.vetPhone || medical.vetClinic) && (
        <Card>
          <CardHeader>
            <CardTitle>Veterinario</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="divide-y divide-line text-sm">
              <Row label="Nombre" value={medical.vetName} />
              <Row label="Teléfono" value={medical.vetPhone} />
              <Row label="Clínica" value={medical.vetClinic} />
            </dl>
          </CardContent>
        </Card>
      )}

      {pet.emergencyContacts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Contactos de emergencia</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-line text-sm">
              {pet.emergencyContacts.map((contact) => (
                <li key={contact.id} className="flex justify-between gap-4 py-2.5">
                  <div>
                    <p className="font-medium text-ink">{contact.name}</p>
                    {contact.relationship && (
                      <p className="text-ink-muted">{contact.relationship}</p>
                    )}
                  </div>
                  <a
                    href={`tel:${contact.phone}`}
                    className="inline-flex min-h-11 items-center font-medium text-brand-700 hover:underline"
                  >
                    {contact.phone}
                  </a>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {medical?.specialNotes && (
        <Card>
          <CardHeader>
            <CardTitle>Observaciones especiales</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-ink-muted">{medical.specialNotes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
