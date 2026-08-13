import Image from 'next/image'

import { cn } from '@/lib/utils'

const sizes = {
  sm: { box: 'size-9', px: 36, text: 'text-xs' },
  md: { box: 'size-12', px: 48, text: 'text-sm' },
  lg: { box: 'size-16', px: 64, text: 'text-lg' },
  xl: { box: 'size-24', px: 96, text: 'text-2xl' },
} as const

/**
 * Avatar de mascota. Sin foto cae a la inicial sobre fondo calido: nunca un
 * icono generico gris, que es lo que hace sentir el producto vacio.
 */
export function PetAvatar({
  name,
  photoUrl,
  size = 'md',
  className,
}: {
  name: string
  photoUrl?: string | null
  size?: keyof typeof sizes
  className?: string
}) {
  const config = sizes[size]

  return (
    <div
      className={cn(
        'relative shrink-0 overflow-hidden rounded-full border border-line bg-brand-50',
        config.box,
        className
      )}
    >
      {photoUrl ? (
        <Image
          src={photoUrl}
          alt={`Foto de ${name}`}
          width={config.px}
          height={config.px}
          className="size-full object-cover"
        />
      ) : (
        <span
          className={cn(
            'flex size-full items-center justify-center font-semibold text-brand-700',
            config.text
          )}
          aria-hidden
        >
          {name.trim().charAt(0).toUpperCase()}
        </span>
      )}
    </div>
  )
}
