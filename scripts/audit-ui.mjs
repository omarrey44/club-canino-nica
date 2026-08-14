/**
 * Auditoría de interfaz: responsive y accesibilidad.
 *
 * Recorre cada pantalla en los cinco anchos del pliego de requisitos y reporta
 * lo que se puede medir sin criterio humano:
 *
 *   - scroll horizontal accidental
 *   - áreas táctiles por debajo de 44 px
 *   - violaciones de accesibilidad segun axe-core
 *
 * No arregla nada: solo mide. Es la lista de trabajo, no la prueba de que la
 * interfaz esta bien; el juicio visual sigue siendo humano.
 *
 *   npm run audit:ui            (con `npm run dev` corriendo)
 *   npm run audit:ui -- 375     limita a un ancho
 */
import 'dotenv/config'
import { readFileSync } from 'node:fs'

import { chromium } from 'playwright'
import { Client } from 'pg'

const BASE = 'http://localhost:3000'
const AXE = readFileSync('node_modules/axe-core/axe.min.js', 'utf8')

/** Los cinco anchos que pide el pliego. */
const WIDTHS = [375, 430, 768, 1024, 1440]
const soloAncho = process.argv[2] ? Number(process.argv[2]) : null
const anchos = soloAncho ? WIDTHS.filter((w) => w === soloAncho) : WIDTHS

// axe es lento: se corre en el ancho mas estrecho y el mas ancho, que es donde
// aparecen los problemas de contraste y de orden de foco.
const ANCHOS_AXE = new Set([375, 1440])

const db = new Client({ connectionString: process.env.DIRECT_URL })
await db.connect()
const { rows } = await db.query(
  `SELECT
     (SELECT id FROM pets WHERE name = 'Rocky' LIMIT 1) AS pet,
     (SELECT id FROM reservations WHERE code = 'CCN-1042') AS reserva,
     (SELECT s.id FROM stays s WHERE s.status = 'ACTIVE' LIMIT 1) AS estancia`
)
const { pet, reserva, estancia } = rows[0]
await db.end()

const RUTAS = [
  { path: '/login', quien: null },
  { path: '/registro', quien: null },

  { path: '/inicio', quien: 'cliente' },
  { path: '/mascotas', quien: 'cliente' },
  { path: '/mascotas/nueva', quien: 'cliente' },
  { path: `/mascotas/${pet}`, quien: 'cliente' },
  { path: `/mascotas/${pet}/editar`, quien: 'cliente' },
  { path: `/mascotas/${pet}/historial`, quien: 'cliente' },
  { path: '/mi-mascota', quien: 'cliente' },
  { path: '/camaras', quien: 'cliente' },
  { path: '/reservas', quien: 'cliente' },
  { path: '/reservas/nueva', quien: 'cliente' },
  { path: `/reservas/${reserva}`, quien: 'cliente' },
  { path: '/notificaciones', quien: 'cliente' },
  { path: '/perfil', quien: 'cliente' },

  { path: '/admin', quien: 'admin' },
  { path: '/admin/check-in', quien: 'admin' },
  { path: '/admin/reservaciones', quien: 'admin' },
  { path: '/admin/estancias', quien: 'admin' },
  { path: estancia ? `/admin/estancias/${estancia}` : null, quien: 'admin' },
  { path: '/admin/mascotas', quien: 'admin' },
  { path: '/admin/reportes', quien: 'admin' },
  { path: '/admin/camaras', quien: 'admin' },
  { path: '/admin/servicios', quien: 'admin' },
  { path: '/admin/pagos', quien: 'admin' },
  { path: '/admin/configuracion', quien: 'admin' },
].filter((r) => r.path)

const browser = await chromium.launch()

async function contextoPara(email) {
  const context = await browser.newContext()
  const page = await context.newPage()
  await page.goto(`${BASE}/login`)
  await page.getByRole('textbox', { name: 'Correo' }).fill(email)
  await page.getByRole('textbox', { name: 'Contraseña' }).fill(process.env.SEED_DEMO_PASSWORD)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 25000 })
  await page.close()
  return context
}

const contextos = {
  null: await browser.newContext(),
  cliente: await contextoPara('camila@correo.com'),
  admin: await contextoPara('admin@clubcaninonica.com'),
}

const hallazgos = []

