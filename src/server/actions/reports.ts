'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { prisma } from '@/lib/prisma'
import { notify } from '@/server/notifications'
import { clubDayRange } from '@/lib/datetime'
import { recordAudit } from '@/server/audit'
import { requireStaff } from '@/server/auth/session'
import { dailyReportSchema } from '@/validations/report'
import { errorState, type ActionState } from './types'

/**
 * Guarda el reporte del dia y se lo publica al propietario.
 *
 * Un reporte por estancia y fecha: un hospedaje de tres noches lleva tres
 * reportes, uno por dia. Guardar de nuevo el mismo dia actualiza el existente
 * en vez de crear otro.
 */
export async function saveDailyReport(
  stayId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireStaff()

  const parsed = dailyReportSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return errorState('Revisa los datos del reporte.', parsed.error.flatten().fieldErrors)
  }

  const stay = await prisma.stay.findFirst({
    where: { id: stayId, reservation: { organizationId: user.organizationId } },
    select: {
      id: true,
      petId: true,
      pet: { select: { name: true } },
      reservation: { select: { clientId: true } },
    },
  })
  if (!stay) return errorState('No encontramos esa estancia.')

  const { start } = clubDayRange()

  const report = await prisma.dailyReport.upsert({
    where: { stayId_reportDate: { stayId: stay.id, reportDate: start } },
    create: {
      stayId: stay.id,
      reportDate: start,
      ...parsed.data,
      authorId: user.id,
      publishedAt: new Date(),
    },
    update: { ...parsed.data, authorId: user.id },
    select: { id: true, createdAt: true, updatedAt: true },
  })

  // El aviso solo sale la primera vez. Corregir una cifra no deberia volver a
  // sonarle el telefono al propietario.
  const isFirstPublish = report.createdAt.getTime() === report.updatedAt.getTime()
  if (isFirstPublish) {
    await notify({
        organizationId: user.organizationId,
        userId: stay.reservation.clientId,
        petId: stay.petId,
        type: 'NEW_REPORT',
        title: `El reporte de ${stay.pet.name} está listo`,
        body: `Ya puedes ver como le fue hoy a ${stay.pet.name}.`,
        linkUrl: '/mi-mascota',
      })
  }

  await recordAudit(user, {
    action: isFirstPublish ? 'REPORT_PUBLISHED' : 'REPORT_UPDATED',
    entityType: 'DailyReport',
    entityId: report.id,
    changes: { stayId: stay.id },
  })

  revalidatePath('/admin/reportes')
  revalidatePath(`/admin/estancias/${stay.id}`)
  revalidatePath('/mi-mascota')
  redirect('/admin/reportes?guardado=1')
}
