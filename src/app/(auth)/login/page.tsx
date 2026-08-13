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
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold text-navy-800">Hola de nuevo</h1>
        <p className="text-ink-muted">Entra para ver como esta tu mascota.</p>
      </div>

      {error && linkErrors[error] && <Alert tone="warning">{linkErrors[error]}</Alert>}

      <LoginForm redirectTo={redirectTo} />

      <p className="text-center text-sm text-ink-muted">
        Primera vez aqui?{' '}
        <Link href="/registro" className="font-semibold text-brand-600 hover:underline">
          Crear cuenta
        </Link>
      </p>
    </div>
  )
}
