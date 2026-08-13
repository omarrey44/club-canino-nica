-- ---------------------------------------------------------------------------
-- Club Canino Nica — Row Level Security
--
-- Ejecutar DESPUES de 01_schema.sql. Es idempotente y no depende de si al correr
-- el schema elegiste "Run and enable RLS" o "Run without RLS": deja todas las
-- tablas de `public` con RLS activo en cualquier caso.
--
-- QUE HACE ESTO
-- RLS activo y SIN politicas = la API publica de Supabase (anon key, PostgREST)
-- no devuelve ninguna fila. Es justo lo que queremos: los datos de las mascotas
-- solo se alcanzan a traves del backend de la aplicacion.
--
-- POR QUE LA APP SIGUE FUNCIONANDO
-- Prisma se conecta con el rol `postgres`, que es el dueno de estas tablas, y el
-- dueno ignora RLS mientras no se use FORCE ROW LEVEL SECURITY. No se usa aqui,
-- a proposito.
--
-- CUANDO HABRIA QUE ESCRIBIR POLITICAS
-- Solo si algun dia el navegador consulta Supabase directamente (PostgREST o
-- Realtime). Hoy no lo hace: el control de acceso vive en la aplicacion
-- (src/server/auth/session.ts y cada Server Action), donde esta la logica que
-- decide quien ve que: propietario -> mascota -> estancia -> camara.
-- ---------------------------------------------------------------------------

DO $$
DECLARE
  tabla record;
BEGIN
  FOR tabla IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      -- La tabla de control de Prisma Migrate no es parte del dominio.
      AND tablename <> '_prisma_migrations'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tabla.tablename);
  END LOOP;
END $$;


-- Verificacion: todas las filas deben mostrar rowsecurity = true.
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
