/**
 * Seed de demostracion — Club Canino Nica
 *
 * Crea un dia completo y navegable: una clienta (Camila) con su perro (Rocky)
 * en estancia activa, con actividades, fotos, reporte y notificaciones, mas un
 * administrador y un colaborador para el panel.
 *
 * Es idempotente: se puede volver a ejecutar sin duplicar filas.
 *
 * TODOS los precios, horarios y textos aqui son DEMO. No son datos oficiales
 * del negocio.
 *
 *   npm run db:seed
 *
 * Con `--solo-base` crea solo la organizacion y la cuenta del dueno: el punto
 * de partida de una instalacion real, sin clientes ni mascotas inventados.
 *
 *   npm run db:seed:base
 */

// `prisma db seed` ya carga el .env; esto cubre `db:seed:base`, que corre sin Prisma.
import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { createClient } from '@supabase/supabase-js'

import { PrismaClient, type Role } from '../src/generated/prisma/client'

// El seed escribe por conexion directa: el pooler no conviene para cargas DDL/bulk.
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL }),
})

const ORG_SLUG = 'club-canino-nica'

/**
 * Sin valor por defecto a proposito: el repositorio es publico y una clave
 * escrita aqui seria la clave real de las cuentas demo de quien lo despliegue.
 */
const DEMO_PASSWORD = requireEnv('SEED_DEMO_PASSWORD')

/**
 * Segundo administrador, el del dueno de la instalacion. Se toma del entorno
 * para no dejar un correo personal en un repositorio publico; si no esta
 * definido, el seed sigue sin el.
 */
const OWNER_EMAIL = process.env.SEED_OWNER_EMAIL?.trim()
const OWNER_NAME = process.env.SEED_OWNER_NAME?.trim() || 'Administrador'

const BASE_ONLY = process.argv.includes('--solo-base')

