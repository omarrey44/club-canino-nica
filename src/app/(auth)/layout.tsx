import Image from 'next/image'
import Link from 'next/link'
import { BellRing, Clock3, PawPrint, ShieldCheck } from 'lucide-react'

import { business } from '@/config/business'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative grid min-h-dvh overflow-hidden bg-canvas-warm lg:grid-cols-[minmax(0,1fr)_minmax(31rem,0.9fr)]">
      <div className="pointer-events-none absolute -top-24 -left-24 size-64 rounded-full border-[3rem] border-brand-100/50 lg:hidden" aria-hidden />

      <main
        id="main-content"
        className="relative z-10 flex min-h-dvh items-start justify-center px-4 py-6 sm:items-center sm:px-8 sm:py-10 lg:px-12"
      >
        <div className="w-full max-w-md">
          <Link href="/login" className="inline-flex items-center gap-3 rounded-field">
            <Image
              src="/brand/icon.svg"
              width={44}
              height={44}
              alt=""
              className="size-11 rounded-[0.8rem] shadow-[0_8px_20px_rgb(249_115_22_/_0.18)]"
              priority
            />
            <span>
              <span className="block font-display text-lg leading-tight text-navy-900">
                {business.shortName}
              </span>
              <span className="block text-[0.68rem] font-extrabold tracking-[0.13em] text-brand-600 uppercase">
                Portal familiar
              </span>
            </span>
          </Link>

          <div className="mt-6 rounded-[1.65rem] border border-white bg-white/95 p-5 shadow-overlay ring-1 ring-navy-900/5 backdrop-blur sm:mt-8 sm:p-8">
            {children}
          </div>

        </div>
      </main>

      <aside className="relative hidden min-h-dvh overflow-hidden bg-navy-900 p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
        <div className="pointer-events-none absolute -top-28 -right-28 size-80 rounded-full border-[4rem] border-brand-500/15" aria-hidden />
        <PawPrint
          className="pointer-events-none absolute top-[18%] right-[12%] size-56 rotate-12 text-white/[0.035]"
          aria-hidden
        />
        <div className="pointer-events-none absolute right-[12%] bottom-[14%] size-40 rounded-full bg-brand-500/10 blur-3xl" aria-hidden />

        <div className="relative inline-flex w-fit items-center gap-2 rounded-pill border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-bold text-navy-100">
          <span className="size-2 rounded-full bg-success ring-4 ring-success/15" aria-hidden />
          Acompañamiento en cada estancia
        </div>

        <div className="relative max-w-xl py-10">
          <p className="text-xs font-extrabold tracking-[0.18em] text-brand-300 uppercase">
            Más cerca, incluso cuando no estás
          </p>
          <h2 className="mt-5 max-w-lg text-4xl leading-[1.12] text-white xl:text-5xl">
            Su día en el club, siempre cerca de ti.
          </h2>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-navy-200">
            Sigue sus actividades, fotos y reservas desde un solo lugar pensado para tu tranquilidad.
          </p>

          <ul className="mt-9 grid max-w-lg gap-3 sm:grid-cols-3" aria-label="Beneficios del portal">
            {[
              { icon: BellRing, label: 'Avisos al momento' },
              { icon: Clock3, label: 'Actividad del día' },
              { icon: ShieldCheck, label: 'Cuidado confiable' },
            ].map(({ icon: Icon, label }) => (
              <li key={label} className="rounded-card border border-white/10 bg-white/[0.06] p-4">
                <Icon className="size-5 text-brand-300" aria-hidden />
                <span className="mt-3 block text-sm font-bold leading-snug text-white">{label}</span>
              </li>
            ))}
          </ul>
        </div>

        <blockquote className="relative max-w-lg border-l-2 border-brand-400 pl-5">
          <p className="text-base leading-relaxed text-navy-100">
            “Saber que está feliz cambia por completo la experiencia de dejarlo al cuidado del club.”
          </p>
          <footer className="mt-3 text-sm font-bold text-brand-300">{business.tagline}</footer>
        </blockquote>
      </aside>
    </div>
  )
}
