import { AlertTriangle, ChevronRight } from 'lucide-react'
import Link from 'next/link'

import { PetAvatar } from '@/components/ui/pet-avatar'
import { StatusBadge } from '@/components/ui/status-badge'
import { petSexLabels } from '@/lib/constants/labels'
import { formatAge } from '@/lib/pets'
import type { PetListItem } from '@/server/queries/pets'

/** Fila del listado "Mis mascotas". Toda la card es el area tactil. */
export function PetCard({ pet }: { pet: PetListItem }) {
  const age = formatAge(pet.birthDate)
  const details = [pet.breed, petSexLabels[pet.sex], age].filter(Boolean).join(' · ')

  return (
    <Link
      href={`/mascotas/${pet.id}`}
      className="flex items-center gap-4 rounded-card border border-line bg-surface p-4 shadow-card transition-colors hover:border-line-strong"
    >
      <PetAvatar name={pet.name} photoUrl={pet.photoUrl} size="lg" />

      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold text-ink">{pet.name}</p>
          {pet.currentStay && <StatusBadge tone="success">En el club</StatusBadge>}
        </div>

        {details && <p className="truncate text-sm text-ink-muted">{details}</p>}

        {pet.alerts > 0 && (
          <p className="flex items-center gap-1.5 text-sm text-warning">
            <AlertTriangle className="size-3.5 shrink-0" aria-hidden />
            {pet.alerts === 1 ? '1 vacuna por revisar' : `${pet.alerts} vacunas por revisar`}
          </p>
        )}
      </div>

      <ChevronRight className="size-5 shrink-0 text-ink-subtle" aria-hidden />
    </Link>
  )
}
