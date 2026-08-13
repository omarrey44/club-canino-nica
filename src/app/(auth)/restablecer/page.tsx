import type { Metadata } from 'next'

import { ResetPasswordForm } from './reset-form'

export const metadata: Metadata = { title: 'Nueva contrasena' }

export default function ResetPasswordPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold text-navy-800">Crea una nueva contrasena</h1>
        <p className="text-ink-muted">Elige una contrasena que no uses en otro sitio.</p>
      </div>

      <ResetPasswordForm />
    </div>
  )
}
