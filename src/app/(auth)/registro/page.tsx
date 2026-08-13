import Link from 'next/link'
import type { Metadata } from 'next'

import { RegisterForm } from './register-form'

export const metadata: Metadata = { title: 'Crear cuenta' }

export default function RegisterPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold text-navy-800">Crea tu cuenta</h1>
        <p className="text-ink-muted">
          Registra a tu mascota y reserva su lugar en unos minutos.
        </p>
      </div>

      <RegisterForm />

      <p className="text-center text-sm text-ink-muted">
        Ya tienes cuenta?{' '}
        <Link href="/login" className="font-semibold text-brand-600 hover:underline">
          Iniciar sesion
        </Link>
      </p>
    </div>
  )
}
