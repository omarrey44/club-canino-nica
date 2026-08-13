import Link from 'next/link'
import type { Metadata } from 'next'

import { ForgotPasswordForm } from './forgot-form'

export const metadata: Metadata = { title: 'Recuperar contrasena' }

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold text-navy-800">Recuperar contrasena</h1>
        <p className="text-ink-muted">
          Escribe tu correo y te enviamos un enlace para crear una nueva.
        </p>
      </div>

      <ForgotPasswordForm />

      <p className="text-center text-sm text-ink-muted">
        <Link href="/login" className="font-semibold text-brand-600 hover:underline">
          Volver a iniciar sesion
        </Link>
      </p>
    </div>
  )
}
