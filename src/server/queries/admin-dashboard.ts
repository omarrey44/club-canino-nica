import 'server-only'

import { prisma } from '@/lib/prisma'
import { clubDayRange } from '@/lib/datetime'

export type AdminDashboardStats = {
  petsPresent: number
  daycare: number
  boarding: number
  pendingCheckIns: number
  pendingCheckOuts: number
  pendingReports: number
  totalReservations: number
}

/**
 * KPIs de la portada del panel, acotados a la organizacion del usuario.
 *
 * Todas las consultas van en un solo `$transaction` para que los numeros de la
 * pantalla correspondan al mismo instante.
 */
export async function getAdminDashboardStats(
  organizationId: string
): Promise<AdminDashboardStats> {
  const { start, end } = clubDayRange()
  const inOrg = { reservation: { organizationId } }

  const [
    present,
    byKind,
    pendingCheckIns,
    pendingCheckOuts,
    staysToday,
    reportsToday,
    totalReservations,
  ] =
    await prisma.$transaction([
      prisma.stay.count({ where: { ...inOrg, status: { in: ['ACTIVE', 'READY_FOR_PICKUP'] } } }),

      prisma.stay.findMany({
        where: { ...inOrg, status: { in: ['ACTIVE', 'READY_FOR_PICKUP'] } },
        select: { reservation: { select: { service: { select: { kind: true } } } } },
      }),

      prisma.reservation.count({
        where: {
          organizationId,
          status: 'CONFIRMED',
          startAt: { gte: start, lt: end },
        },
      }),

      prisma.stay.count({
        where: {
          ...inOrg,
          status: { in: ['ACTIVE', 'READY_FOR_PICKUP'] },
          expectedCheckOutAt: { gte: start, lt: end },
        },
      }),

      prisma.stay.findMany({
        where: { ...inOrg, checkInAt: { gte: start, lt: end } },
        select: { id: true },
      }),

      prisma.dailyReport.findMany({
        where: { reportDate: { gte: start, lt: end }, stay: inOrg },
        select: { stayId: true },
      }),

      prisma.reservation.count({
        where: { organizationId, startAt: { gte: start, lt: end } },
      }),
    ])

  const reported = new Set(reportsToday.map((report) => report.stayId))

  return {
    petsPresent: present,
    daycare: byKind.filter((stay) => stay.reservation.service.kind === 'DAYCARE').length,
    boarding: byKind.filter((stay) => stay.reservation.service.kind === 'BOARDING').length,
    pendingCheckIns,
    pendingCheckOuts,
    pendingReports: staysToday.filter((stay) => !reported.has(stay.id)).length,
    totalReservations,
  }
}

/** Últimos movimientos registrados por el equipo en las estancias del club. */
export async function getRecentAdminActivity(organizationId: string) {
  return prisma.petActivity.findMany({
    where: { stay: { reservation: { organizationId } } },
    orderBy: { occurredAt: 'desc' },
    take: 3,
    select: {
      id: true,
      type: true,
      occurredAt: true,
      description: true,
      stayId: true,
      pet: { select: { name: true } },
    },
  })
}

export type RecentAdminActivity = Awaited<ReturnType<typeof getRecentAdminActivity>>[number]
