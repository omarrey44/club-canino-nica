'use client'

import { FileText, Plus, Trash2 } from 'lucide-react'
import { useActionState, useState } from 'react'

import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, Hint, Input, Label, Textarea } from '@/components/ui/field'
import { StatusBadge } from '@/components/ui/status-badge'
import { formatDate } from '@/lib/datetime'
import { deleteVaccination } from '@/server/actions/vaccinations'
import { idleState, type ActionState } from '@/server/actions/types'
import { vaccinationStatus, type VaccinationStatus } from '@/lib/pets'

export type VaccinationItem = {
  id: string
  name: string
  appliedAt: Date
  expiresAt: Date | null
  documentUrl: string | null
  notes: string | null
}

const statusCopy: Record<VaccinationStatus, { label: string; tone: 'success' | 'warning' | 'danger' | 'neutral' }> = {
  ok: { label: 'Vigente', tone: 'success' },
  expiring: { label: 'Por vencer', tone: 'warning' },
  expired: { label: 'Vencida', tone: 'danger' },
  unknown: { label: 'Sin vencimiento', tone: 'neutral' },
}

export function VaccinationSection({
  vaccinations,
  addAction,
  canEdit,
}: {
  vaccinations: VaccinationItem[]
  addAction: (prev: ActionState, formData: FormData) => Promise<ActionState>
  canEdit: boolean
}) {
  const [open, setOpen] = useState(false)
  const [state, formAction, pending] = useActionState(addAction, idleState)
  const errors = state.fieldErrors ?? {}

  // El formulario queda abierto tras guardar, porque casi nunca se registra una
  // sola vacuna. La `key` cambia cuando el listado crece, lo que remonta el
  // formulario ya vacio: sin efectos ni estado que sincronizar.

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Vacunas</CardTitle>
        {canEdit && (
          <Button size="sm" variant="outline" onClick={() => setOpen((v) => !v)}>
            <Plus aria-hidden />
            {open ? 'Cancelar' : 'Agregar'}
          </Button>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {state.status === 'success' && state.message && (
          <Alert tone="success">{state.message}</Alert>
        )}

        {vaccinations.length === 0 && !open && (
          <p className="text-sm text-ink-muted">
            Aún no hay vacunas registradas. Manten el esquema al dia para que tu mascota
            pueda quedarse en el club.
          </p>
        )}

        {vaccinations.length > 0 && (
          <ul className="divide-y divide-line">
            {vaccinations.map((vaccination) => {
              const status = vaccinationStatus(vaccination.expiresAt)
              const copy = statusCopy[status]

              return (
                <li key={vaccination.id} className="flex items-start gap-3 py-3 first:pt-0">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-ink">{vaccination.name}</p>
                      <StatusBadge tone={copy.tone}>{copy.label}</StatusBadge>
                    </div>

                    <p className="text-sm text-ink-muted">
                      Aplicada {formatDate(vaccination.appliedAt)}
                      {vaccination.expiresAt && ` · Vence ${formatDate(vaccination.expiresAt)}`}
                    </p>

                    {vaccination.notes && (
                      <p className="text-sm text-ink-muted">{vaccination.notes}</p>
                    )}

                    {vaccination.documentUrl && (
                      <a
                        href={vaccination.documentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:underline"
                      >
                        <FileText className="size-3.5" aria-hidden />
                        Ver comprobante
                      </a>
                    )}
                  </div>

                  {canEdit && (
                    <form action={deleteVaccination.bind(null, vaccination.id)}>
                      <Button
                        type="submit"
                        variant="ghost"
                        size="icon"
                        aria-label={`Eliminar vacuna ${vaccination.name}`}
                      >
                        <Trash2 aria-hidden />
                      </Button>
                    </form>
                  )}
                </li>
              )
            })}
          </ul>
        )}

        {open && (
          <form
            key={vaccinations.length}
            action={formAction}
            className="space-y-4 rounded-field bg-canvas p-4"
            noValidate
          >
            {state.status === 'error' && state.message && (
              <Alert tone="danger">{state.message}</Alert>
            )}

            <Field errors={errors.name}>
              <Label>Vacuna</Label>
              <Input name="name" placeholder="Rabia" required autoFocus />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field errors={errors.appliedAt}>
                <Label>Fecha de aplicacion</Label>
                <Input type="date" name="appliedAt" required />
              </Field>

              <Field errors={errors.expiresAt}>
                <Label>Vence</Label>
                <Input type="date" name="expiresAt" />
              </Field>
            </div>

            <Field errors={errors.notes}>
              <Label>Notas</Label>
              <Textarea name="notes" rows={2} />
            </Field>

            <Field>
              <Label>Comprobante</Label>
              <Input type="file" name="document" accept="image/jpeg,image/png,image/webp" />
              <Hint>Opcional. Una foto del carnet sirve.</Hint>
            </Field>

            <Button type="submit" block loading={pending} loadingLabel="Guardando">
              Guardar vacuna
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
