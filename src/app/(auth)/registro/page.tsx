import Link from 'next/link'
import type { Metadata } from 'next'

import { RegisterForm } from './register-form'

export const metadata: Metadata = { title: 'Crear cuenta' }

export default function RegisterPage() {
  return (
    <div className="space-y-5 2xl:space-y-6">
      <div className="space-y-2">
        <p className="text-xs font-extrabold tracking-[0.15em] text-navy-500 uppercase">Empecemos</p>
        <h1 className="text-2xl leading-tight text-navy-900 sm:text-3xl">Crea tu cuenta</h1>
        <p className="leading-relaxed text-ink-muted">
          Registra a tu mascota y reserva su lugar en unos minutos.
        </p>
      </div>

      <RegisterForm />

      <p className="border-t border-line pt-4 text-center text-sm text-ink-muted">
        ¿Ya tienes cuenta?{' '}
        <Link href="/login" className="inline-flex min-h-11 items-center font-bold text-brand-700 underline-offset-4 hover:underline">
          Iniciar sesión
        </Link>
      </p>
    </div>
  )
}
