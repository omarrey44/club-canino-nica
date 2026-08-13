import type { Metadata, Viewport } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'

import { business } from '@/config/business'
import './globals.css'

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: `${business.name} — Guarderia canina`,
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
  themeColor: '#FF7A00',
  width: 'device-width',
  initialScale: 1,
  // Sin maximumScale: bloquear el zoom rompe la accesibilidad en movil.
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={jakarta.variable}>
      <body className="antialiased">{children}</body>
    </html>
  )
}
