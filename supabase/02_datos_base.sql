-- ---------------------------------------------------------------------------
-- Club Canino Nica — datos base
--
-- Ejecutar DESPUES de 01_schema.sql.
--
-- Contiene solo lo que no depende de usuarios: la organizacion, el catalogo de
-- servicios y las camaras demo. Con esto la aplicacion ya arranca y el panel
-- administrativo muestra sus KPIs en cero.
--
-- Los usuarios, mascotas, reservaciones y el dia completo de Rocky NO se pueden
-- sembrar por SQL: las cuentas deben crearse en Supabase Auth. Para eso, una vez
-- puestas las llaves en .env:
--
--   npm run db:seed
--
-- PRECIOS Y CUPOS SON DEMO. No son datos oficiales del negocio.
-- Es idempotente: se puede volver a ejecutar.
-- ---------------------------------------------------------------------------

-- Organizacion (raiz de tenant) --------------------------------------------
INSERT INTO "organizations" ("id", "slug", "name", "timezone", "currency", "settings", "createdAt", "updatedAt")
VALUES (
  'org_club_canino_nica',
  'club-canino-nica',
  'Club Canino Nica',
  'America/Managua',
  'NIO',
  '{"tagline":"Cuidamos a tu mejor amigo, y te mantenemos al tanto."}'::jsonb,
  now(),
  now()
)
ON CONFLICT ("slug") DO UPDATE
  SET "name" = EXCLUDED."name",
      "updatedAt" = now();


-- Catalogo de servicios (precios DEMO) --------------------------------------
INSERT INTO "services"
  ("id", "organizationId", "slug", "name", "description", "kind", "basePrice", "priceUnit", "dailyCapacity", "isActive", "sortOrder", "createdAt", "updatedAt")
VALUES
  ('svc_guarderia_dia', 'org_club_canino_nica', 'guarderia-dia', 'Guarderia de dia',
   'Cuidado, juego y descanso durante la jornada.', 'DAYCARE', 450.00, 'DAY', 25, true, 1, now(), now()),

  ('svc_hospedaje', 'org_club_canino_nica', 'hospedaje', 'Hospedaje',
   'Estancia con pernocta, alimentacion y rutina supervisada.', 'BOARDING', 750.00, 'DAY', 15, true, 2, now(), now()),

  ('svc_bano', 'org_club_canino_nica', 'bano', 'Bano',
   'Bano completo con secado.', 'ADDON', 250.00, 'UNIT', NULL, true, 3, now(), now()),

  ('svc_paseo_extra', 'org_club_canino_nica', 'paseo-adicional', 'Paseo adicional',
   'Un paseo extra fuera de la rutina del dia.', 'ADDON', 150.00, 'UNIT', NULL, true, 4, now(), now())
ON CONFLICT ("organizationId", "slug") DO UPDATE
  SET "name" = EXCLUDED."name",
      "description" = EXCLUDED."description",
      "basePrice" = EXCLUDED."basePrice",
      "dailyCapacity" = EXCLUDED."dailyCapacity",
      "updatedAt" = now();


-- Camaras demo ---------------------------------------------------------------
-- `providerRef` es un identificador opaco. Nunca se guardan credenciales aqui.
INSERT INTO "cameras"
  ("id", "organizationId", "name", "area", "description", "provider", "providerRef", "protocol", "status", "isActive", "createdAt", "updatedAt")
VALUES
  ('cam_area_juegos', 'org_club_canino_nica', 'Area de juegos', 'Patio principal',
   'Transmision de demostracion. No es una camara real.', 'demo', 'demo-play-area', 'DEMO', 'ONLINE', true, now(), now()),

  ('cam_zona_descanso', 'org_club_canino_nica', 'Zona de descanso', 'Interior climatizado',
   'Transmision de demostracion. No es una camara real.', 'demo', 'demo-rest-area', 'DEMO', 'ONLINE', true, now(), now())
ON CONFLICT ("id") DO UPDATE
  SET "name" = EXCLUDED."name",
      "area" = EXCLUDED."area",
      "updatedAt" = now();
