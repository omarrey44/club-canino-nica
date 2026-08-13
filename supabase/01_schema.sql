-- ---------------------------------------------------------------------------
-- Club Canino Nica — esquema completo (Fase 1)
--
-- Pegar en Supabase: Dashboard > SQL Editor > New query > Run.
-- Es el mismo SQL que prisma/migrations/0_init/migration.sql, generado desde
-- prisma/schema.prisma. Si se ejecuta a mano aqui, despues marcar la migracion
-- como aplicada para que Prisma no intente recrearla:
--
--   npx prisma migrate resolve --applied 0_init
--
-- Crea 19 tablas, 15 enums, llaves foraneas e indices. No toca el esquema auth.
-- ---------------------------------------------------------------------------
-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CLIENT', 'EMPLOYEE', 'ADMIN', 'VETERINARIAN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "PetSex" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "PetSize" AS ENUM ('SMALL', 'MEDIUM', 'LARGE', 'GIANT');

-- CreateEnum
CREATE TYPE "ServiceKind" AS ENUM ('DAYCARE', 'BOARDING', 'ADDON');

-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS', 'READY_FOR_PICKUP', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "StayStatus" AS ENUM ('ACTIVE', 'READY_FOR_PICKUP', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'REFUNDED', 'FAILED');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('CHECK_IN', 'FOOD', 'WATER', 'PLAY', 'WALK', 'REST', 'PHOTO', 'MEDICATION', 'GROOMING', 'NOTE', 'CHECK_OUT');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('RESERVATION_CONFIRMED', 'PAYMENT_CONFIRMED', 'CHECK_IN', 'NEW_ACTIVITY', 'NEW_PHOTO', 'NEW_REPORT', 'READY_FOR_PICKUP', 'RESERVATION_REMINDER', 'VACCINATION_DUE');

-- CreateEnum
CREATE TYPE "FoodIntake" AS ENUM ('ALL', 'MOST', 'HALF', 'LITTLE', 'NONE');

-- CreateEnum
CREATE TYPE "WaterIntake" AS ENUM ('LOW', 'NORMAL', 'HIGH');

-- CreateEnum
CREATE TYPE "EnergyLevel" AS ENUM ('LOW', 'NORMAL', 'HIGH');

-- CreateEnum
CREATE TYPE "Mood" AS ENUM ('HAPPY', 'CALM', 'TIRED', 'NERVOUS');

