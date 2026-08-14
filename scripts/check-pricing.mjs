/**
 * Comprobacion del calculo de precios.
 *
 * Es la unica logica del producto donde un error se traduce directo en dinero
 * mal cobrado, asi que tiene su propia verificacion ejecutable.
 *
 *   npm run check:pricing
 */
import assert from 'node:assert/strict'

import { billableUnits, quote, toCents } from '../src/lib/pricing.ts'

const daycare = { id: 's1', name: 'Guarderia de dia', kind: 'DAYCARE', basePrice: '450.00' }
const boarding = { id: 's2', name: 'Hospedaje', kind: 'BOARDING', basePrice: '750.00' }
const bath = { id: 's3', name: 'Bano', kind: 'ADDON', basePrice: '250.00' }

const at = (iso) => new Date(iso)

// --- Unidades cobrables ------------------------------------------------------

// Guarderia: entrar y salir el mismo dia es un dia, no cero.
assert.equal(billableUnits('DAYCARE', at('2026-08-13T14:00Z'), at('2026-08-14T00:00Z')).units, 1)
assert.equal(billableUnits('DAYCARE', at('2026-08-13T14:00Z'), at('2026-08-13T23:00Z')).units, 1)

// Guarderia en dias consecutivos cuenta cada dia de asistencia.
assert.equal(billableUnits('DAYCARE', at('2026-08-13T14:00Z'), at('2026-08-15T23:00Z')).units, 3)

// Hospedaje se cobra por noche: lunes a miercoles son dos noches.
assert.equal(billableUnits('BOARDING', at('2026-08-10T14:00Z'), at('2026-08-12T17:00Z')).units, 2)

// Hospedaje nunca cobra cero, aunque entre y salga el mismo dia.
assert.equal(billableUnits('BOARDING', at('2026-08-10T14:00Z'), at('2026-08-10T20:00Z')).units, 1)

// El singular y el plural se usan en la interfaz.
assert.equal(billableUnits('BOARDING', at('2026-08-10T14:00Z'), at('2026-08-11T17:00Z')).label, 'noche')
assert.equal(billableUnits('DAYCARE', at('2026-08-13T14:00Z'), at('2026-08-14T23:00Z')).label, 'días')

// --- Conversion a centavos ---------------------------------------------------

assert.equal(toCents('450.00'), 45000)
assert.equal(toCents('0.1'), 10)
// El caso que rompe los flotantes: 8.145 * 100 da 814.4999... en binario.
assert.equal(toCents('19.99'), 1999)

// --- Cotizacion --------------------------------------------------------------

const simple = quote({
  service: daycare,
  startAt: at('2026-08-13T14:00Z'),
  endAt: at('2026-08-14T00:00Z'),
  taxRate: 0.15,
})
assert.equal(simple.subtotalCents, 45000)
assert.equal(simple.taxesCents, 6750)
assert.equal(simple.totalCents, 51750)
assert.equal(simple.lines.length, 1)
assert.equal(simple.lines[0].detail, '1 día')

const conExtras = quote({
  service: boarding,
  extras: [{ service: bath, quantity: 2 }],
  startAt: at('2026-08-10T14:00Z'),
  endAt: at('2026-08-13T17:00Z'),
  taxRate: 0.15,
})
// 3 noches x 750 = 2250, mas 2 banos x 250 = 500. Subtotal 2750.
assert.equal(conExtras.subtotalCents, 275000)
assert.equal(conExtras.taxesCents, 41250)
assert.equal(conExtras.totalCents, 316250)
assert.equal(conExtras.lines.length, 2)

// Un adicional con cantidad cero no debe aparecer ni sumar.
const sinExtra = quote({
  service: daycare,
  extras: [{ service: bath, quantity: 0 }],
  startAt: at('2026-08-13T14:00Z'),
  endAt: at('2026-08-13T20:00Z'),
  taxRate: 0.15,
})
assert.equal(sinExtra.lines.length, 1)
assert.equal(sinExtra.totalCents, 51750)

// Sin impuesto configurado, el total es el subtotal.
const sinImpuesto = quote({
  service: daycare,
  startAt: at('2026-08-13T14:00Z'),
  endAt: at('2026-08-13T20:00Z'),
  taxRate: 0,
})
assert.equal(sinImpuesto.totalCents, sinImpuesto.subtotalCents)

// El impuesto se redondea una sola vez sobre el subtotal, no por renglon.
// 3 renglones de 33.33 con 15%: por renglon daria 3 x 500 = 1500 centavos;
// sobre el subtotal da 1500 tambien, pero con 33.31 la diferencia aparece.
const redondeo = quote({
  service: { id: 'x', name: 'X', kind: 'ADDON', basePrice: '33.31' },
  extras: [{ service: { id: 'y', name: 'Y', kind: 'ADDON', basePrice: '33.31' }, quantity: 2 }],
  startAt: at('2026-08-13T14:00Z'),
  endAt: at('2026-08-13T20:00Z'),
  taxRate: 0.15,
})
assert.equal(redondeo.subtotalCents, 9993)
assert.equal(redondeo.taxesCents, Math.round(9993 * 0.15))

console.log('Calculo de precios: todas las comprobaciones pasan.')
