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
    background_color: '#FFFAF5',
    theme_color: '#F97316',
    lang: 'es-NI',
    icons: [
      { src: business.appIconUrl, sizes: '512x512', type: 'image/png', purpose: 'any' },
      {
        src: business.maskableIconUrl,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
