import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-field font-bold whitespace-nowrap transition-[color,background-color,border-color,box-shadow,transform] duration-200 disabled:pointer-events-none disabled:opacity-50 active:translate-y-px [&_svg]:size-[1.125em] [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary:
          'bg-brand-500 text-white shadow-[0_8px_18px_rgb(249_115_22_/_0.2)] hover:bg-brand-600 hover:shadow-[0_10px_22px_rgb(249_115_22_/_0.26)] active:bg-brand-700',
        secondary: 'bg-navy-800 text-white shadow-card hover:bg-navy-700 active:bg-navy-900',
        outline:
          'border border-line-strong bg-surface text-ink shadow-[0_1px_2px_rgb(13_38_57_/_0.03)] hover:border-navy-300 hover:bg-navy-50',
        ghost: 'text-ink-muted hover:bg-navy-50 hover:text-navy-800',
        danger: 'bg-danger text-white hover:brightness-95',
      },
      size: {
        // Alturas >= 44px: objetivo tactil comodo en movil.
        sm: 'h-11 px-4 text-sm',
        md: 'h-12 px-5 text-sm',
        lg: 'h-14 px-6 text-base',
        icon: 'size-11',
      },
      block: { true: 'w-full' },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  }
)

type ButtonProps = ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    loading?: boolean
    /** Texto anunciado a lectores de pantalla mientras carga. */
    loadingLabel?: string
  }

export function Button({
  className,
  variant,
  size,
  block,
  loading = false,
  loadingLabel = 'Procesando',
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size, block }), className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Loader2 className="animate-spin" aria-hidden />}
      {loading ? <span className="sr-only">{loadingLabel}</span> : null}
      {children}
    </button>
  )
}

/**
 * Enlace con apariencia de boton.
 *
 * Existe en vez de un `asChild`: un enlace debe seguir siendo `<a>` para que
 * el teclado, el clic con rueda y "abrir en pestana nueva" funcionen. Un
 * `<button>` que navega rompe las tres cosas.
 */
// Generico sobre la ruta para no perder la validacion de `typedRoutes`: sin el
// parametro, TypeScript colapsa el href a `unknown` y rechaza rutas dinamicas.
export function LinkButton<T extends string>({
  className,
  variant,
  size,
  block,
  ...props
}: ComponentProps<typeof Link<T>> & VariantProps<typeof buttonVariants>) {
  return (
    <Link className={cn(buttonVariants({ variant, size, block }), className)} {...props} />
  )
}

export { buttonVariants }
