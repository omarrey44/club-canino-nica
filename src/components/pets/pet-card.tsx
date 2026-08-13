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
      className="group flex items-center gap-4 rounded-card border border-line bg-surface p-4 shadow-card transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-raised sm:p-5"
    >
      <PetAvatar name={pet.name} photoUrl={pet.photoUrl} size="lg" />

      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-extrabold text-navy-900">{pet.name}</p>
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

      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-canvas text-ink-subtle transition-colors group-hover:bg-brand-50 group-hover:text-brand-600">
        <ChevronRight className="size-5" aria-hidden />
      </span>
    </Link>
  )
}
