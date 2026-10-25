import { Mail, MapPin, PawPrint, Phone, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

import { ProfileForm } from '@/components/account/profile-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LogoutButton } from '@/components/layout/logout-button'
import { PageHeader } from '@/components/ui/page-header'
import { StatusBadge } from '@/components/ui/status-badge'
import { roleLabels } from '@/lib/constants/labels'
import { isStaff, requireUser } from '@/server/auth/session'
import { getBusinessSettings } from '@/server/organization'

export const metadata: Metadata = { title: 'Mi perfil' }

export default async function ProfilePage() {
  const user = await requireUser()
  const { name, contact } = await getBusinessSettings()

  return (
    <div className="mx-auto max-w-5xl space-y-4 sm:space-y-5">
      <PageHeader
        eyebrow="Tu cuenta"
        icon={ShieldCheck}
        title="Mi perfil"
        description="Tus datos y accesos del Club Canino."
        action={<LogoutButton />}
      />

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
      <Card>
        <CardHeader>
          <CardTitle>Tus datos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ProfileForm fullName={user.fullName} phone={user.phone} />

          <dl className="divide-y divide-line border-t border-line text-sm">
            <div className="flex justify-between gap-4 py-2.5">
              <dt className="text-ink-muted">Correo</dt>
              <dd className="text-right font-medium text-ink">{user.email}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 py-2.5">
              <dt className="text-ink-muted">Rol</dt>
              <dd>
                <StatusBadge tone={isStaff(user.role) ? 'brand' : 'neutral'}>
                  {roleLabels[user.role]}
                </StatusBadge>
              </dd>
            </div>
          </dl>

          {isStaff(user.role) && (
            <Link
              href="/admin"
              className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-brand-700 hover:underline"
            >
              <ShieldCheck className="size-4" aria-hidden />
              Ir al panel administrativo
            </Link>
          )}
        </CardContent>
      </Card>

      <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Mis mascotas</CardTitle>
        </CardHeader>
        <CardContent>
          <Link
            href="/mascotas"
            className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-brand-700 hover:underline"
          >
            <PawPrint className="size-4" aria-hidden />
            Ver y administrar mascotas
          </Link>
        </CardContent>
      </Card>

      {/* Con datos DEMO no se muestra nada: un teléfono falso es peor que ninguno. */}
      {!contact.isDemo && (
        <Card>
          <CardHeader>
            <CardTitle>Contacto de {name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <a
              href={`tel:${contact.phone.replace(/\s+/g, '')}`}
              className="flex min-h-11 items-center gap-2 font-semibold text-brand-700 hover:underline"
            >
              <Phone className="size-4" aria-hidden />
              {contact.phone}
            </a>
            <a
              href={`mailto:${contact.email}`}
              className="flex min-h-11 items-center gap-2 font-semibold text-brand-700 hover:underline"
            >
              <Mail className="size-4" aria-hidden />
              {contact.email}
            </a>
            <p className="flex items-start gap-2 py-2 text-ink-muted">
              <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
              {contact.address}
            </p>
          </CardContent>
        </Card>
      )}
      </div>
      </div>
    </div>
  )
}