for (const { path, quien } of RUTAS) {
  const page = await contextos[quien].newPage()

  for (const width of anchos) {
    await page.setViewportSize({ width, height: 900 })
    try {
      await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle', timeout: 45000 })
    } catch {
      hallazgos.push({ tipo: 'carga', path, width, detalle: 'la página no terminó de cargar' })
      continue
    }

    // --- Scroll horizontal --------------------------------------------------
    const desborde = await page.evaluate(() => {
      const doc = document.documentElement
      if (doc.scrollWidth <= doc.clientWidth + 1) return null

      // Buscar al culpable: el elemento que sobresale del viewport.
      const ancho = doc.clientWidth
      for (const el of document.querySelectorAll('body *')) {
        const r = el.getBoundingClientRect()
        if (r.width > 0 && r.right > ancho + 1) {
          const clases = typeof el.className === 'string' ? el.className.slice(0, 70) : ''
          return {
            total: doc.scrollWidth,
            viewport: ancho,
            culpable: `${el.tagName.toLowerCase()}${clases ? `.${clases.trim().split(/\s+/)[0]}` : ''}`,
          }
        }
      }
      return { total: doc.scrollWidth, viewport: ancho, culpable: '(no identificado)' }
    })

    if (desborde) {
      hallazgos.push({
        tipo: 'desborde',
        path,
        width,
        detalle: `${desborde.total}px de contenido en ${desborde.viewport}px · ${desborde.culpable}`,
      })
    }

    // --- Áreas táctiles ------------------------------------------------------
    if (width <= 430) {
      const pequenos = await page.evaluate(() => {
        const resultado = []
        for (const el of document.querySelectorAll('a, button, input[type=checkbox], input[type=radio], select')) {
          if (el.closest('.sr-only') || el.classList.contains('sr-only')) continue
          const r = el.getBoundingClientRect()
          if (r.width === 0 || r.height === 0) continue

          // Un control pequeño dentro de una etiqueta grande ya es tocable:
          // el area real es la de la etiqueta, no la del input.
          const etiqueta = el.closest('label')
          if (etiqueta && etiqueta.getBoundingClientRect().height >= 44) continue

          if (r.height < 44 || r.width < 24) {
            resultado.push(
              `${el.tagName.toLowerCase()} "${(el.textContent ?? '').trim().slice(0, 26)}" ${Math.round(r.width)}x${Math.round(r.height)}`
            )
          }
        }
        return resultado.slice(0, 5)
      })

      for (const detalle of pequenos) {
        hallazgos.push({ tipo: 'tactil', path, width, detalle })
      }
    }

    // --- Accesibilidad -------------------------------------------------------
    if (ANCHOS_AXE.has(width)) {
      await page.addScriptTag({ content: AXE })
      const resultado = await page.evaluate(async () => {
        // @ts-expect-error axe se inyecta en runtime
        const r = await window.axe.run(document, {
          runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
        })
        return r.violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          help: v.help,
          nodes: v.nodes.length,
          ejemplo: v.nodes[0]?.html?.slice(0, 90) ?? '',
        }))
      })

      for (const v of resultado) {
        hallazgos.push({
          tipo: `a11y:${v.impact}`,
          path,
          width,
          detalle: `${v.id} · ${v.help} (${v.nodes}) · ${v.ejemplo}`,
        })
      }
    }
  }

  await page.close()
}

await browser.close()

// --- Reporte ------------------------------------------------------------------

if (hallazgos.length === 0) {
  console.log('Auditoría de interfaz: sin hallazgos.')
} else {
  const porTipo = new Map()
  for (const h of hallazgos) {
    porTipo.set(h.tipo, [...(porTipo.get(h.tipo) ?? []), h])
  }

  console.log(`\n${hallazgos.length} hallazgos en ${RUTAS.length} pantallas × ${anchos.length} anchos\n`)

  for (const [tipo, lista] of [...porTipo.entries()].sort()) {
    console.log(`--- ${tipo} (${lista.length}) ---`)
    // Se agrupa por detalle: el mismo problema en veinte pantallas es un solo
    // arreglo, no veinte.
    const porDetalle = new Map()
    for (const h of lista) {
      const clave = h.detalle.split(' · ').slice(0, 2).join(' · ')
      porDetalle.set(clave, [...(porDetalle.get(clave) ?? []), `${h.path}@${h.width}`])
    }
    for (const [detalle, donde] of porDetalle) {
      console.log(`  ${detalle}`)
      console.log(`     ${donde.slice(0, 4).join(', ')}${donde.length > 4 ? ` y ${donde.length - 4} más` : ''}`)
    }
    console.log()
  }
}
