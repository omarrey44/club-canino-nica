/**
 * Configuración de negocio centralizada.
 *
 * Regla: ningun componente escribe "Club Canino Nica" ni un teléfono ni un precio
 * directamente. Todo pasa por aquí.
 *
 * Contacto, horarios y cobros se editan en /admin/configuracion y viven en
 * `Organization.settings`; `getBusinessSettings()` los combina con estos
 * valores, que solo aplican mientras nadie los haya guardado (y salen como DEMO).
 */

export const business = {
  name: 'Club Canino Nica',
  shortName: 'Club Canino',
  tagline: 'Cuidamos a tu mejor amigo, y te mantenemos al tanto.',
  logoUrl: '/brand/logo-oficial.png',
  appIconUrl: '/brand/logo-oficial-app.png',
  maskableIconUrl: '/brand/logo-oficial-maskable.png',

  locale: 'es-NI',
  timezone: 'America/Managua',
  currency: 'NIO',
  currencySymbol: 'C$',

  /** DEMO — pendiente de confirmar con el negocio. */
  contact: {
    isDemo: true,
    phone: '+505 0000 0000',
    email: 'hola@clubcaninonica.com',
    address: 'Dirección pendiente de confirmar, Managua, Nicaragua',
    whatsapp: '+505 0000 0000',
  },

  /** DEMO — horarios de operacion aún no definidos oficialmente. */
  hours: {
    isDemo: true,
    daycareOpen: '07:00',
    daycareClose: '18:00',
    boardingCheckIn: '08:00',
    boardingCheckOut: '17:00',
  },

  /** DEMO — impuestos y politicas sin confirmar. */
  billing: {
    isDemo: true,
    taxRate: 0.15,
    taxLabel: 'IVA',
    cancellationPolicy:
      'Política de cancelación pendiente de definir. Este texto es de demostración.',
  },
} as const

export type Business = typeof business

export function formatCurrency(amount: number | string): string {
  const value = typeof amount === 'string' ? Number(amount) : amount
  return new Intl.NumberFormat(business.locale, {
    style: 'currency',
    currency: business.currency,
    minimumFractionDigits: 2,
  }).format(value)
}
