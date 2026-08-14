import type { Metadata } from 'next'

import { ResetPasswordForm } from './reset-form'

export const metadata: Metadata = { title: 'Nueva contrasena' }

export default function ResetPasswordPage() {
  return (
    <div className="space-y-7">
      <div className="space-y-2">
        <p className="text-xs font-extrabold tracking-[0.15em] text-brand-700 uppercase">Último paso</p>
        <h1 className="text-3xl leading-tight text-navy-900">Crea una nueva contraseña</h1>
        <p className="leading-relaxed text-ink-muted">Elige una contraseña que no uses en otro sitio.</p>
      </div>

      <ResetPasswordForm />
    </div>
  )
}
