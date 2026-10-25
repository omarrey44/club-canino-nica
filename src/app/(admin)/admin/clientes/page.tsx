import { ChevronRight, Search, Users } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { PetAvatar } from '@/components/ui/pet-avatar'
import { formatDate } from '@/lib/datetime'
import { cn } from '@/lib/utils'
import { requireStaff } from '@/server/auth/session'
import { searchClients, type ClientFilter } from '@/server/queries/admin-users'

export const metadata: Metadata = { title: 'Clientes' }

const filters: Array<{ value: ClientFilter; label: string }> = [
  { value: 'active', label: 'Activos' },
  { value: 'inactive', label: 'Desactivados' },
]

export default async function AdminClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filtro?: string }>
}) {
  const user = await requireStaff()
  const { q, filtro } = await searchParams
  const filter: ClientFilter = filtro === 'inactive' ? 'inactive' : 'active'

  const clients = await searchClients(user.organizationId, { query: q?.trim() || undefined, filter })

  return (
    <div className="space-y-4 sm:space-y-5">
      <PageHeader
        eyebrow="Comunidad"
        icon={Users}
        title="Clientes"
        description={`${clients.length} ${clients.length === 1 ? 'cliente' : 'clientes'} en esta vista.`}
      />

      {/* Formulario GET, igual que en Mascotas: la busqueda queda en la URL. */}
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
            placeholder="Nombre, correo, teléfono o mascota"
            aria-label="Buscar clientes"
            className="h-12 w-full rounded-field border border-line-strong bg-surface pr-3.5 pl-10 text-base text-ink placeholder:text-ink-subtle"
          />
        </div>
        {filter !== 'active' && <input type="hidden" name="filtro" value={filter} />}
        <Button type="submit" variant="outline">
          Buscar
        </Button>
      </form>

      <nav aria-label="Filtros" className="flex flex-wrap gap-2">
        {filters.map((option) => {
          const active = option.value === filter
          const params = new URLSearchParams()
          if (q) params.set('q', q)
          if (option.value !== 'active') params.set('filtro', option.value)
          const search = params.toString()

          return (
            <Link
              key={option.value}
              href={search ? `/admin/clientes?${search}` : '/admin/clientes'}
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

      {clients.length === 0 ? (
        <EmptyState
          icon={Users}
          title={q ? `Sin resultados para "${q}"` : 'Todavía no hay clientes'}
          description={
            q
              ? 'Prueba con el teléfono o con el nombre de su mascota.'
              : 'Aparecen aquí cuando alguien crea su cuenta desde el registro.'
          }
        />
      ) : (
        <ul className="stagger-enter divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
          {clients.map((client) => {
            const last = client.reservations[0]
            return (
              <li key={client.id}>
                <Link
                  href={`/admin/clientes/${client.id}`}
                  className="flex items-center gap-3 p-4 transition-colors hover:bg-canvas"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-navy-900">{client.fullName}</p>
                    <p className="truncate text-sm text-ink-muted">
                      {[client.phone, client.email].filter(Boolean).join(' · ')}
                    </p>
                    <p className="mt-0.5 text-xs text-ink-muted">
                      {client._count.reservations}{' '}
                      {client._count.reservations === 1 ? 'reserva' : 'reservas'}
                      {last ? ` · última ${formatDate(last.startAt)}` : ''}
                    </p>
                  </div>

                  {client.pets.length > 0 && (
                    <div className="hidden shrink-0 items-center -space-x-2 sm:flex">
                      {client.pets.slice(0, 4).map((pet) => (
                        <PetAvatar key={pet.id} name={pet.name} photoUrl={pet.photoUrl} size="sm" />
                      ))}
                    </div>
                  )}

                  <ChevronRight className="size-5 shrink-0 text-ink-subtle" aria-hidden />
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
