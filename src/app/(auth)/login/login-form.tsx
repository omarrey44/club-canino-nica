'use client'

import Link from 'next/link'
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from 'lucide-react'
import { useActionState, useState } from 'react'

import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field, Input, Label } from '@/components/ui/field'
import { login } from '@/server/actions/auth'
import { idleState } from '@/server/actions/types'

export function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const [state, action, pending] = useActionState(login, idleState)
  const [showPassword, setShowPassword] = useState(false)
  // Controlado a proposito: React vacia los campos libres al terminar la accion,
  // incluso cuando vuelve con error, y obligaria a reescribir el correo.
  const [email, setEmail] = useState('')

  return (
    <form action={action} className="space-y-4 2xl:space-y-5" noValidate>
      {redirectTo && <input type="hidden" name="redirectTo" value={redirectTo} />}

      {state.status === 'error' && state.message && (
        <Alert tone="danger">{state.message}</Alert>
      )}

      <Field errors={state.fieldErrors?.email} className="gap-1.5">
        <Label className="text-[0.95rem]">Correo electrónico</Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-navy-800" aria-hidden />
          <Input
            name="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            inputMode="email"
            placeholder="tu@correo.com"
            className="h-13 bg-white pl-12"
            required
          />
        </div>
      </Field>

      <Field errors={state.fieldErrors?.password} className="gap-1.5">
        <div className="flex items-baseline justify-between">
          <Label className="text-[0.95rem]">Contraseña</Label>
          <Link
            href="/recuperar"
            className="inline-flex min-h-11 items-center text-sm font-bold text-brand-700 underline-offset-4 transition-colors hover:text-brand-800 hover:underline"
          >
            Olvidé mi contraseña
          </Link>
        </div>
        <div className="relative">
          <LockKeyhole className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-navy-800" aria-hidden />
          <Input
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            className="h-13 bg-white pr-12 pl-12"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((visible) => !visible)}
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            aria-pressed={showPassword}
            className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-field text-navy-700 transition-colors hover:bg-navy-50 hover:text-navy-900"
          >
            {showPassword ? <EyeOff className="size-5" aria-hidden /> : <Eye className="size-5" aria-hidden />}
          </button>
        </div>
      </Field>

      <Button
        type="submit"
        size="lg"
        block
        loading={pending}
        loadingLabel="Entrando"
        className="h-13 text-base"
      >
        Entrar
        <ArrowRight aria-hidden />
      </Button>

      <p className="flex items-center justify-center gap-2 text-xs font-semibold text-ink-muted">
        <ShieldCheck className="size-4 text-success" aria-hidden />
        Acceso privado y protegido
      </p>
    </form>
  )
}
