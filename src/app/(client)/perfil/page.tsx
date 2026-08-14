import { PawPrint, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LogoutButton } from '@/components/layout/logout-button'
import { PageHeader } from '@/components/ui/page-header'
import { StatusBadge } from '@/components/ui/status-badge'
import { business } from '@/config/business'
import { roleLabels } from '@/lib/constants/labels'
import { isStaff, requireUser } from '@/server/auth/session'

export const metadata: Metadata = { title: 'Mi perfil' }

export default async function ProfilePage() {
  const user = await requireUser()

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
          <CardTitle>{user.fullName}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <dl className="divide-y divide-line text-sm">
            <div className="flex justify-between gap-4 py-2.5">
              <dt className="text-ink-muted">Correo</dt>
              <dd className="text-right font-medium text-ink">{user.email}</dd>
            </div>
            <div className="flex justify-between gap-4 py-2.5">
              <dt className="text-ink-muted">Teléfono</dt>
              <dd className="text-right font-medium text-ink">
                {user.phone ?? 'Sin registrar'}
              </dd>
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
      </div>

      <p className="text-center text-xs text-ink-subtle">
        {business.name} · Datos de contacto y horarios pendientes de confirmar
      </p>
    </div>
  )
}
