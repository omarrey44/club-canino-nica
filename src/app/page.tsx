import {
  ArrowRight,
  Camera,
  CalendarCheck,
  Clock3,
  FileText,
  Images,
  Mail,
  MapPin,
  PawPrint,
  Phone,
  type LucideIcon,
} from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

import { BrandLogo } from '@/components/ui/brand-logo'
import { LinkButton } from '@/components/ui/button'
import { formatCurrency } from '@/config/business'
import { priceUnitLabel } from '@/lib/constants/labels'
import { getCurrentUser, isStaff } from '@/server/auth/session'
import { getBusinessSettings, getOrganization } from '@/server/organization'
import { getBookableServices } from '@/server/queries/services'

// La unica pagina que si debe aparecer en buscadores; el resto es privado.
export const metadata: Metadata = { robots: { index: true, follow: true } }

const features: Array<{ icon: LucideIcon; title: string; text: string }> = [
  {
    icon: Images,
    title: 'Fotos y actividades al momento',
    text: 'Cuándo comió, con quién jugó y dónde está ahora, desde tu celular.',
  },
  {
    icon: CalendarCheck,
    title: 'Reservas en línea',
    text: 'Eliges servicio y fechas, y ves el precio antes de confirmar.',
  },
  {
    icon: Camera,
    title: 'Cámaras durante la estancia',
    text: 'Mira el área donde está tu mascota mientras está en el club.',
  },
  {
    icon: FileText,
    title: 'Reporte del día',
    text: 'Al recogerla, un resumen de cómo le fue: comida, juego y descanso.',
  },
]

// Ejemplo ilustrativo de lo que ve el dueño; no son datos reales.
const preview = [
  { time: '8:03 a. m.', text: 'Llegó al club' },
  { time: '10:20 a. m.', text: 'Juego en el patio' },
  { time: '12:20 p. m.', text: 'Siesta en la zona techada' },
]

/**
 * Raíz: con sesión enruta según el rol; sin sesión es la página pública que
 * presenta el club a quien todavía no es cliente.
 */
