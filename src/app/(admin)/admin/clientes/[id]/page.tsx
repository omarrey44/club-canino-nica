import { ArrowLeft, CalendarDays, CalendarPlus, Mail, PawPrint, Phone, Plus, UserRound } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

import { LinkButton } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { PetAvatar } from '@/components/ui/pet-avatar'
import { StatusBadge } from '@/components/ui/status-badge'
import { ActiveToggle } from '@/components/users/user-controls'
import { formatCurrency } from '@/config/business'
import {
  paymentStatusLabels,
  paymentStatusTones,
  reservationStatusLabels,
  reservationStatusTones,
} from '@/lib/constants/labels'
import { formatDate } from '@/lib/datetime'
import { requireStaff } from '@/server/auth/session'
import { getClientDetail } from '@/server/queries/admin-users'

export const metadata: Metadata = { title: 'Cliente' }

export default async function AdminClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await requireStaff()
  const client = await getClientDetail(user.organizationId, id)
  if (!client) notFound()

  const canManage = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN'

  return (
    <div className="space-y-4 sm:space-y-5">
      <Link
        href="/admin/clientes"
        className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-ink-muted hover:text-navy-900"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Clientes
      </Link>

      <PageHeader
        eyebrow="Cliente"
        icon={UserRound}
        title={client.fullName}
        description={`Cliente desde ${formatDate(client.createdAt)}.`}
        action={
          client.isActive ? (
            <div className="flex flex-wrap gap-2">
              <LinkButton href={`/admin/clientes/${client.id}/reservar`} size="sm">
                <CalendarPlus aria-hidden />
                Nueva reserva
              </LinkButton>
              <LinkButton href={`/admin/clientes/${client.id}/mascota`} size="sm" variant="outline">
                <Plus aria-hidden />
                Agregar mascota
              </LinkButton>
            </div>
          ) : (
            <StatusBadge tone="danger">Desactivado</StatusBadge>
          )
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-start">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contacto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              {client.phone && (
                <a
                  href={`tel:${client.phone.replace(/\s+/g, '')}`}
                  className="flex min-h-11 items-center gap-2 font-semibold text-brand-700 hover:underline"
                >
                  <Phone className="size-4" aria-hidden />
                  {client.phone}
                </a>
              )}
              <a
                href={`mailto:${client.email}`}
                className="flex min-h-11 items-center gap-2 font-semibold text-brand-700 hover:underline"
              >
                <Mail className="size-4" aria-hidden />
                {client.email}
              </a>
              {canManage && (
                <div className="border-t border-line pt-3">
                  <ActiveToggle userId={client.id} active={client.isActive} name={client.fullName} />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mascotas</CardTitle>
            </CardHeader>
            <CardContent>
              {client.pets.length === 0 ? (
                <p className="text-sm text-ink-muted">Todavía no registra mascotas.</p>
              ) : (
                <ul className="space-y-3">
                  {client.pets.map((pet) => (
                    <li key={pet.id} className="flex items-center gap-3">
                      <PetAvatar name={pet.name} photoUrl={pet.photoUrl} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-navy-900">{pet.name}</p>
                        {pet.breed && <p className="truncate text-xs text-ink-muted">{pet.breed}</p>}
                      </div>
                      {!pet.isActive && <StatusBadge tone="neutral">Archivada</StatusBadge>}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Reservas</CardTitle>
          </CardHeader>
          <CardContent>
            {client.reservations.length === 0 ? (
              <EmptyState
                icon={CalendarDays}
                title="Sin reservas"
                description="Cuando reserve, aquí verás cada visita con su estado y su pago."
              />
            ) : (
              <ul className="divide-y divide-line">
                {client.reservations.map((reservation) => (
                  <li key={reservation.id} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-navy-900">
                        {reservation.service.name}
                        <span className="font-normal text-ink-muted"> · {reservation.code}</span>
                      </p>
                      <p className="flex items-center gap-1.5 text-sm text-ink-muted">
                        <PawPrint className="size-3.5" aria-hidden />
                        {reservation.pet.name} · {formatDate(reservation.startAt)}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge tone={reservationStatusTones[reservation.status]}>
                        {reservationStatusLabels[reservation.status]}
                      </StatusBadge>
                      {reservation.payment && (
                        <StatusBadge tone={paymentStatusTones[reservation.payment.status]}>
                          Pago {paymentStatusLabels[reservation.payment.status].toLowerCase()}
                        </StatusBadge>
                      )}
                      <span className="text-sm font-bold text-navy-900 tabular-nums">
                        {formatCurrency(String(reservation.total))}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
