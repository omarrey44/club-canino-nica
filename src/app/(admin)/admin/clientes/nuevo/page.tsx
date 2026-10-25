import { ArrowLeft, UserPlus } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { ClientAccountForm } from '@/components/users/client-account-form'
import { requireStaff } from '@/server/auth/session'

export const metadata: Metadata = { title: 'Registrar cliente' }

export default async function NewClientPage() {
  await requireStaff()

  return (
    <div className="mx-auto max-w-3xl space-y-4 sm:space-y-5">
      <Link
        href="/admin/clientes"
        className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-ink-muted hover:text-navy-900"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Clientes
      </Link>

      <PageHeader
        eyebrow="Mostrador"
        icon={UserPlus}
        title="Registrar cliente"
        description="Para quien llega al club sin cuenta. Después le agregas su mascota y su reserva."
      />

      <Card>
        <CardContent className="pt-4 sm:pt-5">
          <ClientAccountForm />
        </CardContent>
      </Card>
    </div>
  )
}
