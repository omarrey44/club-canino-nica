import Link from 'next/link'
import type { Metadata } from 'next'

import { ForgotPasswordForm } from './forgot-form'

export const metadata: Metadata = { title: 'Recuperar contraseña' }

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-5 2xl:space-y-6">
      <div className="space-y-2">
        <p className="text-xs font-extrabold tracking-[0.15em] text-navy-500 uppercase">Recupera tu acceso</p>
        <h1 className="text-2xl leading-tight text-navy-900 sm:text-3xl">¿Olvidaste tu contraseña?</h1>
        <p className="leading-relaxed text-ink-muted">
          Escribe tu correo y te enviamos un enlace para crear una nueva.
        </p>
      </div>

      <ForgotPasswordForm />

      <p className="border-t border-line pt-4 text-center text-sm text-ink-muted">
        <Link href="/login" className="inline-flex min-h-11 items-center font-bold text-brand-700 underline-offset-4 hover:underline">
          Volver a iniciar sesión
        </Link>
      </p>
    </div>
  )
}
