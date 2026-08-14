import type { Metadata } from 'next'

import { ResetPasswordForm } from './reset-form'

export const metadata: Metadata = { title: 'Nueva contraseña' }

export default function ResetPasswordPage() {
  return (
    <div className="space-y-5 2xl:space-y-6">
      <div className="space-y-2">
        <p className="text-xs font-extrabold tracking-[0.15em] text-brand-700 uppercase">Último paso</p>
        <h1 className="text-2xl leading-tight text-navy-900 sm:text-3xl">Crea una nueva contraseña</h1>
        <p className="leading-relaxed text-ink-muted">Elige una contraseña que no uses en otro sitio.</p>
      </div>

      <ResetPasswordForm />
    </div>
  )
}
