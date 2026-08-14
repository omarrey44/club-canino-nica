import { AlertTriangle } from 'lucide-react'
import type { Metadata } from 'next'

import { Alert } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { business } from '@/config/business'
import { getOrganization } from '@/server/organization'
import { requireRole } from '@/server/auth/session'

export const metadata: Metadata = { title: 'Configuración' }

export default async function AdminSettingsPage() {
  // Configuración del negocio: solo administradores, no todo el personal.
  await requireRole('ADMIN', 'SUPER_ADMIN')
  const organization = await getOrganization()

  const rows: Array<[string, string]> = [
    ['Nombre', organization.name],
    ['Zona horaria', organization.timezone],
    ['Moneda', organization.currency],
    ['Teléfono', business.contact.phone],
    ['Correo', business.contact.email],
    ['Direccion', business.contact.address],
    ['Horario guardería', `${business.hours.daycareOpen} – ${business.hours.daycareClose}`],
    ['Impuesto', `${business.billing.taxLabel} ${(business.billing.taxRate * 100).toFixed(0)}%`],
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configuración"
        description="Datos del negocio que usa toda la plataforma."
      />

      <Alert tone="warning">
        <span className="flex items-start gap-1.5">
          <AlertTriangle className="sr-only" aria-hidden />
          Teléfono, direccion, horarios e impuestos son valores <strong>DEMO</strong>. No son
          datos oficiales de {business.name} y deben confirmarse antes de mostrar la
          plataforma a clientes reales.
        </span>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Datos actuales</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="divide-y divide-line text-sm">
            {rows.map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4 py-2.5">
                <dt className="text-ink-muted">{label}</dt>
                <dd className="text-right font-medium text-ink">{value}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      <p className="text-center text-xs text-ink-subtle">
        Edicion desde la interfaz · Fase 9
      </p>
    </div>
  )
}
