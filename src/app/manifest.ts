import type { MetadataRoute } from 'next'

import { business } from '@/config/business'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: business.name,
    short_name: business.shortName,
    description: business.tagline,
    start_url: '/inicio',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#FFF9F3',
    theme_color: '#FF7A00',
    lang: 'es-NI',
    // Icono provisional en SVG. Reemplazar por PNG 192/512 y maskable cuando
    // exista el logotipo definitivo de la marca.
    icons: [
      { src: '/brand/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: '/brand/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
    ],
  }
}
