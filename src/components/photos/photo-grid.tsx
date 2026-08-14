import { Star } from 'lucide-react'
import Image from 'next/image'

import { formatTime } from '@/lib/datetime'
import { cn } from '@/lib/utils'

export type GalleryPhoto = {
  id: string
  url: string
  caption: string | null
  takenAt: Date
  isFeatured?: boolean
}

/** Galería de la estancia, tal como la ve el propietario. */
export function PhotoGrid({
  photos,
  petName,
  className,
}: {
  photos: GalleryPhoto[]
  petName: string
  className?: string
}) {
  return (
    <ul className={cn('grid grid-cols-2 gap-3 sm:grid-cols-3', className)}>
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
            {photo.isFeatured && (
              <span
                className="absolute top-2 right-2 flex size-7 items-center justify-center rounded-full bg-brand-500 text-white"
                title="Destacada en el reporte"
              >
                <Star className="size-3.5" aria-hidden />
                <span className="sr-only">Destacada en el reporte</span>
              </span>
            )}
          </div>

          {photo.caption && <p className="text-sm text-ink-muted">{photo.caption}</p>}
          <p className="text-2xs text-ink-subtle tabular-nums">{formatTime(photo.takenAt)}</p>
        </li>
      ))}
    </ul>
  )
}
