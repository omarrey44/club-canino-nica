'use client'

import { Check } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

/**
 * Opcion seleccionable con apariencia de card.
 *
 * Por dentro es un `input type="radio"` de verdad, no un div con onClick: asi
 * funcionan las flechas del teclado, los lectores de pantalla lo anuncian como
 * grupo y el formulario sigue siendo un formulario.
 */
export function OptionCard({
  name,
  value,
  checked,
  onSelect,
  disabled = false,
  title,
  description,
  media,
  aside,
  children,
}: {
  name: string
  value: string
  checked: boolean
  onSelect: (value: string) => void
  disabled?: boolean
  title: string
  description?: ReactNode
  media?: ReactNode
  aside?: ReactNode
  children?: ReactNode
}) {
  return (
    <label
      className={cn(
        'relative flex cursor-pointer items-center gap-3.5 rounded-card border-2 bg-surface p-4 transition-colors',
        checked ? 'border-brand-500 bg-brand-50/40' : 'border-line hover:border-navy-300',
        disabled && 'cursor-not-allowed opacity-50'
      )}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={() => onSelect(value)}
        className="sr-only"
      />

      {media}

      <div className="min-w-0 flex-1">
        <p className="font-bold text-navy-900">{title}</p>
        {description && (
          <div className="mt-0.5 text-sm leading-relaxed text-ink-muted">{description}</div>
        )}
        {children}
      </div>

      {aside}

      <span
        className={cn(
          'flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
          checked ? 'border-brand-500 bg-brand-500 text-white' : 'border-line-strong'
        )}
        aria-hidden
      >
        {checked && <Check className="size-3.5" strokeWidth={3} />}
      </span>
    </label>
  )
}
