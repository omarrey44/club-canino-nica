import {
  AlertTriangle,
  Building2,
  CalendarClock,
  Camera,
  CheckCircle2,
  ChevronRight,
  Eye,
  FileText,
  Palette,
  PawPrint,
  Settings2,
  ShieldCheck,
  Store,
  type LucideIcon,
} from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

import { BrandLogo } from '@/components/ui/brand-logo'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { BusinessSettingsForm } from '@/components/settings/business-settings-form'
import { business } from '@/config/business'
import { formatDate } from '@/lib/datetime'
import { requireRole } from '@/server/auth/session'
import { getBusinessSettings, getOrganization } from '@/server/organization'
import { getAllServices } from '@/server/queries/services'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Configuración' }

export default async function AdminSettingsPage() {
  const user = await requireRole('ADMIN', 'SUPER_ADMIN')
  const [organization, settings, services] = await Promise.all([
    getOrganization(),
    getBusinessSettings(),
    getAllServices(user.organizationId),
  ])

  const activeServices = services.filter((service) => service.isActive)
  const hasDemoData = settings.contact.isDemo || settings.hours.isDemo || settings.billing.isDemo

  const readinessChecks = [
    Boolean(organization.name),
    Boolean(organization.timezone),
    Boolean(organization.currency),
    Boolean(business.logoUrl),
    activeServices.length > 0,
    !settings.contact.isDemo,
    !settings.hours.isDemo,
    !settings.billing.isDemo,
  ]
  const completedChecks = readinessChecks.filter(Boolean).length
  const completion = Math.round((completedChecks / readinessChecks.length) * 100)

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Administración"
        icon={Settings2}
        title="Configuración del negocio"
        description={`Administra la información y preferencias de ${organization.name}.`}
        action={
          <Link
            href="/inicio"
            className="hidden min-h-11 items-center gap-2 rounded-field border border-line-strong bg-surface px-4 text-sm font-bold text-navy-800 shadow-card transition-[border-color,background-color] duration-200 hover:border-brand-200 hover:bg-canvas-warm sm:inline-flex"
          >
            <Eye className="size-4.5" aria-hidden />
            Vista para clientes
          </Link>
        }
      />

      {hasDemoData && (
        <section
          className="relative overflow-hidden rounded-card border border-brand-200 bg-canvas-warm"
          aria-labelledby="aviso-configuracion"
        >
          <div className="grid lg:grid-cols-2">
            <div className="flex items-start gap-3 p-4 sm:p-5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-[0.8rem] bg-brand-50 text-brand-700">
                <AlertTriangle className="size-5" aria-hidden />
              </span>
              <div>
                <h2 id="aviso-configuracion" className="font-display text-base text-navy-900">
                  Información importante
                </h2>
                <p className="mt-0.5 text-sm leading-snug text-ink-muted">
                  Hay datos marcados como DEMO. Corrígelos abajo y guarda: desde ese momento son los oficiales.
                </p>
              </div>
            </div>
            <div className="hidden border-t border-brand-100 p-4 sm:p-5 lg:block lg:border-t-0 lg:border-l">
              <p className="text-xs font-extrabold tracking-[0.14em] text-brand-800 uppercase">
                Entorno de demostración
              </p>
              <p className="mt-1 max-w-xl text-sm leading-snug text-ink-muted">
                Mientras sigan en DEMO, el impuesto y los horarios de las reservas son los de prueba.
              </p>
            </div>
          </div>
          <PawPrint
            className="pointer-events-none absolute -right-4 -bottom-7 size-24 rotate-12 text-brand-100"
            aria-hidden
          />
        </section>
      )}

      <nav
        aria-label="Secciones de configuración"
        className="overflow-hidden rounded-card border border-line bg-surface shadow-card"
      >
        <ul className="grid grid-cols-3 lg:grid-cols-5">
          <li><SectionShortcut href="#informacion" label="Información general" icon={Store} active /></li>
          <li><SectionShortcut href="#informacion" label="Horario y cobros" icon={CalendarClock} /></li>
          <li>
            <Link
              href="/admin/servicios"
              className="flex min-h-12 items-center justify-center gap-2 border-b-2 border-transparent px-3 text-sm font-bold text-ink-muted transition-[color,background-color,border-color] duration-200 hover:border-brand-200 hover:bg-canvas-warm hover:text-navy-900"
            >
              <Settings2 className="size-4" aria-hidden />
              Servicios
            </Link>
          </li>
          <li><SectionShortcut href="#identidad" label="Logo y marca" icon={Palette} /></li>
          <li><SectionShortcut href="#seguridad" label="Estado y seguridad" icon={ShieldCheck} /></li>
        </ul>
      </nav>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.55fr)_minmax(19rem,0.9fr)] lg:items-start">
        <Card id="informacion" className="scroll-mt-24 overflow-hidden">
          <CardHeader className="flex-row items-center gap-3 border-b border-line">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-[0.8rem] bg-brand-50 text-brand-700">
              <Building2 className="size-5" aria-hidden />
            </span>
            <div>
              <h2 className="text-lg text-navy-900">Información del negocio</h2>
              <p className="text-sm text-ink-muted">Datos usados en el panel y el portal del cliente.</p>
            </div>
          </CardHeader>
          <CardContent className="pt-5">
            <BusinessSettingsForm settings={settings} />
            <dl className="mt-5 grid grid-cols-2 gap-3 rounded-field bg-canvas px-3.5 py-3 text-sm sm:grid-cols-4">
              <Fact label="Zona horaria" value={organization.timezone} />
              <Fact
                label="Moneda"
                value={organization.currency === 'NIO' ? 'NIO · Córdoba' : organization.currency}
              />
              <Fact label="Identificador" value={organization.slug} />
              <Fact label="Creada" value={formatDate(organization.createdAt)} />
            </dl>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card id="identidad" className="scroll-mt-24 overflow-hidden">
            <CardHeader className="flex-row items-center gap-3 border-b border-line">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-[0.8rem] bg-brand-50 text-brand-700">
                <Palette className="size-5" aria-hidden />
              </span>
              <div>
                <h2 className="text-lg text-navy-900">Logo y marca</h2>
                <p className="text-sm text-ink-muted">Identidad visual activa en la plataforma.</p>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center text-center">
                <BrandLogo priority sizes="144px" className="w-36" />
                <span className="mt-2 inline-flex items-center gap-1.5 rounded-pill bg-success-soft px-3 py-1 text-xs font-extrabold text-success">
                  <CheckCircle2 className="size-3.5" aria-hidden />
                  Logo oficial activo
                </span>
                <p className="mt-2 max-w-xs text-sm leading-snug text-ink-muted">{settings.tagline}</p>
              </div>

              <div className="mt-4 border-t border-line pt-4">
                <p className="text-sm font-extrabold text-navy-900">Colores principales</p>
                <ul className="mt-2.5 grid grid-cols-4 gap-2" aria-label="Paleta de marca">
                  <BrandColor label="Navy" colorClass="bg-navy-900" />
                  <BrandColor label="Naranja" colorClass="bg-brand-500" />
                  <BrandColor label="Crema" colorClass="bg-canvas-warm" bordered />
                  <BrandColor label="Neutro" colorClass="bg-line" />
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card id="seguridad" className="scroll-mt-24 overflow-hidden">
            <CardHeader className="flex-row items-center gap-3 pb-2">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-[0.8rem] bg-success-soft text-success">
                <ShieldCheck className="size-5" aria-hidden />
              </span>
              <div>
                <h2 className="text-lg text-navy-900">Estado de la configuración</h2>
                <p className="text-sm text-ink-muted">
                  {completedChecks} de {readinessChecks.length} verificaciones completas
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div
                  className="h-2 flex-1 overflow-hidden rounded-pill bg-navy-100"
                  role="progressbar"
                  aria-label="Configuración completada"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={completion}
                >
                  <div className="h-full rounded-pill bg-success" style={{ width: `${completion}%` }} />
                </div>
                <span className="text-sm font-extrabold text-navy-900 tabular-nums">{completion}%</span>
              </div>
              <ul className="mt-3 space-y-2 text-sm">
                <StatusLine complete label="Organización conectada a la base de datos" />
                <StatusLine
                  complete={activeServices.length > 0}
                  label={`${activeServices.length} servicio${activeServices.length === 1 ? '' : 's'} activo${activeServices.length === 1 ? '' : 's'}`}
                />
                <StatusLine complete={!hasDemoData} label="Datos comerciales confirmados" />
              </ul>
              <p className="mt-3 border-t border-line pt-3 text-xs leading-snug text-ink-subtle">
                Acceso limitado a administradores · Última actualización {formatDate(organization.updatedAt)}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

        <Card>
          <CardHeader className="flex-row items-center gap-3 border-b border-line">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-[0.8rem] bg-canvas-warm text-brand-700">
              <PawPrint className="size-5" aria-hidden />
            </span>
            <div>
              <h2 className="text-lg text-navy-900">Acciones rápidas</h2>
              <p className="text-sm text-ink-muted">Accesos a módulos que ya están disponibles.</p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
              <QuickAction href="/inicio" icon={Eye} title="Ver como cliente" description="Previsualiza el portal familiar" tone="brand" />
              <QuickAction href="/admin/servicios" icon={Settings2} title="Administrar servicios" description={`${services.length} configurados`} tone="success" />
              <QuickAction href="/admin/camaras" icon={Camera} title="Revisar cámaras" description="Estado y accesos en vivo" tone="info" />
              <QuickAction href="/admin/reportes" icon={FileText} title="Ver reportes" description="Informes diarios publicados" tone="navy" />
            </div>
          </CardContent>
        </Card>
    </div>
  )
}

