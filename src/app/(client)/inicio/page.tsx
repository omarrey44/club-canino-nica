import { CalendarPlus, Camera, ChevronRight, PawPrint, Plus, Sparkles } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'

import { ActivePetCard } from '@/components/stays/active-pet-card'
import { ActivityTimeline } from '@/components/stays/activity-timeline'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { LinkButton } from '@/components/ui/button'
import { ReservationCard } from '@/components/reservations/reservation-card'
import { formatDate, firstName, greeting } from '@/lib/datetime'
import { getClientHome } from '@/server/queries/client-home'
import { requireUser } from '@/server/auth/session'

export const metadata: Metadata = { title: 'Inicio' }

export default async function ClientHomePage() {
  const user = await requireUser()
  const { activeStay, nextReservation, petCount } = await getClientHome(user)

  const lastPhoto = activeStay?.photos[0]

  return (
    <div className="space-y-8">
      <header className="relative overflow-hidden rounded-card border border-brand-100 bg-canvas-warm p-5 sm:p-7">
        <Sparkles className="pointer-events-none absolute -right-4 -bottom-5 size-32 rotate-12 text-brand-100" aria-hidden />
        <div className="relative max-w-2xl space-y-2">
          <p className="text-xs font-extrabold tracking-[0.15em] text-brand-600 uppercase">Tu espacio en el club</p>
          <h1 className="text-2xl leading-tight text-navy-900 sm:text-4xl">
            {greeting()}, {firstName(user.fullName)}
          </h1>
          <p className="max-w-xl leading-relaxed text-ink-muted">
            {activeStay
              ? `Así está ${activeStay.pet.name} hoy. Todo lo importante, en un solo lugar.`
              : petCount > 0
                ? 'Hoy no tienes ninguna mascota en el club, pero puedes revisar tus próximas reservas.'
                : 'Empecemos por registrar a tu mascota para preparar su primera visita.'}
          </p>
        </div>
      </header>

      {activeStay ? (
        <ActivePetCard stay={activeStay} />
      ) : petCount === 0 ? (
        <EmptyState
          icon={PawPrint}
          title="Todavía no tienes mascotas registradas"
          description="Con su ficha completa el equipo del club sabe cómo cuidarla: alimentación, alergias y contactos de emergencia."
          action={
            <LinkButton size="sm" href="/mascotas/nueva">
              <Plus aria-hidden />
              Registrar mascota
            </LinkButton>
          }
        />
      ) : null}

      {nextReservation && (
        <section className="space-y-3.5" aria-labelledby="proxima-reservacion">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-[0.7rem] bg-info-soft text-info">
              <CalendarPlus className="size-4.5" aria-hidden />
            </span>
            <h2 id="proxima-reservacion" className="text-xl text-navy-900">
              Próxima reservación
            </h2>
          </div>
          <ReservationCard reservation={nextReservation} />
        </section>
      )}

      {activeStay && activeStay.activities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Últimas actualizaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityTimeline activities={activeStay.activities} />
          </CardContent>
        </Card>
      )}

      {lastPhoto && (
        <Card>
          <CardHeader>
            <CardTitle>Última foto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="relative aspect-[4/3] overflow-hidden rounded-field bg-navy-50">
              <Image
                src={lastPhoto.url}
                alt={lastPhoto.caption ?? `Foto de ${activeStay.pet.name}`}
                fill
                sizes="(max-width: 768px) 100vw, 640px"
                className="object-cover"
              />
            </div>
            {lastPhoto.caption && <p className="text-sm text-ink-muted">{lastPhoto.caption}</p>}
            <p className="text-2xs text-ink-subtle">{formatDate(lastPhoto.takenAt)}</p>
          </CardContent>
        </Card>
      )}

      <section className="space-y-3.5" aria-labelledby="acciones-rapidas">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-[0.7rem] bg-brand-50 text-brand-600">
            <Sparkles className="size-4.5" aria-hidden />
          </span>
          <div>
            <h2 id="acciones-rapidas" className="text-xl text-navy-900">Explora tu club</h2>
            <p className="text-sm text-ink-muted">Accesos rápidos a lo que más usas.</p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/reservas"
            className="group flex min-h-32 flex-col rounded-card border border-line bg-surface p-4 shadow-card transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-raised"
          >
            <span className="flex size-10 items-center justify-center rounded-[0.75rem] bg-info-soft text-info">
              <CalendarPlus className="size-5" aria-hidden />
            </span>
            <span className="mt-4 flex items-center justify-between gap-3 font-extrabold text-navy-900">
              Reservaciones
              <ChevronRight className="size-4 text-ink-subtle transition-transform group-hover:translate-x-0.5" aria-hidden />
            </span>
            <span className="mt-1 text-sm leading-snug text-ink-muted">Fechas, horarios y estados.</span>
          </Link>

          <Link
            href="/mascotas"
            className="group flex min-h-32 flex-col rounded-card border border-line bg-surface p-4 shadow-card transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-raised"
          >
            <span className="flex size-10 items-center justify-center rounded-[0.75rem] bg-brand-50 text-brand-600">
              <PawPrint className="size-5" aria-hidden />
            </span>
            <span className="mt-4 flex items-center justify-between gap-3 font-extrabold text-navy-900">
              {petCount > 0 ? 'Mis mascotas' : 'Registrar mascota'}
              <ChevronRight className="size-4 text-ink-subtle transition-transform group-hover:translate-x-0.5" aria-hidden />
            </span>
            <span className="mt-1 text-sm leading-snug text-ink-muted">Perfil, salud y cuidados.</span>
          </Link>

          {activeStay && (
            <Link
              href="/mi-mascota"
              className="group flex min-h-32 flex-col rounded-card border border-line bg-surface p-4 shadow-card transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-raised sm:col-span-2 lg:col-span-1"
            >
              <span className="flex size-10 items-center justify-center rounded-[0.75rem] bg-success-soft text-success">
                <Camera className="size-5" aria-hidden />
              </span>
              <span className="mt-4 flex items-center justify-between gap-3 font-extrabold text-navy-900">
                El día de {activeStay.pet.name}
                <ChevronRight className="size-4 text-ink-subtle transition-transform group-hover:translate-x-0.5" aria-hidden />
              </span>
              <span className="mt-1 text-sm leading-snug text-ink-muted">Actividad y nuevas fotos.</span>
            </Link>
          )}
        </div>
      </section>
    </div>
  )
}