export default async function HomePage() {
  const user = await getCurrentUser()
  if (user) redirect(isStaff(user.role) ? '/admin' : '/inicio')

  const organization = await getOrganization()
  const [settings, catalog] = await Promise.all([
    getBusinessSettings(),
    getBookableServices(organization.id),
  ])
  const { contact, hours, billing } = settings
  const services = [...catalog.main, ...catalog.addons]

  return (
    <div className="min-h-dvh bg-canvas-warm">
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 rounded-field" aria-label={settings.name}>
          <BrandLogo decorative priority sizes="56px" className="w-12 sm:w-14" />
          <span className="hidden font-display text-lg font-semibold text-navy-900 sm:block">
            {settings.name}
          </span>
        </Link>
        <nav className="flex items-center gap-2" aria-label="Cuenta">
          <LinkButton href="/login" variant="ghost" size="sm">
            Entrar
          </LinkButton>
          <LinkButton href="/registro" size="sm">
            Crear cuenta
          </LinkButton>
        </nav>
      </header>

      <main id="main-content">
        <section className="mx-auto grid max-w-6xl items-center gap-8 px-4 pt-6 pb-12 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:pt-12 lg:pb-20">
          <div className="route-enter space-y-5">
            <p className="text-xs font-extrabold tracking-[0.16em] text-navy-500 uppercase">
              Guardería y hospedaje canino
            </p>
            <h1 className="text-4xl leading-[1.05] text-navy-900 sm:text-5xl lg:text-6xl">
              Su día en el club, siempre cerca de ti.
            </h1>
            <p className="max-w-xl text-lg text-ink-muted">{settings.tagline}</p>
            <div className="flex flex-wrap gap-3">
              <LinkButton href="/registro" size="lg">
                Crear cuenta gratis
                <ArrowRight aria-hidden />
              </LinkButton>
              <LinkButton href="/login" size="lg" variant="outline">
                Ya tengo cuenta
              </LinkButton>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[1.75rem] border-l-4 border-brand-500 bg-navy-900 p-6 text-white shadow-overlay sm:p-8">
            <PawPrint
              className="pointer-events-none absolute -right-6 -bottom-8 size-48 rotate-12 text-white/[0.05]"
              aria-hidden
            />
            <p className="text-sm font-bold text-navy-200">Así sigues el día de tu mascota</p>
            <ol className="stagger-enter relative mt-4 space-y-3">
              {preview.map((item) => (
                <li
                  key={item.time}
                  className="flex items-center gap-3 rounded-field border border-white/10 bg-white/[0.06] px-4 py-3"
                >
                  <span className="size-2 shrink-0 rounded-full bg-brand-400" aria-hidden />
                  <span className="min-w-0 flex-1 font-semibold">{item.text}</span>
                  <span className="text-xs font-bold text-navy-200 tabular-nums">{item.time}</span>
                </li>
              ))}
            </ol>
            <p className="relative mt-4 text-xs text-navy-300">Ejemplo de lo que ves en la app.</p>
          </div>
        </section>

        <section className="bg-surface py-12 lg:py-16" aria-labelledby="que-incluye">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 id="que-incluye" className="text-2xl text-navy-900 sm:text-3xl">
              Todo en un solo lugar
            </h2>
            <ul className="stagger-enter mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {features.map(({ icon: Icon, title, text }) => (
                <li key={title} className="rounded-card border border-line bg-canvas-warm p-5">
                  <span className="flex size-11 items-center justify-center rounded-[0.85rem] bg-brand-50 text-brand-700">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <h3 className="mt-3 text-lg text-navy-900">{title}</h3>
                  <p className="mt-1 text-sm text-ink-muted">{text}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {services.length > 0 && (
          <section className="py-12 lg:py-16" aria-labelledby="servicios">
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
              <h2 id="servicios" className="text-2xl text-navy-900 sm:text-3xl">
                Servicios y precios
              </h2>
              {!billing.isDemo && billing.taxRate > 0 && (
                <p className="mt-1 text-sm text-ink-muted">
                  Precios antes de {billing.taxLabel} ({Number((billing.taxRate * 100).toFixed(2))}%).
                </p>
              )}
              <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {services.map((service) => (
                  <li
                    key={service.id}
                    className="flex flex-col rounded-card border border-line bg-surface p-5 shadow-card"
                  >
                    <h3 className="text-lg text-navy-900">{service.name}</h3>
                    {service.description && (
                      <p className="mt-1 flex-1 text-sm text-ink-muted">{service.description}</p>
                    )}
                    <p className="mt-4 text-2xl font-extrabold text-navy-900 tabular-nums">
                      {formatCurrency(String(service.basePrice))}
                      <span className="ml-1.5 text-sm font-semibold text-ink-muted">
                        {priceUnitLabel(service.kind, service.priceUnit)}
                      </span>
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* Con datos DEMO esta seccion no aparece: un telefono falso es peor que ninguno. */}
        {(!hours.isDemo || !contact.isDemo) && (
          <section className="bg-surface py-12 lg:py-16" aria-labelledby="visitanos">
            <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 md:grid-cols-2">
              <h2 id="visitanos" className="text-2xl text-navy-900 sm:text-3xl md:col-span-2">
                Visítanos
              </h2>
              {!hours.isDemo && (
                <div className="space-y-2 text-ink">
                  <p className="flex items-center gap-2 font-bold text-navy-900">
                    <Clock3 className="size-5 text-brand-700" aria-hidden />
                    Horarios
                  </p>
                  <p>
                    Guardería: {hours.daycareOpen} a {hours.daycareClose}
                  </p>
                  <p>
                    Hospedaje: entrada {hours.boardingCheckIn}, salida {hours.boardingCheckOut}
                  </p>
                </div>
              )}
              {!contact.isDemo && (
                <div className="space-y-1">
                  <a
                    href={`tel:${contact.phone.replace(/\s+/g, '')}`}
                    className="flex min-h-11 items-center gap-2 font-semibold text-brand-700 hover:underline"
                  >
                    <Phone className="size-5" aria-hidden />
                    {contact.phone}
                  </a>
                  <a
                    href={`mailto:${contact.email}`}
                    className="flex min-h-11 items-center gap-2 font-semibold text-brand-700 hover:underline"
                  >
                    <Mail className="size-5" aria-hidden />
                    {contact.email}
                  </a>
                  <p className="flex items-start gap-2 py-2 text-ink-muted">
                    <MapPin className="mt-0.5 size-5 shrink-0" aria-hidden />
                    {contact.address}
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        <section className="bg-navy-900 py-12 text-white lg:py-16">
          <div className="mx-auto flex max-w-6xl flex-col items-start gap-5 px-4 sm:px-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl sm:text-3xl">Su primera visita empieza aquí</h2>
              <p className="mt-1 text-navy-200">
                Crea tu cuenta, registra a tu mascota y reserva en minutos.
              </p>
            </div>
            <LinkButton href="/registro" size="lg">
              Crear cuenta gratis
              <ArrowRight aria-hidden />
            </LinkButton>
          </div>
        </section>
      </main>

      <footer className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-ink-muted sm:px-6">
        <p>
          © {new Date().getFullYear()} {settings.name}
        </p>
        <Link href="/login" className="font-semibold hover:text-navy-900">
          Entrar a mi cuenta
        </Link>
      </footer>
    </div>
  )
}
