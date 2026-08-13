import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-field font-semibold whitespace-nowrap transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-[1.125em] [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary: 'bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700',
        secondary: 'bg-navy-800 text-white hover:bg-navy-700 active:bg-navy-900',
        outline: 'border border-line-strong bg-surface text-ink hover:bg-canvas',
        ghost: 'text-ink-muted hover:bg-navy-50 hover:text-ink',
        danger: 'bg-danger text-white hover:brightness-95',
      },
      size: {
        // Alturas >= 44px: objetivo tactil comodo en movil.
        sm: 'h-11 px-3.5 text-sm',
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

export { buttonVariants }