-- CreateEnum
CREATE TYPE "CameraStatus" AS ENUM ('ONLINE', 'OFFLINE', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "StreamProtocol" AS ENUM ('HLS', 'WEBRTC', 'MJPEG', 'DEMO');

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'America/Managua',
    "currency" TEXT NOT NULL DEFAULT 'NIO',
    "settings" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "authUserId" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "avatarUrl" TEXT,
    "role" "Role" NOT NULL DEFAULT 'CLIENT',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSeenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "isOnDuty" BOOLEAN NOT NULL DEFAULT false,
    "hiredAt" TIMESTAMP(3),

    CONSTRAINT "employee_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pets" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "breed" TEXT,
    "sex" "PetSex" NOT NULL,
    "size" "PetSize" NOT NULL DEFAULT 'MEDIUM',
    "birthDate" DATE,
    "weightKg" DECIMAL(5,2),
    "colorMarks" TEXT,
    "temperament" TEXT,
    "photoUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pet_medical_info" (
    "id" TEXT NOT NULL,
    "petId" TEXT NOT NULL,
    "allergies" TEXT,
    "medications" TEXT,
    "medicalConditions" TEXT,
    "dietNotes" TEXT,
    "feedingSchedule" TEXT,
    "isSterilized" BOOLEAN NOT NULL DEFAULT false,
    "vetName" TEXT,
    "vetPhone" TEXT,
    "vetClinic" TEXT,
    "specialNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pet_medical_info_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pet_vaccinations" (
    "id" TEXT NOT NULL,
    "petId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "appliedAt" DATE NOT NULL,
    "expiresAt" DATE,
    "documentUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pet_vaccinations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emergency_contacts" (
    "id" TEXT NOT NULL,
    "petId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "relationship" TEXT,
    "phone" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "emergency_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "kind" "ServiceKind" NOT NULL,
    "basePrice" DECIMAL(10,2) NOT NULL,
    "priceUnit" TEXT NOT NULL DEFAULT 'DAY',
    "durationMinutes" INTEGER,
    "dailyCapacity" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservations" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "petId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "status" "ReservationStatus" NOT NULL DEFAULT 'PENDING',
    "subtotal" DECIMAL(10,2) NOT NULL,
    "taxes" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NIO',
    "clientNotes" TEXT,
    "staffNotes" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "cancellationReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservation_extras" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reservation_extras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stays" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "petId" TEXT NOT NULL,
    "status" "StayStatus" NOT NULL DEFAULT 'ACTIVE',
    "checkInAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expectedCheckOutAt" TIMESTAMP(3) NOT NULL,
    "checkOutAt" TIMESTAMP(3),
    "checkedInById" TEXT,
    "checkedOutById" TEXT,
    "currentLocation" TEXT,
    "checkInNotes" TEXT,
    "checkOutNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stays_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pet_activities" (
    "id" TEXT NOT NULL,
    "stayId" TEXT NOT NULL,
    "petId" TEXT NOT NULL,
    "type" "ActivityType" NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT,
    "photoUrl" TEXT,
    "isVisibleToOwner" BOOLEAN NOT NULL DEFAULT true,
    "recordedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pet_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pet_photos" (
    "id" TEXT NOT NULL,
    "stayId" TEXT NOT NULL,
    "petId" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "takenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pet_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_reports" (
    "id" TEXT NOT NULL,
    "stayId" TEXT NOT NULL,
    "reportDate" DATE NOT NULL,
    "foodIntake" "FoodIntake" NOT NULL,
    "waterIntake" "WaterIntake" NOT NULL,
    "energy" "EnergyLevel" NOT NULL,
    "mood" "Mood" NOT NULL,
    "walkCount" INTEGER NOT NULL DEFAULT 0,
    "restMinutes" INTEGER NOT NULL DEFAULT 0,
    "activitiesSummary" TEXT,
    "caregiverNotes" TEXT,
    "authorId" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cameras" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "description" TEXT,
    "provider" TEXT NOT NULL DEFAULT 'demo',
    "providerRef" TEXT NOT NULL,
    "protocol" "StreamProtocol" NOT NULL DEFAULT 'DEMO',
    "status" "CameraStatus" NOT NULL DEFAULT 'OFFLINE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cameras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "camera_access" (
    "id" TEXT NOT NULL,
    "cameraId" TEXT NOT NULL,
    "stayId" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "camera_access_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'stripe',
    "providerRef" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NIO',
    "paidAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "petId" TEXT,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "linkUrl" TEXT,
    "readAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "changes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "users_authUserId_key" ON "users"("authUserId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_organizationId_role_idx" ON "users"("organizationId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "employee_profiles_userId_key" ON "employee_profiles"("userId");

-- CreateIndex
CREATE INDEX "pets_organizationId_isActive_idx" ON "pets"("organizationId", "isActive");

-- CreateIndex
CREATE INDEX "pets_ownerId_idx" ON "pets"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "pet_medical_info_petId_key" ON "pet_medical_info"("petId");

-- CreateIndex
CREATE INDEX "pet_vaccinations_petId_expiresAt_idx" ON "pet_vaccinations"("petId", "expiresAt");

-- CreateIndex
CREATE INDEX "emergency_contacts_petId_idx" ON "emergency_contacts"("petId");

-- CreateIndex
CREATE INDEX "services_organizationId_isActive_idx" ON "services"("organizationId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "services_organizationId_slug_key" ON "services"("organizationId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "reservations_code_key" ON "reservations"("code");

-- CreateIndex
CREATE INDEX "reservations_organizationId_startAt_idx" ON "reservations"("organizationId", "startAt");

-- CreateIndex
CREATE INDEX "reservations_organizationId_status_idx" ON "reservations"("organizationId", "status");

-- CreateIndex
CREATE INDEX "reservations_clientId_startAt_idx" ON "reservations"("clientId", "startAt");

-- CreateIndex
CREATE INDEX "reservations_petId_startAt_idx" ON "reservations"("petId", "startAt");

-- CreateIndex
CREATE INDEX "reservation_extras_reservationId_idx" ON "reservation_extras"("reservationId");

-- CreateIndex
CREATE UNIQUE INDEX "stays_reservationId_key" ON "stays"("reservationId");

-- CreateIndex
CREATE INDEX "stays_petId_checkInAt_idx" ON "stays"("petId", "checkInAt");

-- CreateIndex
CREATE INDEX "stays_status_checkInAt_idx" ON "stays"("status", "checkInAt");

-- CreateIndex
CREATE INDEX "pet_activities_stayId_occurredAt_idx" ON "pet_activities"("stayId", "occurredAt");

-- CreateIndex
CREATE INDEX "pet_activities_petId_occurredAt_idx" ON "pet_activities"("petId", "occurredAt");

-- CreateIndex
CREATE INDEX "pet_photos_stayId_takenAt_idx" ON "pet_photos"("stayId", "takenAt");

-- CreateIndex
CREATE INDEX "pet_photos_petId_takenAt_idx" ON "pet_photos"("petId", "takenAt");

-- CreateIndex
CREATE INDEX "daily_reports_publishedAt_idx" ON "daily_reports"("publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "daily_reports_stayId_reportDate_key" ON "daily_reports"("stayId", "reportDate");

-- CreateIndex
CREATE INDEX "cameras_organizationId_isActive_idx" ON "cameras"("organizationId", "isActive");

-- CreateIndex
CREATE INDEX "camera_access_stayId_idx" ON "camera_access"("stayId");

-- CreateIndex
CREATE UNIQUE INDEX "camera_access_cameraId_stayId_key" ON "camera_access"("cameraId", "stayId");

-- CreateIndex
CREATE UNIQUE INDEX "payments_reservationId_key" ON "payments"("reservationId");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE INDEX "payments_providerRef_idx" ON "payments"("providerRef");

-- CreateIndex
CREATE INDEX "notifications_userId_readAt_idx" ON "notifications"("userId", "readAt");

-- CreateIndex
CREATE INDEX "notifications_userId_createdAt_idx" ON "notifications"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_organizationId_createdAt_idx" ON "audit_logs"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_profiles" ADD CONSTRAINT "employee_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pets" ADD CONSTRAINT "pets_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pets" ADD CONSTRAINT "pets_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pet_medical_info" ADD CONSTRAINT "pet_medical_info_petId_fkey" FOREIGN KEY ("petId") REFERENCES "pets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pet_vaccinations" ADD CONSTRAINT "pet_vaccinations_petId_fkey" FOREIGN KEY ("petId") REFERENCES "pets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergency_contacts" ADD CONSTRAINT "emergency_contacts_petId_fkey" FOREIGN KEY ("petId") REFERENCES "pets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_petId_fkey" FOREIGN KEY ("petId") REFERENCES "pets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation_extras" ADD CONSTRAINT "reservation_extras_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation_extras" ADD CONSTRAINT "reservation_extras_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stays" ADD CONSTRAINT "stays_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stays" ADD CONSTRAINT "stays_petId_fkey" FOREIGN KEY ("petId") REFERENCES "pets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stays" ADD CONSTRAINT "stays_checkedInById_fkey" FOREIGN KEY ("checkedInById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stays" ADD CONSTRAINT "stays_checkedOutById_fkey" FOREIGN KEY ("checkedOutById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pet_activities" ADD CONSTRAINT "pet_activities_stayId_fkey" FOREIGN KEY ("stayId") REFERENCES "stays"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pet_activities" ADD CONSTRAINT "pet_activities_petId_fkey" FOREIGN KEY ("petId") REFERENCES "pets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pet_activities" ADD CONSTRAINT "pet_activities_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pet_photos" ADD CONSTRAINT "pet_photos_stayId_fkey" FOREIGN KEY ("stayId") REFERENCES "stays"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pet_photos" ADD CONSTRAINT "pet_photos_petId_fkey" FOREIGN KEY ("petId") REFERENCES "pets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pet_photos" ADD CONSTRAINT "pet_photos_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_reports" ADD CONSTRAINT "daily_reports_stayId_fkey" FOREIGN KEY ("stayId") REFERENCES "stays"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_reports" ADD CONSTRAINT "daily_reports_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cameras" ADD CONSTRAINT "cameras_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "camera_access" ADD CONSTRAINT "camera_access_cameraId_fkey" FOREIGN KEY ("cameraId") REFERENCES "cameras"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "camera_access" ADD CONSTRAINT "camera_access_stayId_fkey" FOREIGN KEY ("stayId") REFERENCES "stays"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_petId_fkey" FOREIGN KEY ("petId") REFERENCES "pets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

