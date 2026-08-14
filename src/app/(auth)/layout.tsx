import Link from 'next/link'
import { BellRing, Clock3, PawPrint, ShieldCheck } from 'lucide-react'

import { BrandLogo } from '@/components/ui/brand-logo'
import { business } from '@/config/business'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative grid min-h-dvh overflow-x-clip bg-canvas-warm lg:grid-cols-[minmax(32rem,0.95fr)_minmax(31rem,1.05fr)]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden lg:hidden" aria-hidden>
        <PawPrint className="absolute top-4 -left-16 size-56 -rotate-12 fill-brand-100/55 text-transparent" />
        <PawPrint className="absolute right-[-4.5rem] bottom-32 size-48 rotate-12 fill-brand-100/50 text-transparent" />
        <div className="absolute -top-40 -right-32 size-72 rounded-full border-2 border-brand-200/55" />
        <div className="absolute -top-48 -right-40 size-80 rounded-full border-2 border-brand-200/45" />
        <div className="absolute right-14 bottom-20 size-24 rounded-full bg-brand-100/45 blur-2xl" />
      </div>

      <main
        id="main-content"
        className="relative z-10 flex min-h-dvh items-start justify-center overflow-hidden px-4 pt-8 pb-40 sm:px-8 sm:pt-10 sm:pb-44 lg:items-center lg:px-8 lg:py-12 xl:px-12"
      >
        <div className="pointer-events-none absolute inset-0 hidden lg:block" aria-hidden>
          <PawPrint className="absolute top-[8%] -left-14 size-64 -rotate-12 fill-brand-100/50 text-transparent" />
          <PawPrint className="absolute right-[-4rem] bottom-[8%] size-52 rotate-12 fill-brand-100/45 text-transparent" />
          <div className="absolute -top-40 -right-28 size-80 rounded-full border-2 border-brand-200/50" />
          <div className="absolute -top-48 -right-36 size-96 rounded-full border-2 border-brand-200/35" />
          <div className="absolute bottom-[18%] left-[8%] size-32 rounded-full bg-brand-100/60 blur-3xl" />
        </div>

        <div className="relative z-10 w-full max-w-md lg:max-w-[30rem]">
          <Link href="/login" className="mx-auto flex w-fit rounded-field" aria-label={business.name}>
            <BrandLogo
              decorative
              priority
              sizes="(max-width: 640px) 144px, (max-width: 1279px) 160px, 176px"
              className="w-36 drop-shadow-[0_12px_22px_rgb(13_38_57_/_0.14)] sm:w-40 lg:w-40 xl:w-44"
            />
          </Link>

          <div className="mt-6 rounded-[2rem] border border-white bg-white/95 px-6 py-8 shadow-overlay ring-1 ring-navy-900/5 backdrop-blur sm:px-8 sm:py-9 lg:mt-7 lg:rounded-[2.25rem] lg:p-10 lg:shadow-[0_30px_80px_rgb(13_38_57_/_0.16)]">
            {children}
          </div>

        </div>
      </main>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-32 lg:hidden" aria-hidden>
        <svg
          viewBox="0 0 864 180"
          preserveAspectRatio="none"
          className="size-full"
          focusable="false"
        >
          <path
            className="fill-brand-500"
            d="M0 35c131 35 201 104 350 111 129 6 202-44 333-28 71 8 132 30 181 48v14H0Z"
          />
          <path
            className="fill-navy-900"
            d="M0 103c137 12 238 72 374 63 90-6 149-35 247-27 91 7 165 26 243 41H0Z"
          />
          <path
            className="fill-navy-900"
            d="M759 153c7-24 9-43 15-45 7-2 7 20 8 38 7-27 13-48 20-46 7 3 1 27-2 48 13-23 25-38 31-32 6 6-6 23-17 39 17-13 35-21 39-13 3 8-17 17-34 24h-70c-16-7-34-17-30-24 4-7 22 0 40 11Z"
          />
        </svg>
      </div>

      <aside className="relative hidden min-h-dvh overflow-hidden border-l-4 border-brand-500 bg-navy-900 p-8 text-white lg:flex lg:flex-col lg:justify-between xl:p-12 2xl:p-16">
        <div className="pointer-events-none absolute -top-32 -right-32 size-96 rounded-full border-[4.5rem] border-brand-500/15" aria-hidden />
        <PawPrint
          className="pointer-events-none absolute top-[16%] right-[8%] size-72 rotate-12 text-white/[0.035]"
          aria-hidden
        />
        <div className="pointer-events-none absolute right-[8%] bottom-[12%] size-56 rounded-full bg-brand-500/10 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-44 -left-32 size-80 rounded-full border-[3.5rem] border-white/[0.035]" aria-hidden />

        <div className="relative inline-flex w-fit items-center gap-2 rounded-pill border border-white/10 bg-white/[0.07] px-4 py-2 text-sm font-bold text-navy-100 shadow-[0_10px_30px_rgb(0_0_0_/_0.1)]">
          <span className="size-2 rounded-full bg-success ring-4 ring-success/15" aria-hidden />
          Acompañamiento en cada estancia
        </div>

        <div className="relative max-w-2xl py-8 xl:py-10">
          <p className="text-xs font-extrabold tracking-[0.18em] text-brand-300 uppercase">
            Más cerca, incluso cuando no estás
          </p>
          <h2 className="mt-5 max-w-xl text-4xl leading-[1.08] text-white xl:text-5xl 2xl:text-[3.5rem]">
            Su día en el club, siempre cerca de ti.
          </h2>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-navy-200 xl:text-lg">
            Sigue sus actividades, fotos y reservas desde un solo lugar pensado para tu tranquilidad.
          </p>

          <section className="mt-8 max-w-2xl rounded-[1.75rem] border border-white/10 bg-white/[0.065] p-5 shadow-[0_24px_60px_rgb(0_0_0_/_0.14)] backdrop-blur-sm xl:p-6" aria-labelledby="portal-benefits-title">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-[0.9rem] bg-brand-500 text-white shadow-[0_8px_20px_rgb(249_115_22_/_0.25)]">
                  <PawPrint className="size-5" aria-hidden />
                </span>
                <div>
                  <h3 id="portal-benefits-title" className="font-sans text-base font-extrabold tracking-normal text-white">
                    Todo en un solo vistazo
                  </h3>
                  <p className="text-xs text-navy-200">Información clara y protegida</p>
                </div>
              </div>
              <span className="hidden rounded-pill border border-success/25 bg-success/10 px-3 py-1.5 text-xs font-bold text-[#7ce0a5] xl:inline-flex">
                Portal privado
              </span>
            </div>

            <ul className="mt-5 grid gap-3 sm:grid-cols-3" aria-label="Beneficios del portal">
              {[
                { icon: BellRing, label: 'Avisos al momento', detail: 'Novedades importantes' },
                { icon: Clock3, label: 'Actividad del día', detail: 'Su rutina organizada' },
                { icon: ShieldCheck, label: 'Cuidado confiable', detail: 'Acceso solo para ti' },
              ].map(({ icon: Icon, label, detail }) => (
                <li key={label} className="rounded-card border border-white/10 bg-navy-900/30 p-4">
                  <Icon className="size-5 text-brand-300" aria-hidden />
                  <span className="mt-3 block text-sm font-extrabold leading-snug text-white">{label}</span>
                  <span className="mt-1 hidden text-xs leading-relaxed text-navy-200 xl:block">{detail}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <blockquote className="relative max-w-xl border-l-2 border-brand-400 pl-5">
          <p className="text-sm leading-relaxed text-navy-100 xl:text-base">
            “Saber que está feliz cambia por completo la experiencia de dejarlo al cuidado del club.”
          </p>
          <footer className="mt-3 text-sm font-bold text-brand-300">{business.tagline}</footer>
        </blockquote>
      </aside>
    </div>
  )
}
