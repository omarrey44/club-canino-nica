import {
  Activity,
  Bell,
  CalendarPlus,
  Camera,
  ChevronRight,
  House,
  PawPrint,
  Plus,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'

import { ActivePetCard } from '@/components/stays/active-pet-card'
import { ActivityTimeline } from '@/components/stays/activity-timeline'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { LinkButton } from '@/components/ui/button'
import { ReservationCard } from '@/components/reservations/reservation-card'
import { formatDate, firstName, greeting } from '@/lib/datetime'
import { getClientHome } from '@/server/queries/client-home'
import { requireUser } from '@/server/auth/session'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Inicio' }

export default async function ClientHomePage() {
  const user = await requireUser()
  const { activeStay, nextReservation, petCount } = await getClientHome(user)

  const lastPhoto = activeStay?.photos[0]
  const hasRecentActivity = Boolean(activeStay?.activities.length)

  return (
    <div className="space-y-4 sm:space-y-5">
      <header className="relative flex min-h-28 items-center overflow-hidden rounded-card border border-brand-100 bg-canvas-warm p-4 shadow-card sm:p-5 lg:px-7">
        <div className="relative z-10 max-w-2xl space-y-1.5 lg:max-w-[64%]">
          <p className="text-xs font-extrabold tracking-[0.15em] text-brand-700 uppercase">
            Tu espacio en el club
          </p>
          <h1 className="text-2xl leading-tight text-navy-900 sm:text-[2rem]">
            {greeting()}, {firstName(user.fullName)}
          </h1>
          <p className="max-w-xl text-sm leading-snug text-ink-muted sm:text-base">
            {activeStay
              ? `Así está ${activeStay.pet.name} hoy. Todo lo importante, en un solo lugar.`
              : petCount > 0
                ? 'Hoy no tienes ninguna mascota en el club, pero puedes revisar tus próximas reservas.'
                : 'Empecemos por registrar a tu mascota para preparar su primera visita.'}
          </p>
        </div>

        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[38%] overflow-hidden lg:block" aria-hidden>
          <PawPrint className="absolute top-4 left-5 size-14 -rotate-12 text-brand-200/70" />
          <PawPrint className="absolute top-2 right-32 size-9 rotate-12 text-brand-200/60" />
          <span className="absolute -right-12 -bottom-24 size-64 rounded-full bg-brand-100/80" />
          <span className="absolute right-32 -bottom-20 size-44 rounded-full bg-success-soft" />
          <div className="absolute right-10 bottom-3 flex size-28 items-center justify-center rounded-[2rem] border border-brand-200 bg-surface shadow-raised">
            <House className="size-16 text-brand-700" strokeWidth={1.7} />
            <PawPrint className="absolute size-5 text-navy-800" />
          </div>
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

      <div
        className={cn(
          'grid gap-4',
          hasRecentActivity &&
            'xl:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.9fr)] xl:items-stretch'
        )}
      >
        {nextReservation && (
          <Card
            className={cn(
              'overflow-hidden',
              hasRecentActivity && 'xl:col-start-1 xl:row-start-1'
            )}
          >
            <CardHeader className="flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="flex size-9 items-center justify-center rounded-[0.7rem] bg-info-soft text-info">
                  <CalendarPlus className="size-4.5" aria-hidden />
                </span>
                <h2 className="text-lg text-navy-900">Próxima reservación</h2>
              </div>
              <Link
                href="/reservas"
                aria-label="Ver todas las reservaciones"
                className="flex size-11 cursor-pointer items-center justify-center rounded-full text-navy-600 transition-colors hover:bg-navy-50 hover:text-brand-700"
              >
                <ChevronRight className="size-5" aria-hidden />
              </Link>
            </CardHeader>
            <CardContent>
              <ReservationCard reservation={nextReservation} embedded />
            </CardContent>
          </Card>
        )}

        {activeStay && activeStay.activities.length > 0 && (
          <Card className="xl:col-start-2 xl:row-start-1 xl:row-span-2 xl:h-full">
            <CardHeader className="flex-row items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-[0.7rem] bg-brand-50 text-brand-700">
                <Activity className="size-4.5" aria-hidden />
              </span>
              <h2 className="text-lg text-navy-900">Actividad reciente</h2>
            </CardHeader>
            <CardContent>
              <ActivityTimeline activities={activeStay.activities.slice(0, 3)} compact />
              <Link
                href="/mi-mascota"
                className="mt-3 inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-field font-bold text-brand-700 transition-colors hover:text-brand-800"
              >
                Ver toda la actividad
                <ChevronRight className="size-4" aria-hidden />
              </Link>
            </CardContent>
          </Card>
        )}

        <div
          className={cn(
            'grid gap-4',
            lastPhoto && 'xl:grid-cols-2',
            hasRecentActivity && 'xl:col-start-1'
          )}
        >
          {lastPhoto && activeStay && (
            <Card className="h-full overflow-hidden">
              <CardHeader className="flex-row items-center gap-2.5">
                <span className="flex size-9 items-center justify-center rounded-[0.7rem] bg-brand-50 text-brand-700">
                  <Camera className="size-4.5" aria-hidden />
                </span>
                <h2 className="text-lg text-navy-900">Última foto</h2>
              </CardHeader>
              <CardContent className="grid grid-cols-[4.75rem_minmax(0,1fr)] items-center gap-3">
                <div className="relative aspect-square overflow-hidden rounded-field bg-navy-50">
                  <Image
                    src={lastPhoto.url}
                    alt={lastPhoto.caption ?? `Foto de ${activeStay.pet.name}`}
                    fill
                    sizes="88px"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 space-y-1">
                  {lastPhoto.caption && (
                    <p className="text-sm leading-snug text-ink-muted">{lastPhoto.caption}</p>
                  )}
                  <p className="text-xs font-semibold text-ink-subtle">
                    {formatDate(lastPhoto.takenAt)}
                  </p>
                  <Link
                    href="/mi-mascota"
                    className="inline-flex min-h-11 cursor-pointer items-center gap-1 text-sm font-bold text-brand-700 transition-colors hover:text-brand-800"
                  >
                    Ver fotos
                    <ChevronRight className="size-3.5" aria-hidden />
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="hidden h-full md:block">
            <CardHeader className="flex-row items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-[0.7rem] bg-canvas-warm text-brand-700">
                <Sparkles className="size-4.5" aria-hidden />
              </span>
              <h2 className="text-lg text-navy-900">Accesos rápidos</h2>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 sm:grid-cols-2">
                <QuickLink href="/reservas" label="Reservas" icon={CalendarPlus} tone="info" />
                <QuickLink
                  href="/mascotas"
                  label={petCount > 0 ? 'Mis mascotas' : 'Registrar mascota'}
                  icon={PawPrint}
                  tone="brand"
                />
                <QuickLink href="/notificaciones" label="Avisos" icon={Bell} tone="navy" />
                {activeStay ? (
                  <QuickLink
                    href="/mi-mascota"
                    label={`Día de ${activeStay.pet.name}`}
                    icon={Camera}
                    tone="success"
                  />
                ) : (
                  <QuickLink href="/mascotas/nueva" label="Nueva mascota" icon={Plus} tone="success" />
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

const quickLinkTones = {
  brand: 'bg-brand-50 text-brand-700',
  info: 'bg-info-soft text-info',
  navy: 'bg-navy-50 text-navy-600',
  success: 'bg-success-soft text-success',
} as const

function QuickLink({
  href,
  label,
  icon: Icon,
  tone,
}: {
  href: '/reservas' | '/mascotas' | '/notificaciones' | '/mi-mascota' | '/mascotas/nueva'
  label: string
  icon: LucideIcon
  tone: keyof typeof quickLinkTones
}) {
  return (
    <Link
      href={href}
      className="group flex min-h-12 cursor-pointer items-center gap-2.5 rounded-field border border-line bg-canvas px-3 py-2 transition-[border-color,background-color] duration-200 hover:border-brand-200 hover:bg-canvas-warm"
    >
      <span
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-[0.7rem]',
          quickLinkTones[tone]
        )}
      >
        <Icon className="size-4.5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1 text-sm font-extrabold leading-tight text-navy-900">
        {label}
      </span>
      <ChevronRight
        className="size-4 shrink-0 text-ink-subtle transition-transform duration-200 group-hover:translate-x-0.5 xl:hidden 2xl:block"
        aria-hidden
      />
    </Link>
  )
}
