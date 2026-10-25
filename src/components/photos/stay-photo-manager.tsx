'use client'

import { Images, Star, Trash2, Upload } from 'lucide-react'
import Image from 'next/image'
import { useActionState, useState, useTransition } from 'react'

import { Button } from '@/components/ui/button'
import { Field, Hint, Input, Label } from '@/components/ui/field'
import { useActionToast } from '@/components/ui/toaster'
import { formatTime } from '@/lib/datetime'
import {
  deleteStayPhoto,
  toggleFeaturedPhoto,
  uploadStayPhotos,
} from '@/server/actions/photos'
import { idleState } from '@/server/actions/types'
import type { GalleryPhoto } from './photo-grid'

/**
 * Galería de la estancia con los controles del personal.
 *
 * Permite subir varias fotos de una vez porque el equipo las toma con el
 * celular durante el día y las sube juntas, no de una en una.
 */
export function StayPhotoManager({
  stayId,
  petName,
  photos,
  canEdit,
}: {
  stayId: string
  petName: string
  photos: GalleryPhoto[]
  canEdit: boolean
}) {
  const [state, formAction, pending] = useActionState(
    uploadStayPhotos.bind(null, stayId),
    idleState
  )
  useActionToast(state)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  return (
    <div className="space-y-4">
      {canEdit && (
        // La `key` cambia al subir y remonta el formulario ya vacío.
        <form key={photos.length} action={formAction} className="space-y-3 rounded-card bg-canvas p-4">
          <Field>
            <Label>Fotos</Label>
            <Input
              type="file"
              name="photos"
              accept="image/jpeg,image/png,image/webp"
              multiple
            />
            <Hint>Hasta seis a la vez. El propietario recibe un aviso al publicarlas.</Hint>
          </Field>

          {/* "Pie de foto" y no "Comentario": el formulario de actividad, en la
              misma pantalla, ya tiene un campo con ese nombre. */}
          <Field>
            <Label>Pie de foto</Label>
            <Input name="caption" maxLength={160} placeholder="Jugando en el patio" />
          </Field>

          <Button type="submit" loading={pending} loadingLabel="Subiendo">
            <Upload aria-hidden />
            Publicar fotos
          </Button>
        </form>
      )}

      {photos.length === 0 ? (
        <p className="flex items-center gap-2 text-sm text-ink-muted">
          <Images className="size-4" aria-hidden />
          Todavía no hay fotos de esta estancia.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((photo) => (
            <li key={photo.id} className="space-y-1.5">
              <div className="relative aspect-square overflow-hidden rounded-field bg-navy-50">
                <Image
                  src={photo.url}
                  alt={photo.caption ?? `Foto de ${petName}`}
                  fill
                  sizes="(max-width: 640px) 45vw, 260px"
                  className="object-cover"
                />
              </div>

              {photo.caption && <p className="text-sm text-ink-muted">{photo.caption}</p>}
              <p className="text-2xs text-ink-subtle tabular-nums">
                {formatTime(photo.takenAt)}
              </p>

              {canEdit && (
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant={photo.isFeatured ? 'primary' : 'outline'}
                    loading={busyId === `f-${photo.id}`}
                    aria-label={
                      photo.isFeatured
                        ? 'Quitar del reporte'
                        : 'Destacar en el reporte'
                    }
                    onClick={() => {
                      setBusyId(`f-${photo.id}`)
                      startTransition(async () => {
                        await toggleFeaturedPhoto(photo.id)
                        setBusyId(null)
                      })
                    }}
                  >
                    <Star aria-hidden />
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    loading={busyId === `d-${photo.id}`}
                    aria-label="Eliminar foto"
                    onClick={() => {
                      setBusyId(`d-${photo.id}`)
                      startTransition(async () => {
                        await deleteStayPhoto(photo.id)
                        setBusyId(null)
                      })
                    }}
                  >
                    <Trash2 aria-hidden />
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
