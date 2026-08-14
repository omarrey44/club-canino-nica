/**
 * Configuración de negocio centralizada.
 *
 * Regla: ningun componente escribe "Club Canino Nica" ni un teléfono ni un precio
 * directamente. Todo pasa por aquí. Cuando la plataforma se venda a otra guardería,
 * esto se lee de `Organization.settings` en base de datos y este archivo queda
 * solo como valores por defecto.
 *
 * IMPORTANTE: los campos marcados DEMO no son datos oficiales de Club Canino Nica.
 * Todavía no estan definidos por el negocio. Ver README > "Datos pendientes".
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
    address: 'Direccion pendiente de confirmar, Managua, Nicaragua',
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
      'Politica de cancelación pendiente de definir. Este texto es de demostracion.',
  },
} as const

export type Business = typeof business

/** Bandera global: hay datos de negocio sin confirmar visibles en la UI. */
export const hasDemoBusinessData =
  business.contact.isDemo || business.hours.isDemo || business.billing.isDemo

export function formatCurrency(amount: number | string): string {
  const value = typeof amount === 'string' ? Number(amount) : amount
  return new Intl.NumberFormat(business.locale, {
    style: 'currency',
    currency: business.currency,
    minimumFractionDigits: 2,
  }).format(value)
}
