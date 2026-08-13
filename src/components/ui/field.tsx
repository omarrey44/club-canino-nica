'use client'

import { createContext, useContext, useId, type ComponentProps, type ReactNode } from 'react'

import { cn } from '@/lib/utils'

type FieldContextValue = { inputId: string; errorId: string; hasError: boolean }

const FieldContext = createContext<FieldContextValue | null>(null)

function useField() {
  const ctx = useContext(FieldContext)
  if (!ctx) throw new Error('Input y Label deben usarse dentro de <Field>.')
  return ctx
}

/**
 * Agrupa label + control + error y cablea los ids de accesibilidad
 * (`htmlFor`, `aria-describedby`, `aria-invalid`) para no repetirlos a mano.
 */
export function Field({
  children,
  errors,
  className,
}: {
  children: ReactNode
  errors?: string[]
  className?: string
}) {
  const id = useId()
  const hasError = Boolean(errors?.length)

  return (
    <FieldContext.Provider
      value={{ inputId: `${id}-input`, errorId: `${id}-error`, hasError }}
    >
      <div className={cn('flex flex-col gap-1.5', className)}>
        {children}
        {hasError && (
          <p id={`${id}-error`} className="text-sm font-medium text-danger" aria-live="polite">
            {errors![0]}
          </p>
        )}
      </div>
    </FieldContext.Provider>
  )
}

export function Label({ className, ...props }: ComponentProps<'label'>) {
  const { inputId } = useField()
  return (
    <label
      htmlFor={inputId}
      className={cn('text-sm font-bold text-ink', className)}
      {...props}
    />
  )
}

export function Input({ className, ...props }: ComponentProps<'input'>) {
  const { inputId, errorId, hasError } = useField()
  return (
    <input
      id={inputId}
      aria-invalid={hasError || undefined}
      aria-describedby={hasError ? errorId : undefined}
      className={cn(
        'h-13 w-full rounded-field border bg-surface px-4 text-base text-ink shadow-[0_1px_2px_rgb(13_38_57_/_0.03)] transition-[border-color,box-shadow,background-color]',
        'placeholder:text-ink-subtle',
        'focus-visible:border-brand-500 focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-brand-100 focus-visible:outline-none',
        // 16px de fuente evita que iOS haga zoom al enfocar el campo.
        hasError ? 'border-danger' : 'border-line-strong hover:border-navy-300',
        className
      )}
      {...props}
    />
  )
}

export function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
  const { inputId, errorId, hasError } = useField()
  return (
    <textarea
      id={inputId}
      aria-invalid={hasError || undefined}
      aria-describedby={hasError ? errorId : undefined}
      className={cn(
        'min-h-24 w-full rounded-field border bg-surface p-4 text-base text-ink transition-[border-color,box-shadow,background-color]',
        'placeholder:text-ink-subtle',
        'focus-visible:border-brand-500 focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-brand-100 focus-visible:outline-none',
        hasError ? 'border-danger' : 'border-line-strong hover:border-navy-300',
        className
      )}
      {...props}
    />
  )
}

/**
 * Select nativo a proposito: en movil abre la rueda del sistema, que es mas
 * rapida y accesible que cualquier desplegable propio.
 */
export function Select({ className, children, ...props }: ComponentProps<'select'>) {
  const { inputId, errorId, hasError } = useField()
  return (
    <select
      id={inputId}
      aria-invalid={hasError || undefined}
      aria-describedby={hasError ? errorId : undefined}
      className={cn(
        'h-13 w-full appearance-none rounded-field border bg-surface px-4 text-base text-ink transition-[border-color,box-shadow,background-color]',
        'focus-visible:border-brand-500 focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-brand-100 focus-visible:outline-none',
        // Flecha propia: `appearance-none` quita la del navegador.
        "bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23667085%22 stroke-width=%222%22 stroke-linecap=%22round%22><path d=%22M6 9l6 6 6-6%22/></svg>')] bg-[length:18px] bg-[right_0.85rem_center] bg-no-repeat pr-10",
        hasError ? 'border-danger' : 'border-line-strong hover:border-navy-300',
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
}

export function Checkbox({ className, label, ...props }: ComponentProps<'input'> & { label: string }) {
  const { inputId } = useField()
  return (
    <label htmlFor={inputId} className="flex min-h-11 items-center gap-2.5 text-sm text-ink">
      <input
        id={inputId}
        type="checkbox"
        className={cn('size-5 rounded border-line-strong accent-brand-500', className)}
        {...props}
      />
      {label}
    </label>
  )
}

export function Hint({ className, ...props }: ComponentProps<'p'>) {
  return <p className={cn('text-sm leading-relaxed text-ink-muted', className)} {...props} />
}
