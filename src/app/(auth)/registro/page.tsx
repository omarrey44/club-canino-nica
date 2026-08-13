import Link from 'next/link'
import type { Metadata } from 'next'

import { RegisterForm } from './register-form'

export const metadata: Metadata = { title: 'Crear cuenta' }

export default function RegisterPage() {
  return (
    <div className="space-y-7">
      <div className="space-y-2">
        <p className="text-xs font-extrabold tracking-[0.15em] text-brand-600 uppercase">Empecemos</p>
        <h1 className="text-3xl leading-tight text-navy-900">Crea tu cuenta</h1>
        <p className="leading-relaxed text-ink-muted">
          Registra a tu mascota y reserva su lugar en unos minutos.
        </p>
      </div>

      <RegisterForm />

      <p className="border-t border-line pt-5 text-center text-sm text-ink-muted">
        ¿Ya tienes cuenta?{' '}
        <Link href="/login" className="font-bold text-brand-700 underline-offset-4 hover:underline">
          Iniciar sesión
        </Link>
      </p>
    </div>
  )
}
