import { PawPrint } from 'lucide-react'

import { business } from '@/config/business'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_1.1fr]">
      <main className="flex flex-col justify-center bg-canvas-warm px-5 py-10 sm:px-10">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5">
            <span className="flex size-10 items-center justify-center rounded-field bg-brand-500 text-white">
              <PawPrint className="size-5" aria-hidden />
            </span>
            <span className="text-lg font-semibold text-navy-800">{business.name}</span>
          </div>
          {children}
        </div>
      </main>

      {/* Panel de marca: decorativo, oculto donde no aporta. */}
      <aside
        className="relative hidden flex-col justify-end bg-navy-800 p-12 lg:flex"
        aria-hidden
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(255,122,0,0.18),transparent_55%)]" />
        <blockquote className="relative max-w-md">
          <p className="text-2xl leading-snug font-medium text-white">
            Saber que tu perro esta bien no deberia depender de una llamada.
          </p>
          <footer className="mt-4 text-sm text-navy-200">
            {business.tagline}
          </footer>
        </blockquote>
      </aside>
    </div>
  )
}
