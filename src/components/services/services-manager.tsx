'use client'

import { Pencil, Plus, Power } from 'lucide-react'
import { useState, useTransition } from 'react'

import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { ServiceForm } from './service-form'
import { StatusBadge } from '@/components/ui/status-badge'
import { Sparkles } from 'lucide-react'
import { formatCurrency } from '@/config/business'
import { toggleService } from '@/server/actions/services'

export type ManagedService = {
  id: string
  name: string
  description: string | null
  kind: string
  basePrice: string
  priceUnit: string
  durationMinutes: number | null
  dailyCapacity: number | null
  isActive: boolean
  reservationCount: number
}

const kindLabels: Record<string, string> = {
  DAYCARE: 'Guardería',
  BOARDING: 'Hospedaje',
  ADDON: 'Adicional',
}

function unitLabel(kind: string, priceUnit: string): string {
  if (priceUnit === 'UNIT') return 'por servicio'
  return kind === 'BOARDING' ? 'por noche' : 'por día'
}

/**
 * Administracion del catalogo.
 *
 * El formulario se abre en línea, debajo del servicio que se edita: son pocos
 * servicios y llevar al usuario a otra pantalla por cambiar un precio le hace
 * perder el contexto de la lista.
 */
export function ServicesManager({ services }: { services: ManagedService[] }) {
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          size="sm"
          variant={creating ? 'outline' : 'primary'}
          onClick={() => {
            setCreating((value) => !value)
            setEditingId(null)
          }}
        >
          <Plus aria-hidden />
          {creating ? 'Cancelar' : 'Nuevo servicio'}
        </Button>
      </div>

      {creating && <ServiceForm onDone={() => setCreating(false)} />}

      {services.length === 0 && !creating ? (
        <EmptyState
          icon={Sparkles}
          title="Aún no hay servicios configurados"
          description="Los precios viven aquí, no en el código: cambiarlos actualiza el flujo de reserva sin desplegar."
        />
      ) : (
        <ul className="space-y-3">
          {services.map((service) => (
            <li
              key={service.id}
              className="overflow-hidden rounded-card border border-line bg-surface"
            >
              <div className="flex flex-wrap items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold text-navy-900">{service.name}</p>
                    <StatusBadge tone={service.isActive ? 'success' : 'neutral'}>
                      {service.isActive ? 'Disponible' : 'Desactivado'}
                    </StatusBadge>
                    <StatusBadge tone="neutral" showDot={false}>
                      {kindLabels[service.kind] ?? service.kind}
                    </StatusBadge>
                  </div>

                  {service.description && (
                    <p className="mt-0.5 text-sm text-ink-muted">{service.description}</p>
                  )}

                  <p className="mt-1 text-sm text-ink-muted">
                    {service.dailyCapacity
                      ? `Cupo ${service.dailyCapacity} por día`
                      : 'Sin cupo maximo configurado'}
                    {service.reservationCount > 0 &&
                      ` · ${service.reservationCount} reservaciones`}
                  </p>
                </div>

                <div className="shrink-0 text-right">
                  <p className="font-extrabold text-navy-900 tabular-nums">
                    {formatCurrency(service.basePrice)}
                  </p>
                  <p className="text-2xs text-ink-subtle">
                    {unitLabel(service.kind, service.priceUnit)}
                  </p>
                </div>

                <div className="flex shrink-0 gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingId(editingId === service.id ? null : service.id)
                      setCreating(false)
                    }}
                  >
                    <Pencil aria-hidden />
                    <span className="sr-only sm:not-sr-only">Editar</span>
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    loading={pendingId === service.id}
                    aria-label={
                      service.isActive
                        ? `Desactivar ${service.name}`
                        : `Activar ${service.name}`
                    }
                    onClick={() => {
                      setPendingId(service.id)
                      startTransition(async () => {
                        await toggleService(service.id)
                        setPendingId(null)
                      })
                    }}
                  >
                    <Power aria-hidden />
                  </Button>
                </div>
              </div>

              {editingId === service.id && (
                <div className="border-t border-line p-4">
                  <ServiceForm
                    onDone={() => setEditingId(null)}
                    defaults={{
                      id: service.id,
                      name: service.name,
                      description: service.description,
                      kind: service.kind,
                      basePrice: service.basePrice,
                      priceUnit: service.priceUnit,
                      durationMinutes: service.durationMinutes
                        ? String(service.durationMinutes)
                        : '',
                      dailyCapacity: service.dailyCapacity
                        ? String(service.dailyCapacity)
                        : '',
                      isActive: service.isActive,
                    }}
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
