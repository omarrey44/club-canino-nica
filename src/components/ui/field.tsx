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
          <p id={`${id}-error`} className="text-sm text-danger">
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
      className={cn('text-sm font-medium text-ink', className)}
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
        'h-12 w-full rounded-field border bg-surface px-3.5 text-base text-ink transition-colors',
        'placeholder:text-ink-subtle',
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
        'min-h-24 w-full rounded-field border bg-surface p-3.5 text-base text-ink transition-colors',
        'placeholder:text-ink-subtle',
        hasError ? 'border-danger' : 'border-line-strong hover:border-navy-300',
        className
      )}
      {...props}
    />
  )
}

export function Hint({ className, ...props }: ComponentProps<'p'>) {
  return <p className={cn('text-sm text-ink-muted', className)} {...props} />
}
