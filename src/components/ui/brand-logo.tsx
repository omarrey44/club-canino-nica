import Image from 'next/image'

import { business } from '@/config/business'
import { cn } from '@/lib/utils'

/** Logo oficial. La proporción intrínseca evita deformaciones entre pantallas. */
export function BrandLogo({
  className,
  priority = false,
  decorative = false,
  sizes,
}: {
  className?: string
  priority?: boolean
  decorative?: boolean
  sizes?: string
}) {
  return (
    <Image
      src={business.logoUrl}
      width={515}
      height={489}
      alt={decorative ? '' : business.name}
      className={cn('h-auto object-contain', className)}
      priority={priority}
      sizes={sizes}
    />
  )
}
