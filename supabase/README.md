# SQL para Supabase

Orden de ejecucion en **Dashboard › SQL Editor › New query › Run**:

| Archivo | Que hace |
|---|---|
| `01_schema.sql` | Crea 15 enums, 19 tablas, llaves foraneas e indices. No toca el esquema `auth`. |
| `02_datos_base.sql` | Organizacion, catalogo de servicios y camaras demo. Idempotente. |

Despues de ejecutar `01_schema.sql` a mano, marcar la migracion como aplicada
para que Prisma no intente recrearla:

```bash
npx prisma migrate resolve --applied 0_init
```

## Lo que no se puede sembrar por SQL

Los usuarios demo (Camila, el cuidador y el administrador) necesitan existir en
**Supabase Auth**, no solo en la tabla `users`. Igual pasa con todo lo que cuelga
de ellos: Rocky, sus reservaciones, la estancia de hoy, actividades, fotos,
reportes y notificaciones.

Una vez que `.env` tenga las llaves:

```bash
npm run db:seed
```

Eso crea las cuentas en Auth y siembra el dia completo de demostracion.

## Alternativa sin SQL manual

Si prefieres que Prisma lo haga todo:

```bash
npm run db:migrate    # aplica prisma/migrations/0_init
npm run db:seed
```

Ambos caminos producen exactamente el mismo esquema; `01_schema.sql` es una copia
de `prisma/migrations/0_init/migration.sql`.

## Nota sobre RLS

Las tablas se crean **sin Row Level Security**. El control de acceso vive en la
capa de aplicacion (`src/server/auth/session.ts` y cada Server Action), donde
esta la logica de negocio que decide quien ve que: propietario → mascota →
estancia → camara.

Supabase mostrara un aviso de "RLS disabled" en el dashboard. Es esperado: el
cliente del navegador nunca consulta estas tablas directamente, solo lo hace el
servidor con Prisma. Si en el futuro se expone PostgREST a clientes, habra que
activar RLS antes.
