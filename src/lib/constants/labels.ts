/**
 * Etiquetas en espanol y tono visual para los enums de la base de datos.
 *
 * Los enums de Prisma son la fuente de verdad del estado; este archivo solo
 * los traduce. Nunca escribir un estado como string suelto en un componente.
 */

import type {
  ActivityType,
  EnergyLevel,
  FoodIntake,
  Mood,
  NotificationType,
  PaymentStatus,
  PetSex,
  PetSize,
  ReservationStatus,
  Role,
  StayStatus,
  WaterIntake,
} from '@/generated/prisma/client'

/** Tono visual compartido por badges, puntos de estado y bordes. */
export type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'brand'

export const roleLabels: Record<Role, string> = {
  CLIENT: 'Cliente',
  EMPLOYEE: 'Colaborador',
  ADMIN: 'Administrador',
  VETERINARIAN: 'Veterinario',
  SUPER_ADMIN: 'Super administrador',
}

export const reservationStatusLabels: Record<ReservationStatus, string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmada',
  CHECKED_IN: 'Ingresada',
  IN_PROGRESS: 'En estancia',
  READY_FOR_PICKUP: 'Lista para recoger',
  COMPLETED: 'Completada',
  CANCELLED: 'Cancelada',
}

export const reservationStatusTones: Record<ReservationStatus, Tone> = {
  PENDING: 'warning',
  CONFIRMED: 'info',
  CHECKED_IN: 'brand',
  IN_PROGRESS: 'brand',
  READY_FOR_PICKUP: 'success',
  COMPLETED: 'neutral',
  CANCELLED: 'danger',
}

export const stayStatusLabels: Record<StayStatus, string> = {
  ACTIVE: 'En estancia',
  READY_FOR_PICKUP: 'Lista para recoger',
  COMPLETED: 'Finalizada',
  CANCELLED: 'Cancelada',
}

export const stayStatusTones: Record<StayStatus, Tone> = {
  ACTIVE: 'success',
  READY_FOR_PICKUP: 'brand',
  COMPLETED: 'neutral',
  CANCELLED: 'danger',
}

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  PENDING: 'Pendiente',
  PAID: 'Pagado',
  REFUNDED: 'Reembolsado',
  FAILED: 'Fallido',
}

export const paymentStatusTones: Record<PaymentStatus, Tone> = {
  PENDING: 'warning',
  PAID: 'success',
  REFUNDED: 'info',
  FAILED: 'danger',
}

export const activityTypeLabels: Record<ActivityType, string> = {
  CHECK_IN: 'Check-in',
  FOOD: 'Alimentacion',
  WATER: 'Agua',
  PLAY: 'Juego',
  WALK: 'Paseo',
  REST: 'Descanso',
  PHOTO: 'Fotografia',
  MEDICATION: 'Medicamento',
  GROOMING: 'Estetica',
  NOTE: 'Observacion',
  CHECK_OUT: 'Salida',
}

export const petSexLabels: Record<PetSex, string> = {
  MALE: 'Macho',
  FEMALE: 'Hembra',
}

export const petSizeLabels: Record<PetSize, string> = {
  SMALL: 'Pequeno',
  MEDIUM: 'Mediano',
  LARGE: 'Grande',
  GIANT: 'Gigante',
}

export const foodIntakeLabels: Record<FoodIntake, string> = {
  ALL: 'Todo',
  MOST: 'Mayor parte',
  HALF: 'Mitad',
  LITTLE: 'Poco',
  NONE: 'Nada',
}

export const waterIntakeLabels: Record<WaterIntake, string> = {
  LOW: 'Baja',
  NORMAL: 'Normal',
  HIGH: 'Alta',
}

export const energyLabels: Record<EnergyLevel, string> = {
  LOW: 'Baja',
  NORMAL: 'Normal',
  HIGH: 'Alta',
}

export const moodLabels: Record<Mood, string> = {
  HAPPY: 'Feliz',
  CALM: 'Tranquilo',
  TIRED: 'Cansado',
  NERVOUS: 'Nervioso',
}

export const notificationTypeLabels: Record<NotificationType, string> = {
  RESERVATION_CONFIRMED: 'Reservacion confirmada',
  PAYMENT_CONFIRMED: 'Pago confirmado',
  CHECK_IN: 'Ingreso registrado',
  NEW_ACTIVITY: 'Nueva actividad',
  NEW_PHOTO: 'Nueva fotografia',
  NEW_REPORT: 'Reporte del dia',
  READY_FOR_PICKUP: 'Lista para recoger',
  RESERVATION_REMINDER: 'Recordatorio de reservacion',
  VACCINATION_DUE: 'Vacuna por vencer',
}

/** Estados de reservacion que el cliente ve bajo el filtro "proximas". */
export const upcomingReservationStatuses = ['PENDING', 'CONFIRMED'] as const

/** Estados en los que la mascota esta fisicamente en el club. */
export const activeReservationStatuses = [
  'CHECKED_IN',
  'IN_PROGRESS',
  'READY_FOR_PICKUP',
] as const
