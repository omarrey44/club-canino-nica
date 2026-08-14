/**
 * Cotizacion de una reservación.
 *
 * Puro y sin dependencias: lo usa el navegador para mostrar el total mientras
 * el cliente arma su reserva, y el servidor para calcularlo de verdad al
 * guardarla. El precio que llega del formulario NUNCA se guarda; se recalcula
 * aquí con los precios que estan en base de datos en ese momento.
 *
 * Todo el dinero se maneja en centavos enteros. Con decimales, 0.1 + 0.2 deja
 * de ser 0.3 y los totales empiezan a descuadrar por un centavo.
 */

import { clubDayIndex } from './datetime'

export type ServiceKindForPricing = 'DAYCARE' | 'BOARDING' | 'ADDON'

export type QuoteService = {
  id: string
  name: string
  kind: ServiceKindForPricing
  /** Precio en la moneda del negocio, tal como viene de la base (ej. "450.00"). */
  basePrice: string | number
}

export type QuoteExtra = {
  service: QuoteService
  quantity: number
}

export type QuoteLine = {
  label: string
  detail: string
  amountCents: number
}

export type Quote = {
  /** Unidades cobradas del servicio principal: días o noches. */
  units: number
  unitLabel: string
  lines: QuoteLine[]
  subtotalCents: number
  taxesCents: number
  totalCents: number
}

export function toCents(price: string | number): number {
  return Math.round(Number(price) * 100)
}

export function fromCents(cents: number): number {
  return cents / 100
}

/**
 * Unidades cobrables.
 *
 * Guardería se cobra por día calendario de asistencia: entrar y salir el mismo
 * dia es un día, no cero. Hospedaje se cobra por noche, que es como lo entiende
 * cualquiera que haya reservado un hotel: del lunes al miercoles son dos noches.
 *
 * Los días se cuentan en el calendario del club, no en UTC. Una jornada de
 * guardería de 8:00 a 18:00 en Managua cruza la medianoche UTC, y contarla en
 * UTC cobraria dos días por un solo dia de estancia.
 */
export function billableUnits(
  kind: ServiceKindForPricing,
  startAt: Date,
  endAt: Date
): { units: number; label: string } {
  const days = clubDayIndex(endAt) - clubDayIndex(startAt)

  if (kind === 'BOARDING') {
    const nights = Math.max(1, days)
    return { units: nights, label: nights === 1 ? 'noche' : 'noches' }
  }

  const attended = Math.max(1, days + 1)
  return { units: attended, label: attended === 1 ? 'día' : 'días' }
}

export function quote({
  service,
  extras = [],
  startAt,
  endAt,
  taxRate,
}: {
  service: QuoteService
  extras?: QuoteExtra[]
  startAt: Date
  endAt: Date
  taxRate: number
}): Quote {
  const { units, label } = billableUnits(service.kind, startAt, endAt)

  const baseCents = toCents(service.basePrice)
  const lines: QuoteLine[] = [
    {
      label: service.name,
      detail: `${units} ${label}`,
      amountCents: baseCents * units,
    },
  ]

  for (const extra of extras) {
    if (extra.quantity <= 0) continue
    const unitCents = toCents(extra.service.basePrice)
    lines.push({
      label: extra.service.name,
      detail: extra.quantity === 1 ? '1 servicio' : `${extra.quantity} servicios`,
      amountCents: unitCents * extra.quantity,
    })
  }

  const subtotalCents = lines.reduce((sum, line) => sum + line.amountCents, 0)
  // Se redondea una sola vez, sobre el subtotal, no linea por linea: redondear
  // en cada renglon acumula diferencias.
  const taxesCents = Math.round(subtotalCents * taxRate)

  return {
    units,
    unitLabel: label,
    lines,
    subtotalCents,
    taxesCents,
    totalCents: subtotalCents + taxesCents,
  }
}
