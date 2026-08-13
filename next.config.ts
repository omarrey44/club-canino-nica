import type { NextConfig } from 'next'

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Placeholders de mascotas mientras no existan fotos reales.
      { protocol: 'https', hostname: 'images.unsplash.com' },
      ...(supabaseHost
        ? ([{ protocol: 'https', hostname: supabaseHost, pathname: '/storage/v1/object/**' }] as const)
        : []),
    ],
  },
  typedRoutes: true,
}

export default nextConfig