const supabaseAdmin = createClient(
  requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
  requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
  { auth: { autoRefreshToken: false, persistSession: false } }
)

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Falta ${name}. Copia .env.example a .env y rellenalo.`)
  return value
}

/** Hora de hoy en el club (UTC-6, Nicaragua no usa horario de verano). */
function todayAt(hours: number, minutes = 0): Date {
  const now = new Date()
  const local = new Date(now.getTime() - 6 * 3_600_000)
  return new Date(
    Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate(), hours + 6, minutes)
  )
}

function daysAgo(days: number, hours = 8): Date {
  return new Date(todayAt(hours).getTime() - days * 86_400_000)
}

/**
 * Crea (o reutiliza) el usuario en Supabase Auth y devuelve su UUID.
 * `email_confirm: true` evita el paso de confirmacion en las cuentas demo.
 */
async function ensureAuthUser(email: string, fullName: string): Promise<string> {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  })

  if (!error && data.user) return data.user.id

  const alreadyExists = error?.message.toLowerCase().includes('already')
  if (!alreadyExists) throw error

  // Ya existia de una corrida anterior: buscarlo por correo.
  const { data: list, error: listError } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  })
  if (listError) throw listError

  const existing = list.users.find((user) => user.email?.toLowerCase() === email.toLowerCase())
  if (!existing) throw new Error(`No se pudo resolver el usuario existente ${email}.`)

  return existing.id
}

async function upsertUser(input: {
  organizationId: string
  email: string
  fullName: string
  phone?: string
  role: Role
}) {
  const authUserId = await ensureAuthUser(input.email, input.fullName)

  return prisma.user.upsert({
    where: { email: input.email },
    create: {
      authUserId,
      organizationId: input.organizationId,
      email: input.email,
      fullName: input.fullName,
      phone: input.phone,
      role: input.role,
    },
    update: { authUserId, fullName: input.fullName, phone: input.phone, role: input.role },
  })
}

async function main() {
  if (BASE_ONLY && !OWNER_EMAIL) {
    // Sin dueno, una base vacia no tiene a nadie que pueda entrar al panel.
    throw new Error('--solo-base necesita SEED_OWNER_EMAIL en el .env.')
  }

  console.log(BASE_ONLY ? 'Sembrando la base minima...\n' : 'Sembrando datos demo...\n')

  // --- Organizacion ---------------------------------------------------------
  const org = await prisma.organization.upsert({
    where: { slug: ORG_SLUG },
    create: {
      slug: ORG_SLUG,
      name: 'Club Canino Nica',
      timezone: 'America/Managua',
      currency: 'NIO',
      settings: { tagline: 'Cuidamos a tu mejor amigo, y te mantenemos al tanto.' },
    },
    update: {},
  })

  if (BASE_ONLY) {
    await upsertUser({
      organizationId: org.id,
      email: OWNER_EMAIL!,
      fullName: OWNER_NAME,
      role: 'ADMIN',
    })
    console.log(`Listo. Administrador ${OWNER_EMAIL} (contrasena: la de SEED_DEMO_PASSWORD).`)
    return
  }

  // --- Personas -------------------------------------------------------------
  const admin = await upsertUser({
    organizationId: org.id,
    email: 'admin@clubcaninonica.com',
    fullName: 'Dirección Club Canino',
    phone: '+505 0000 0001',
    role: 'ADMIN',
  })

  if (OWNER_EMAIL) {
    await upsertUser({
      organizationId: org.id,
      email: OWNER_EMAIL,
      fullName: OWNER_NAME,
      role: 'ADMIN',
    })
  }

  const employee = await upsertUser({
    organizationId: org.id,
    email: 'cuidador@clubcaninonica.com',
    fullName: 'Jose Miranda',
    phone: '+505 0000 0002',
    role: 'EMPLOYEE',
  })

  await prisma.employeeProfile.upsert({
    where: { userId: employee.id },
    create: { userId: employee.id, position: 'Cuidador principal', isOnDuty: true },
    update: { isOnDuty: true },
  })

  const camila = await upsertUser({
    organizationId: org.id,
    email: 'camila@correo.com',
    fullName: 'Camila Ruiz',
    phone: '+505 0000 0003',
    role: 'CLIENT',
  })

  // --- Catalogo de servicios (precios DEMO) ---------------------------------
  const serviceSeed = [
    {
      slug: 'guarderia-dia',
      name: 'Guardería de día',
      description: 'Cuidado, juego y descanso durante la jornada.',
      kind: 'DAYCARE' as const,
      basePrice: '450.00',
      priceUnit: 'DAY',
      dailyCapacity: 25,
      sortOrder: 1,
    },
    {
      slug: 'hospedaje',
      name: 'Hospedaje',
      description: 'Estancia con pernocta, alimentación y rutina supervisada.',
      kind: 'BOARDING' as const,
      basePrice: '750.00',
      priceUnit: 'DAY',
      dailyCapacity: 15,
      sortOrder: 2,
    },
    {
      slug: 'bano',
      name: 'Baño',
      description: 'Baño completo con secado.',
      kind: 'ADDON' as const,
      basePrice: '250.00',
      priceUnit: 'UNIT',
      sortOrder: 3,
    },
    {
      slug: 'paseo-adicional',
      name: 'Paseo adicional',
      description: 'Un paseo extra fuera de la rutina del día.',
      kind: 'ADDON' as const,
      basePrice: '150.00',
      priceUnit: 'UNIT',
      sortOrder: 4,
    },
  ]

  const services = new Map<string, string>()
  for (const service of serviceSeed) {
    const row = await prisma.service.upsert({
      where: { organizationId_slug: { organizationId: org.id, slug: service.slug } },
      create: { ...service, organizationId: org.id },
      update: { ...service },
    })
    services.set(service.slug, row.id)
  }

  // --- Mascota --------------------------------------------------------------
  const existingRocky = await prisma.pet.findFirst({
    where: { ownerId: camila.id, name: 'Rocky' },
  })

  const rocky =
    existingRocky ??
    (await prisma.pet.create({
      data: {
        organizationId: org.id,
        ownerId: camila.id,
        name: 'Rocky',
        breed: 'Labrador retriever',
        sex: 'MALE',
        size: 'LARGE',
        birthDate: new Date('2022-03-14'),
        weightKg: '29.40',
        colorMarks: 'Dorado con mancha blanca en el pecho',
        temperament: 'Sociable, se lleva bien con perros grandes',
        photoUrl:
          'https://images.unsplash.com/photo-1552053831-71594a27632d?w=800&q=80&auto=format&fit=crop',
      },
    }))

  await prisma.petMedicalInfo.upsert({
    where: { petId: rocky.id },
    create: {
      petId: rocky.id,
      allergies: 'Pollo',
      medications: 'Ninguno',
      dietNotes: 'Croqueta de cordero, dos tazas por comida.',
      feedingSchedule: '9:00 AM y 4:00 PM',
      isSterilized: true,
      vetName: 'Dra. Sofia Lopez (DEMO)',
      vetPhone: '+505 0000 0004',
      vetClinic: 'Clínica veterinaria DEMO',
      specialNotes: 'Se pone nervioso con truenos. Buscar espacio techado.',
    },
    update: {},
  })

  const vaccinations = [
    { name: 'Rabia', appliedAt: new Date('2026-02-10'), expiresAt: new Date('2027-02-10') },
    // Vence pronto a proposito: dispara la advertencia de vacuna por vencer.
    { name: 'Parvovirus', appliedAt: new Date('2025-09-01'), expiresAt: new Date('2026-09-01') },
  ]
  for (const vaccination of vaccinations) {
    const exists = await prisma.petVaccination.findFirst({
      where: { petId: rocky.id, name: vaccination.name },
    })
    if (!exists) {
      await prisma.petVaccination.create({ data: { petId: rocky.id, ...vaccination } })
    }
  }

  const contactExists = await prisma.emergencyContact.findFirst({ where: { petId: rocky.id } })
  if (!contactExists) {
    await prisma.emergencyContact.create({
      data: {
        petId: rocky.id,
        name: 'Andres Ruiz',
        relationship: 'Hermano de Camila',
        phone: '+505 0000 0005',
        isPrimary: true,
      },
    })
  }

  // --- Camaras --------------------------------------------------------------
  const cameraSeed = [
    { name: 'Área de juegos', area: 'Patio principal', providerRef: 'demo-play-area' },
    { name: 'Zona de descanso', area: 'Interior climatizado', providerRef: 'demo-rest-area' },
  ]

  const cameras: string[] = []
  for (const camera of cameraSeed) {
    const existing = await prisma.camera.findFirst({
      where: { organizationId: org.id, providerRef: camera.providerRef },
    })
    const row =
      existing ??
      (await prisma.camera.create({
        data: {
          ...camera,
          organizationId: org.id,
          description: 'Transmisión de demostración. No es una cámara real.',
          provider: 'demo',
          protocol: 'DEMO',
          status: 'ONLINE',
        },
      }))
    cameras.push(row.id)
  }

  // --- Estancia de hoy (Rocky en el club ahora mismo) ------------------------
  const todayReservation = await prisma.reservation.upsert({
    where: { code: 'CCN-1001' },
    create: {
      code: 'CCN-1001',
      organizationId: org.id,
      clientId: camila.id,
      petId: rocky.id,
      serviceId: services.get('guarderia-dia')!,
      startAt: todayAt(8),
      endAt: todayAt(18),
      status: 'IN_PROGRESS',
      subtotal: '450.00',
      taxes: '67.50',
      total: '517.50',
      clientNotes: 'Rocky llega con su cobija.',
    },
    update: { status: 'IN_PROGRESS', startAt: todayAt(8), endAt: todayAt(18) },
  })

  await prisma.payment.upsert({
    where: { reservationId: todayReservation.id },
    create: {
      reservationId: todayReservation.id,
      provider: 'demo',
      providerRef: 'demo_pi_1001',
      status: 'PAID',
      amount: '517.50',
      paidAt: daysAgo(1, 19),
    },
    update: {},
  })

  const stay = await prisma.stay.upsert({
    where: { reservationId: todayReservation.id },
    create: {
      reservationId: todayReservation.id,
      petId: rocky.id,
      status: 'ACTIVE',
      checkInAt: todayAt(8, 3),
      expectedCheckOutAt: todayAt(18),
      checkedInById: employee.id,
      currentLocation: 'Área de juegos',
      checkInNotes: 'Llegó tranquilo, con correa y cobija.',
    },
    update: { status: 'ACTIVE', currentLocation: 'Área de juegos' },
  })

  for (const cameraId of cameras) {
    await prisma.cameraAccess.upsert({
      where: { cameraId_stayId: { cameraId, stayId: stay.id } },
      create: { cameraId, stayId: stay.id, expiresAt: todayAt(18, 30) },
      update: { revokedAt: null, expiresAt: todayAt(18, 30) },
    })
  }

  const activities = [
    { type: 'CHECK_IN' as const, at: todayAt(8, 3), text: 'Rocky llegó a Club Canino.' },
    { type: 'FOOD' as const, at: todayAt(9, 5), text: 'Desayuno completo. Comió todo.' },
    { type: 'PLAY' as const, at: todayAt(10, 20), text: 'Juego grupal en el patio.' },
    { type: 'PHOTO' as const, at: todayAt(10, 35), text: 'Nueva fotografía del día.' },
    { type: 'WATER' as const, at: todayAt(11, 10), text: 'Hidratación normal.' },
    { type: 'REST' as const, at: todayAt(12, 20), text: 'Siesta en la zona techada.' },
    { type: 'WALK' as const, at: todayAt(14, 10), text: 'Paseo por el sendero.' },
    { type: 'NOTE' as const, at: todayAt(16, 0), text: 'Todo marcha muy bien con Rocky.' },
  ]

  if ((await prisma.petActivity.count({ where: { stayId: stay.id } })) === 0) {
    await prisma.petActivity.createMany({
      data: activities.map((activity) => ({
        stayId: stay.id,
        petId: rocky.id,
        type: activity.type,
        occurredAt: activity.at,
        description: activity.text,
        recordedById: employee.id,
      })),
    })
  }

  if ((await prisma.petPhoto.count({ where: { stayId: stay.id } })) === 0) {
    await prisma.petPhoto.createMany({
      data: [
        {
          stayId: stay.id,
          petId: rocky.id,
          storageKey: 'demo/rocky-juego.jpg',
          url: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=1200&q=80&auto=format&fit=crop',
          caption: 'Rocky corriendo en el área de juegos.',
          takenAt: todayAt(10, 35),
          isFeatured: true,
          uploadedById: employee.id,
        },
        {
          stayId: stay.id,
          petId: rocky.id,
          storageKey: 'demo/rocky-descanso.jpg',
          url: 'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=1200&q=80&auto=format&fit=crop',
          caption: 'Momento de descanso después del juego.',
          takenAt: todayAt(12, 25),
          uploadedById: employee.id,
        },
      ],
    })
  }

  // --- Estancias anteriores (para el historial) -----------------------------
  const history = [
    { code: 'CCN-0980', service: 'guarderia-dia', days: 3, total: '517.50' },
    { code: 'CCN-0964', service: 'hospedaje', days: 10, total: '2587.50' },
  ]

  for (const item of history) {
    const reservation = await prisma.reservation.upsert({
      where: { code: item.code },
      create: {
        code: item.code,
        organizationId: org.id,
        clientId: camila.id,
        petId: rocky.id,
        serviceId: services.get(item.service)!,
        startAt: daysAgo(item.days, 8),
        endAt: daysAgo(item.days, 18),
        status: 'COMPLETED',
        subtotal: '450.00',
        taxes: '67.50',
        total: item.total,
      },
      update: {},
    })

    // Toda reservacion nace con su fila de pago, igual que las que crea la app.
    await prisma.payment.upsert({
      where: { reservationId: reservation.id },
      create: {
        reservationId: reservation.id,
        provider: 'demo',
        providerRef: `demo_pi_${item.code.replace('CCN-', '')}`,
        status: 'PAID',
        amount: item.total,
        paidAt: daysAgo(item.days + 1, 19),
      },
      update: {},
    })

    const pastStay = await prisma.stay.upsert({
      where: { reservationId: reservation.id },
      create: {
        reservationId: reservation.id,
        petId: rocky.id,
        status: 'COMPLETED',
        checkInAt: daysAgo(item.days, 8),
        expectedCheckOutAt: daysAgo(item.days, 18),
        checkOutAt: daysAgo(item.days, 18),
        checkedInById: employee.id,
        checkedOutById: employee.id,
      },
      update: {},
    })

    const reportDate = daysAgo(item.days, 12)
    await prisma.dailyReport.upsert({
      where: { stayId_reportDate: { stayId: pastStay.id, reportDate } },
      create: {
        stayId: pastStay.id,
        reportDate,
        foodIntake: 'ALL',
        waterIntake: 'NORMAL',
        energy: 'HIGH',
        mood: 'HAPPY',
        walkCount: 2,
        restMinutes: 90,
        activitiesSummary: 'Juego grupal, dos paseos y descanso en zona techada.',
        caregiverNotes: 'Rocky tuvo un día excelente. Comió todo y jugó sin problemas.',
        authorId: employee.id,
        publishedAt: daysAgo(item.days, 18),
      },
      update: {},
    })
  }

  // --- Reservacion futura ---------------------------------------------------
  const upcoming = await prisma.reservation.upsert({
    where: { code: 'CCN-1042' },
    create: {
      code: 'CCN-1042',
      organizationId: org.id,
      clientId: camila.id,
      petId: rocky.id,
      serviceId: services.get('hospedaje')!,
      startAt: new Date(todayAt(8).getTime() + 5 * 86_400_000),
      endAt: new Date(todayAt(17).getTime() + 8 * 86_400_000),
      status: 'CONFIRMED',
      // 3 noches de hospedaje a 750, mas 15% de impuesto.
      subtotal: '2250.00',
      taxes: '337.50',
      total: '2587.50',
    },
    update: {},
  })

  await prisma.payment.upsert({
    where: { reservationId: upcoming.id },
    create: {
      reservationId: upcoming.id,
      provider: 'demo',
      status: 'PENDING',
      amount: '2587.50',
    },
    update: {},
  })

  // --- Notificaciones -------------------------------------------------------
  if ((await prisma.notification.count({ where: { userId: camila.id } })) === 0) {
    await prisma.notification.createMany({
      data: [
        {
          organizationId: org.id,
          userId: camila.id,
          petId: rocky.id,
          type: 'CHECK_IN',
          title: 'Rocky ya está en el club',
          body: 'Rocky acaba de ingresar a Club Canino.',
          linkUrl: '/mi-mascota',
          createdAt: todayAt(8, 4),
        },
        {
          organizationId: org.id,
          userId: camila.id,
          petId: rocky.id,
          type: 'NEW_ACTIVITY',
          title: 'Rocky terminó su comida',
          body: 'Desayuno completo. Comió todo.',
          linkUrl: '/mi-mascota',
          createdAt: todayAt(9, 6),
        },
        {
          organizationId: org.id,
          userId: camila.id,
          petId: rocky.id,
          type: 'NEW_PHOTO',
          title: 'Tenemos una nueva foto de Rocky',
          body: 'Rocky corriendo en el área de juegos.',
          linkUrl: '/mi-mascota',
          createdAt: todayAt(10, 36),
        },
      ],
    })
  }

  await prisma.auditLog.create({
    data: {
      organizationId: org.id,
      actorId: admin.id,
      action: 'SEED_RUN',
      entityType: 'Organization',
      entityId: org.id,
      changes: { note: 'Datos demo regenerados' },
    },
  })

  console.log('Listo. Cuentas demo (contrasena: la de SEED_DEMO_PASSWORD):')
  console.log('  Cliente       camila@correo.com')
  console.log('  Colaborador   cuidador@clubcaninonica.com')
  console.log('  Administrador admin@clubcaninonica.com')
  if (OWNER_EMAIL) console.log(`  Administrador ${OWNER_EMAIL}`)
}

main()
  .catch((error) => {
    console.error('El seed fallo:', error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
