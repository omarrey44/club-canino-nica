import Link from 'next/link'
import type { Metadata } from 'next'

import { Alert } from '@/components/ui/alert'
import { LoginForm } from './login-form'

export const metadata: Metadata = { title: 'Iniciar sesion' }

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
    <div className="space-y-7">
      <div className="space-y-2">
        <p className="text-xs font-extrabold tracking-[0.15em] text-brand-600 uppercase">
          Bienvenido de vuelta
        </p>
        <h1 className="text-3xl leading-tight text-navy-900 sm:text-[2rem]">Qué gusto verte</h1>
        <p className="leading-relaxed text-ink-muted">
          Entra para ver cómo está tu mascota y lo que ha hecho hoy.
        </p>
      </div>

      {error && linkErrors[error] && <Alert tone="warning">{linkErrors[error]}</Alert>}

      <LoginForm redirectTo={redirectTo} />

      <p className="border-t border-line pt-5 text-center text-sm text-ink-muted">
        ¿Primera vez aquí?{' '}
        <Link href="/registro" className="font-bold text-brand-700 underline-offset-4 hover:underline">
          Crear cuenta
        </Link>
      </p>
    </div>
  )
}
