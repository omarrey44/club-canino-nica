import { AlertTriangle, Dog, Search } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { PetAvatar } from '@/components/ui/pet-avatar'
import { StatusBadge } from '@/components/ui/status-badge'
import { formatAge, needsAttention } from '@/lib/pets'
import { petSexLabels } from '@/lib/constants/labels'
import { searchPets, type AdminPetFilter } from '@/server/queries/admin-pets'
import { requireStaff } from '@/server/auth/session'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Mascotas' }

const filters: Array<{ value: AdminPetFilter; label: string }> = [
  { value: 'all', label: 'Todas' },
  { value: 'in-club', label: 'En el club' },
  { value: 'archived', label: 'Archivadas' },
]

export default async function AdminPetsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filtro?: string }>
}) {
  const user = await requireStaff()
  const { q, filtro } = await searchParams

  const filter = filters.some((f) => f.value === filtro)
    ? (filtro as AdminPetFilter)
    : 'all'

  const pets = await searchPets(user.organizationId, { query: q?.trim() || undefined, filter })

  return (
    <div className="space-y-4 sm:space-y-5">
      <PageHeader
        eyebrow="Comunidad"
        icon={Dog}
        title="Mascotas"
        description={`${pets.length} ${pets.length === 1 ? 'mascota' : 'mascotas'} en el club.`}
      />

      {/* Formulario GET: la busqueda queda en la URL y se puede compartir. */}
      <form className="flex flex-col gap-3 sm:flex-row" role="search">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-subtle"
            aria-hidden
          />
          <input
            type="search"
            name="q"
            defaultValue={q ?? ''}
            placeholder="Nombre, raza o propietario"
            aria-label="Buscar mascotas"
            className="h-12 w-full rounded-field border border-line-strong bg-surface pr-3.5 pl-10 text-base text-ink placeholder:text-ink-subtle"
          />
        </div>
        <input type="hidden" name="filtro" value={filter} />
        <Button type="submit" variant="outline">
          Buscar
        </Button>
      </form>

      <nav aria-label="Filtros" className="flex flex-wrap gap-2">
        {filters.map((option) => {
          const active = option.value === filter
          const params = new URLSearchParams()
          if (q) params.set('q', q)
          if (option.value !== 'all') params.set('filtro', option.value)
          const search = params.toString()

          return (
            <Link
              key={option.value}
              href={search ? `/admin/mascotas?${search}` : '/admin/mascotas'}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex min-h-11 items-center rounded-pill px-4 text-sm font-medium whitespace-nowrap transition-colors',
                active
                  ? 'bg-navy-800 text-white'
                  : 'border border-line-strong bg-surface text-ink-muted hover:text-ink'
              )}
            >
              {option.label}
            </Link>
          )
        })}
      </nav>

      {pets.length === 0 ? (
        <EmptyState
          icon={Dog}
          title={q ? `Sin resultados para "${q}"` : 'No hay mascotas en esta vista'}
          description={
            q
              ? 'Prueba con el nombre del propietario o con la raza.'
              : 'Las mascotas aparecen aquí cuando sus propietarios las registran.'
          }
        />
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
          {pets.map((pet) => {
            const stay = pet.stays[0]
            const alerts = pet.vaccinations.filter((v) => needsAttention(v.expiresAt)).length

            return (
              <li key={pet.id} className="flex items-center gap-3 p-4">
                <PetAvatar name={pet.name} photoUrl={pet.photoUrl} />

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-ink">{pet.name}</p>
                    {stay && (
                      <StatusBadge tone="success">
                        {stay.currentLocation ?? 'En estancia'}
                      </StatusBadge>
                    )}
                    {alerts > 0 && (
                      <span
                        className="inline-flex items-center gap-1 text-xs text-warning"
                        title="Vacunas por revisar"
                      >
                        <AlertTriangle className="size-3.5" aria-hidden />
                        {alerts}
                      </span>
                    )}
                  </div>
                  <p className="truncate text-sm text-ink-muted">
                    {[pet.breed, petSexLabels[pet.sex], formatAge(pet.birthDate)]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>

                <div className="hidden shrink-0 text-right text-sm sm:block">
                  <p className="font-medium text-ink">{pet.owner.fullName}</p>
                  {pet.owner.phone && <p className="text-ink-muted">{pet.owner.phone}</p>}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
