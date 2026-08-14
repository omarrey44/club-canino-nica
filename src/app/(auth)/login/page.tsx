import Link from 'next/link'
import type { Metadata } from 'next'
import { ChevronRight, PawPrint } from 'lucide-react'

import { Alert } from '@/components/ui/alert'
import { LoginForm } from './login-form'

export const metadata: Metadata = { title: 'Iniciar sesión' }

const linkErrors: Record<string, string> = {
  'enlace-invalido': 'Ese enlace no es valido. Solicita uno nuevo.',
  'enlace-expirado': 'El enlace expiro. Solicita uno nuevo.',
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string; error?: string }>
}) {
  const { redirectTo, error } = await searchParams

  return (
    <div className="space-y-5 2xl:space-y-6">
      <div className="space-y-2">
        <p className="text-xs font-extrabold tracking-[0.16em] text-brand-700 uppercase">
          Bienvenido de vuelta
        </p>
        <h1 className="font-sans text-[2rem] leading-[1.05] font-extrabold tracking-[-0.035em] text-navy-900 lg:text-[2.25rem] 2xl:text-[2.4rem]">
          Qué gusto verte
        </h1>
        <p className="text-base leading-normal text-ink-muted">
          Entra para ver cómo está tu mascota y lo que ha hecho hoy.
        </p>
      </div>

      {error && linkErrors[error] && <Alert tone="warning">{linkErrors[error]}</Alert>}

      <LoginForm redirectTo={redirectTo} />

      <div className="space-y-2">
        <div className="flex items-center gap-4" data-decorative-divider aria-hidden>
          <span className="h-px flex-1 bg-brand-100" />
          <PawPrint className="size-5 fill-brand-100 text-brand-100" />
          <span className="h-px flex-1 bg-brand-100" />
        </div>
        <p className="flex flex-wrap items-center justify-center gap-x-2 text-center text-sm text-ink-muted">
          <span>¿Primera vez aquí?</span>
          <Link
            href="/registro"
            className="inline-flex min-h-11 items-center gap-1 font-extrabold text-brand-700 underline-offset-4 transition-colors hover:text-brand-800 hover:underline"
          >
            Crear cuenta
            <ChevronRight className="size-4" aria-hidden />
          </Link>
        </p>
      </div>
    </div>
  )
}
