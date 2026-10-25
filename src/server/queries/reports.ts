import 'server-only'

import { prisma } from '@/lib/prisma'
import { clubDayRange } from '@/lib/datetime'
import { activityTypeLabels } from '@/lib/constants/labels'
import { isStaff, type SessionUser } from '@/server/auth/session'
import type { ActivityType } from '@/generated/prisma/client'

/**
 * Estancias del dia que todavia no tienen reporte.
 *
 * Cuenta tanto las que siguen abiertas como las que ya cerraron: un reporte se
 * escribe normalmente al final del dia, con la mascota ya en casa.
 */
export async function getPendingReports(organizationId: string) {
  const { start, end } = clubDayRange()

  const stays = await prisma.stay.findMany({
    where: {
      reservation: { organizationId },
      checkInAt: { gte: start, lt: end },
      reports: { none: { reportDate: { gte: start, lt: end } } },
    },
    orderBy: { checkInAt: 'asc' },
    select: {
      id: true,
      status: true,
      checkInAt: true,
      checkOutAt: true,
      pet: { select: { id: true, name: true, photoUrl: true } },
      reservation: { select: { client: { select: { fullName: true } } } },
      _count: { select: { activities: true, photos: true } },
    },
  })

  return stays
}

export type PendingReport = Awaited<ReturnType<typeof getPendingReports>>[number]

/** Reportes ya escritos hoy, para que el equipo vea lo que lleva avanzado. */
export async function getTodayReports(organizationId: string) {
  const { start, end } = clubDayRange()

  return prisma.dailyReport.findMany({
    where: { reportDate: { gte: start, lt: end }, stay: { reservation: { organizationId } } },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      stayId: true,
      updatedAt: true,
      publishedAt: true,
      stay: { select: { pet: { select: { name: true, photoUrl: true } } } },
      author: { select: { fullName: true } },
    },
  })
}

/**
 * Datos para armar el reporte de una estancia.
 *
 * Devuelve tambien el resumen de lo ya registrado durante el dia: el cuidador
 * no deberia volver a capturar informacion que la plataforma ya tiene.
 */
export async function getReportContext(stayId: string, organizationId: string) {
  const { start, end } = clubDayRange()

  const stay = await prisma.stay.findFirst({
    where: { id: stayId, reservation: { organizationId } },
    select: {
      id: true,
      status: true,
      checkInAt: true,
      checkOutAt: true,
      expectedCheckOutAt: true,
      pet: { select: { id: true, name: true, photoUrl: true, breed: true } },
      reservation: {
        select: {
          code: true,
          service: { select: { name: true } },
          client: { select: { fullName: true } },
        },
      },
      activities: {
        orderBy: { occurredAt: 'asc' },
        select: { id: true, type: true, occurredAt: true, description: true },
      },
      photos: {
        orderBy: { takenAt: 'asc' },
        select: { id: true, url: true, caption: true, takenAt: true, isFeatured: true },
      },
      reports: {
        where: { reportDate: { gte: start, lt: end } },
        take: 1,
      },
    },
  })

  if (!stay) return null

  const counts = stay.activities.reduce<Partial<Record<ActivityType, number>>>(
    (acc, activity) => {
      acc[activity.type] = (acc[activity.type] ?? 0) + 1
      return acc
    },
    {}
  )

  return {
    stay,
    existing: stay.reports[0] ?? null,
    counts,
    /** Sugerencias tomadas de lo registrado, para precargar el formulario. */
    suggestions: {
      walkCount: counts.WALK ?? 0,
      // Cada descanso registrado cuenta como media hora aproximada. Es una
      // estimacion para arrancar, no un dato medido: el cuidador la corrige.
      restMinutes: (counts.REST ?? 0) * 30,
      activitiesSummary: buildSummary(counts),
    },
  }
}

export type ReportContext = NonNullable<Awaited<ReturnType<typeof getReportContext>>>

function buildSummary(counts: Partial<Record<ActivityType, number>>): string {
  const parts = (['FOOD', 'WALK', 'PLAY', 'REST', 'WATER'] as const)
    .filter((type) => (counts[type] ?? 0) > 0)
    .map((type) => {
      const n = counts[type]!
      return `${n} ${activityTypeLabels[type].toLowerCase()}${n > 1 ? 's' : ''}`
    })

  return parts.length ? `Durante el día: ${parts.join(', ')}.` : ''
}

/** El reporte que ve el propietario. Solo se devuelve si esta publicado. */
export async function getPublishedReport(stayId: string, user: SessionUser) {
  return prisma.dailyReport.findFirst({
    where: {
      stayId,
      publishedAt: { not: null },
      stay: isStaff(user.role)
        ? { reservation: { organizationId: user.organizationId } }
        : { pet: { ownerId: user.id } },
    },
    orderBy: { reportDate: 'desc' },
    include: { author: { select: { fullName: true } } },
  })
}
