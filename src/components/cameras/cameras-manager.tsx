'use client'

import { Pencil, Plus, Power, Video, X } from 'lucide-react'
import { useState, useTransition } from 'react'

import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { CameraForm } from './camera-form'
import { EmptyState } from '@/components/ui/empty-state'
import { StatusBadge } from '@/components/ui/status-badge'
import { grantCameraAccess, revokeCameraAccess, toggleCamera } from '@/server/actions/cameras'

export type ManagedCamera = {
  id: string
  name: string
  area: string
  description: string | null
  provider: string
  providerRef: string
  protocol: string
  status: string
  isActive: boolean
  access: Array<{ id: string; petName: string; stayId: string }>
}

export type ActiveStayOption = { id: string; label: string }

const statusLabels: Record<string, string> = {
  ONLINE: 'En línea',
  OFFLINE: 'Fuera de línea',
  MAINTENANCE: 'Mantenimiento',
}

/**
 * Administración de cámaras y de quién puede verlas.
 *
 * Los permisos se conceden por estancia, no por cliente ni por mascota: es la
 * estancia la que empieza y termina, y con ella el acceso.
 */
export function CamerasManager({
  cameras,
  activeStays,
  canEditCatalog,
}: {
  cameras: ManagedCamera[]
  activeStays: ActiveStayOption[]
  canEditCatalog: boolean
}) {
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [message, setMessage] = useState<{ tone: 'success' | 'danger'; text: string } | null>(
    null
  )
  const [, startTransition] = useTransition()

  function run(key: string, work: () => Promise<{ status: string; message?: string }>) {
    setBusy(key)
    setMessage(null)
    startTransition(async () => {
      const result = await work()
      setBusy(null)
      if (result.message) {
        setMessage({
          tone: result.status === 'error' ? 'danger' : 'success',
          text: result.message,
        })
      }
    })
  }

  return (
    <div className="space-y-4">
      {message && <Alert tone={message.tone}>{message.text}</Alert>}

      {canEditCatalog && (
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
            {creating ? 'Cancelar' : 'Nueva cámara'}
          </Button>
        </div>
      )}

      {creating && <CameraForm onDone={() => setCreating(false)} />}

      {cameras.length === 0 && !creating ? (
        <EmptyState
          icon={Video}
          title="No hay cámaras configuradas"
          description="Cada cámara se autoriza por estancia: al terminar el día, el propietario pierde el acceso automáticamente."
        />
      ) : (
        <ul className="space-y-3">
          {cameras.map((camera) => (
            <li
              key={camera.id}
              className="overflow-hidden rounded-card border border-line bg-surface"
            >
              <div className="flex flex-wrap items-start gap-3 p-4">
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold text-navy-900">{camera.name}</p>
                    <StatusBadge tone={camera.isActive ? 'success' : 'neutral'}>
                      {camera.isActive ? 'Disponible' : 'Desactivada'}
                    </StatusBadge>
                    <StatusBadge
                      tone={camera.status === 'ONLINE' ? 'success' : 'warning'}
                      showDot={false}
                    >
                      {statusLabels[camera.status] ?? camera.status}
                    </StatusBadge>
                    {camera.protocol === 'DEMO' && (
                      <StatusBadge tone="info" showDot={false}>
                        Demostración
                      </StatusBadge>
                    )}
                  </div>

                  <p className="text-sm text-ink-muted">{camera.area}</p>
                  {camera.description && (
                    <p className="text-sm text-ink-muted">{camera.description}</p>
                  )}
                </div>

                {canEditCatalog && (
                  <div className="flex shrink-0 gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingId(editingId === camera.id ? null : camera.id)
                        setCreating(false)
                      }}
                    >
                      <Pencil aria-hidden />
                      <span className="sr-only sm:not-sr-only">Editar</span>
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      loading={busy === `t-${camera.id}`}
                      aria-label={
                        camera.isActive
                          ? `Desactivar ${camera.name}`
                          : `Activar ${camera.name}`
                      }
                      onClick={() => run(`t-${camera.id}`, () => toggleCamera(camera.id))}
                    >
                      <Power aria-hidden />
                    </Button>
                  </div>
                )}
              </div>

              <div className="border-t border-line bg-canvas p-4">
                <p className="text-sm font-bold text-navy-900">Quién puede verla ahora</p>

                {camera.access.length === 0 ? (
                  <p className="mt-1 text-sm text-ink-muted">
                    Nadie. Autoriza una estancia para que el propietario pueda verla.
                  </p>
                ) : (
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {camera.access.map((grant) => (
                      <li
                        key={grant.id}
                        className="flex items-center gap-1 rounded-pill border border-line-strong bg-surface py-1 pr-1 pl-3 text-sm font-semibold text-ink"
                      >
                        {grant.petName}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="size-8"
                          loading={busy === `r-${grant.id}`}
                          aria-label={`Revocar acceso de ${grant.petName} a ${camera.name}`}
                          onClick={() => run(`r-${grant.id}`, () => revokeCameraAccess(grant.id))}
                        >
                          <X aria-hidden />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}

                {camera.isActive && activeStays.length > 0 && (
                  <div className="mt-3 flex flex-wrap items-end gap-2">
                    <label className="flex-1">
                      <span className="sr-only">Autorizar una estancia en {camera.name}</span>
                      <GrantSelect
                        stays={activeStays.filter(
                          (stay) => !camera.access.some((a) => a.stayId === stay.id)
                        )}
                        busy={busy === `g-${camera.id}`}
                        onGrant={(stayId) =>
                          run(`g-${camera.id}`, () => grantCameraAccess(stayId, camera.id))
                        }
                      />
                    </label>
                  </div>
                )}
              </div>

              {editingId === camera.id && (
                <div className="border-t border-line p-4">
                  <CameraForm
                    onDone={() => setEditingId(null)}
                    defaults={{
                      id: camera.id,
                      name: camera.name,
                      area: camera.area,
                      description: camera.description,
                      provider: camera.provider,
                      providerRef: camera.providerRef,
                      protocol: camera.protocol,
                      status: camera.status,
                      isActive: camera.isActive,
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

/** Selector que concede el permiso al elegir, sin boton aparte. */
function GrantSelect({
  stays,
  busy,
  onGrant,
}: {
  stays: ActiveStayOption[]
  busy: boolean
  onGrant: (stayId: string) => void
}) {
  if (stays.length === 0) {
    return <p className="text-sm text-ink-muted">Todas las estancias activas ya tienen acceso.</p>
  }

  return (
    <select
      defaultValue=""
      disabled={busy}
      onChange={(event) => {
        if (event.target.value) {
          onGrant(event.target.value)
          event.target.value = ''
        }
      }}
      className="h-11 w-full rounded-field border border-line-strong bg-surface px-3.5 text-sm text-ink"
    >
      <option value="" disabled>
        {busy ? 'Autorizando...' : 'Autorizar una estancia...'}
      </option>
      {stays.map((stay) => (
        <option key={stay.id} value={stay.id}>
          {stay.label}
        </option>
      ))}
    </select>
  )
}
