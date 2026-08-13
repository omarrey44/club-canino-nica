import type { Metadata, Viewport } from 'next'
import { Nunito_Sans, Varela_Round } from 'next/font/google'

import { business } from '@/config/business'
import './globals.css'

const nunito = Nunito_Sans({
  subsets: ['latin'],
  variable: '--font-nunito',
  display: 'swap',
})

const varela = Varela_Round({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-varela',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: `${business.name} — Guardería canina`,
    template: `%s · ${business.shortName}`,
  },
  description: business.tagline,
  applicationName: business.name,
  appleWebApp: { capable: true, title: business.shortName, statusBarStyle: 'default' },
  formatDetection: { telephone: false },
  // El area privada no debe indexarse.
  robots: { index: false, follow: false },
}

export const viewport: Viewport = {
  themeColor: '#F97316',
  width: 'device-width',
  initialScale: 1,
  // Sin maximumScale: bloquear el zoom rompe la accesibilidad en movil.
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${nunito.variable} ${varela.variable}`}>
      <body className="antialiased">
        <a
          href="#main-content"
          className="fixed top-3 left-3 z-[100] -translate-y-20 rounded-field bg-navy-900 px-4 py-3 text-sm font-bold text-white shadow-overlay transition-transform focus:translate-y-0"
        >
          Saltar al contenido
        </a>
        {children}
      </body>
    </html>
  )
}