function SectionShortcut({ href, label, icon: Icon, active = false }: { href: string; label: string; icon: LucideIcon; active?: boolean }) {
  return (
    <a
      href={href}
      className={cn(
        'flex min-h-12 items-center justify-center gap-2 border-b-2 px-3 text-sm font-bold transition-[color,background-color,border-color] duration-200',
        active
          ? 'border-brand-500 bg-canvas-warm text-brand-800'
          : 'border-transparent text-ink-muted hover:border-brand-200 hover:bg-canvas-warm hover:text-navy-900'
      )}
    >
      <Icon className="size-4" aria-hidden />
      {label}
    </a>
  )
}

function BrandColor({ label, colorClass, bordered = false }: { label: string; colorClass: string; bordered?: boolean }) {
  return (
    <li className="text-center">
      <span className={cn('mx-auto block size-9 rounded-[0.65rem]', colorClass, bordered && 'border border-line')} aria-hidden />
      <span className="mt-1 block text-xs font-bold text-ink-muted">{label}</span>
    </li>
  )
}

function StatusLine({ complete, label }: { complete: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2 text-ink-muted">
      {complete ? <CheckCircle2 className="size-4 shrink-0 text-success" aria-hidden /> : <AlertTriangle className="size-4 shrink-0 text-warning" aria-hidden />}
      <span>{label}</span>
    </li>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-bold text-ink-subtle">{label}</dt>
      <dd className="mt-0.5 truncate font-extrabold text-navy-900">{value}</dd>
    </div>
  )
}

const quickActionTones = {
  brand: 'bg-brand-50 text-brand-700',
  success: 'bg-success-soft text-success',
  info: 'bg-info-soft text-info',
  navy: 'bg-navy-50 text-navy-700',
} as const

function QuickAction({ href, icon: Icon, title, description, tone }: { href: '/inicio' | '/admin/servicios' | '/admin/camaras' | '/admin/reportes'; icon: LucideIcon; title: string; description: string; tone: keyof typeof quickActionTones }) {
  return (
    <Link href={href} className="group flex min-h-20 items-center gap-3 rounded-field border border-line bg-canvas p-3 transition-[border-color,background-color] duration-200 hover:border-brand-200 hover:bg-canvas-warm">
      <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-full', quickActionTones[tone])}>
        <Icon className="size-4.5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-extrabold text-navy-900">{title}</span>
        <span className="mt-0.5 block text-xs leading-snug text-ink-muted">{description}</span>
      </span>
      <ChevronRight className="size-4 shrink-0 text-ink-subtle transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
    </Link>
  )
}
