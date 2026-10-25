# Club Canino Nica

Plataforma web/PWA para una guarderia canina. Los propietarios ven que hace su
mascota durante el dia; el personal opera el club desde un panel pensado para
usarse de pie, con el celular en la mano.

> **Estado: Fase 1 completada.** Arquitectura, base de datos, autenticacion con
> roles, design system y layouts. El resto del producto se construye por fases
> (ver [Roadmap](#roadmap)).

---

## Que hay hoy

| Area | Estado |
|---|---|
| Esquema de datos completo (19 modelos) | Listo |
| Autenticacion: login, registro, recuperar y restablecer contrasena | Listo |
| Roles y guardas de acceso (CLIENT / EMPLOYEE / ADMIN / VETERINARIAN / SUPER_ADMIN) | Listo |
| Design system y componentes base | Listo |
| Shell del portal del cliente (nav inferior movil + sidebar escritorio) | Listo |
| Shell del panel administrativo (10 secciones navegables) | Listo |
| KPIs reales del dia en el dashboard administrativo | Listo |
| Seed con un dia completo de demostracion | Listo |
| PWA instalable (manifest, theme, standalone) | Listo |
| Dashboard del cliente con la mascota en estancia, timeline y proxima reserva | Listo |
| Mascotas: alta, edicion, ficha completa y foto de perfil | Listo |
| Vacunas con aviso de vencimiento y comprobante | Listo |
| Listado de mascotas del panel, con busqueda y filtros | Listo |
| Catalogo de servicios con precios y cupos editables desde el panel | Listo |
| Flujo de reserva en cinco pasos, con precio visible en todo momento | Listo |
| Mis reservaciones con filtros, detalle, desglose del cobro y cancelacion | Listo |
| Agenda del panel por dia y semana, con confirmar y cancelar | Listo |
| Check-in con alertas de cuidado, y check-out | Listo |
| Estancia con registro rapido de actividades y ubicacion en vivo | Listo |
| Timeline del dia para el propietario, con actualizacion automatica | Listo |
| Galeria de fotos por estancia, con destacadas para el reporte | Listo |
| Reporte diario, precargado con lo ya registrado durante el dia | Listo |
| Historial por mascota, con actividades, fotos, reporte y cobro | Listo |
| Camaras con permisos por estancia y modo demostracion | Listo |
| Cobro en linea con proveedor demo, webhook firmado y reembolsos | Listo |
| Notificaciones in-app, con contador de no leidas | Listo |
| Responsive y accesibilidad AA verificados con auditoria automatica | Listo |
| Pagina publica con servicios, precios y contacto | Listo |
| Datos del negocio (contacto, horarios, IVA) editables desde Configuracion | Listo |
| Clientes: busqueda, ficha, activar y desactivar cuentas | Listo |
| Personal: alta con contrasena temporal, roles y acceso | Listo |
| Mostrador: el personal registra clientes, mascotas y reservas | Listo |
| Avisos al personal (reservas, cancelaciones, pagos) con campana | Listo |
| Perfil editable y cambio de contrasena dentro de la app | Listo |
| Salidas atrasadas marcadas en el panel | Listo |

---

## Stack

- **Next.js 16** (App Router, Turbopack, Server Actions) + **React 19**
- **TypeScript** estricto
- **Tailwind CSS v4** con tokens de diseno en `src/app/globals.css`
- **Prisma 7** sobre **PostgreSQL** (Supabase), via driver adapter `@prisma/adapter-pg`
- **Supabase Auth** para sesiones y correos de recuperacion
- **Zod** para validacion de entrada en servidor
- **Lucide** para iconografia

---

## Instalacion

```bash
npm install
cp .env.example .env      # rellenar valores (ver abajo)
npm run db:migrate        # crea las tablas
npm run db:seed           # carga los datos demo
npm run dev
```

Abrir http://localhost:3000

### Requisitos

- Node.js 20.9 o superior (probado en 24.x)
- Un proyecto de Supabase (plan free sirve)

---

## Variables de entorno

Todo vive en un unico archivo `.env` (lo leen tanto Next.js como la CLI de
Prisma). Nunca se sube al repositorio. La plantilla completa esta en
`.env.example`.

| Variable | Para que sirve |
|---|---|
| `DATABASE_URL` | Conexion de la app en runtime. Usar el **pooler** de Supabase (puerto 6543). |
| `DIRECT_URL` | Conexion directa (puerto 5432). Solo la usan `prisma migrate` y el seed. |
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave publicable. Puede llegar al navegador. |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave de servicio. **Solo servidor.** Se usa en el seed y en altas administrativas. |
| `STORAGE_PROVIDER` | `supabase` o `cloudinary`. |
| `CAMERA_PROVIDER` | `demo`, `hls` o `webrtc`. |
| `PAYMENT_PROVIDER` | `demo` o `stripe`. |
| `AUTH_EMAILS_ENABLED` | `true` solo con SMTP propio en Supabase. En `false` (por defecto) el registro no envia correo y un administrador da contrasenas temporales. |
| `SEED_DEMO_PASSWORD` | Contrasena de las cuentas demo. |

Donde encontrar los valores en Supabase:

- `DATABASE_URL` / `DIRECT_URL` → boton **Connect** › pestana **Session pooler**
- Claves → **Project settings › API keys**

### Dos trampas de la cadena de conexion

**1. Codifica los caracteres especiales de la contrasena.**

| Caracter | Poner |
|---|---|
| `$` | `%24` |
| `#` | `%23` |
| `@` | `%40` |
| `/` | `%2F` |
| `?` | `%3F` |
| `&` | `%26` |

El `$` es el que mas engana. Next.js carga `.env` con `@next/env`, que **expande
variables al estilo shell**: un `$` literal en la contrasena desaparece antes de
llegar a Prisma. El sintoma es `P1000 Authentication failed` en la app aunque la
misma URL funcione en un script suelto, porque `dotenv` a secas no expande.
Codificado como `%24` funciona en los dos.

Un `#` sin codificar da un error distinto, `P1013 invalid port number`: en una
URL el `#` inicia el fragmento y parte el string.

**2. Usa el pooler, no la conexion directa.**

`db.<ref>.supabase.co` solo tiene registro IPv6. Si tu red no tiene salida IPv6
veras `P1001 Can't reach database server`. La solucion es el pooler
(`aws-N-REGION.pooler.supabase.com`), donde el usuario pasa a ser
`postgres.<ref>` en lugar de `postgres`.

---

## Base de datos

Hay dos caminos, y producen el mismo esquema:

**A) Pegar el SQL en Supabase** — ver [`supabase/README.md`](supabase/README.md).
Ejecutar `supabase/01_schema.sql` y luego `supabase/02_datos_base.sql` en el SQL
Editor, y despues marcar la migracion como aplicada:

```bash
npx prisma migrate resolve --applied 0_init
```

**B) Dejar que Prisma lo haga** con `npm run db:migrate`.

En ambos casos, el dia completo de demostracion (usuarios, Rocky, estancia
activa, fotos y reportes) lo carga `npm run db:seed`, porque las cuentas deben
crearse en Supabase Auth y eso no se puede hacer por SQL.

```bash
npm run db:migrate     # crear/aplicar migraciones en desarrollo
npm run db:deploy      # aplicar migraciones en produccion
npm run db:seed        # datos demo (idempotente)
npm run db:seed:base   # solo organizacion + cuenta del dueno, sin datos demo
npm run db:studio      # explorador visual
npm run db:reset       # BORRA todo y vuelve a migrar + sembrar
npm run db:wipe        # BORRA los datos y las cuentas, sin tocar el esquema
```

`db:wipe` vacia todas las tablas y borra todos los usuarios de Supabase Auth,
que `db:reset` no toca porque viven fuera de Postgres. Exige confirmacion
explicita: `npm run db:wipe -- --si-borrar-todo`. Despues, `npm run db:seed`
para la demo o `npm run db:seed:base` para una instalacion real.

`db:seed:base` exige `SEED_OWNER_EMAIL`: sin dueno nadie podria entrar al panel.
La contrasena inicial del dueno es `SEED_DEMO_PASSWORD`. La app no arranca sin
la fila de la organizacion, asi que tras un `db:wipe` siempre va uno de los dos.

Las URLs de conexion viven en `prisma.config.ts`, no en `schema.prisma`
(Prisma 7 movio la configuracion de datasource fuera del schema).

El modelo de datos y sus relaciones estan documentados en
[`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md).

---

## Cuentas demo

Se crean con `npm run db:seed`. La contrasena sale de `SEED_DEMO_PASSWORD`, que
es **obligatoria**: el seed falla sin ella. No hay valor por defecto a proposito,
porque este repositorio es publico.

| Rol | Correo | Que puede ver |
|---|---|---|
| Cliente | `camila@correo.com` | Portal del cliente, con Rocky en estancia activa |
| Colaborador | `cuidador@clubcaninonica.com` | Panel administrativo |
| Administrador | `admin@clubcaninonica.com` | Panel administrativo + configuracion |

Si defines `SEED_OWNER_EMAIL` (y opcionalmente `SEED_OWNER_NAME`), el seed crea
ademas un segundo administrador con ese correo. **El registro publico siempre
crea `CLIENT`**, asi que el primer administrador no puede salir de la interfaz:
sale del seed o de un `UPDATE` a mano.

El seed deja a **Rocky** (labrador de Camila) dentro del club con actividades del
dia, fotos, historial de estancias anteriores, una reservacion futura y
notificaciones sin leer.

---

## Comandos

```bash
npm run dev          # servidor de desarrollo
npm run build        # genera cliente Prisma + build de produccion
npm run start        # servir el build
npm run typecheck    # tsc --noEmit
npm run lint         # eslint
npm run smoke        # prueba de humo contra el dev server (ver abajo)
```

### Verificaciones

`npm run check:pricing` no necesita nada corriendo. Comprueba el calculo de
precios, que es la unica logica del producto donde un error se traduce directo
en dinero mal cobrado: unidades cobrables por dia y por noche, conversion a
centavos y redondeo del impuesto una sola vez sobre el subtotal.

Las otras dos necesitan `npm run dev` en otra terminal:

```bash
npm run smoke           # rutas privadas y permisos
npm run check:booking   # la Server Action de reserva, de punta a punta
npm run check:stay      # el ciclo de estancia en un navegador real
npm run check:camera    # la cadena de autorizacion de camaras
npm run check:payment   # el camino del dinero
npm run check:notification

npm run check:all       # todas, en orden
npm run audit:ui        # responsive y accesibilidad
```

### Auditoria de interfaz

`npm run audit:ui` recorre las 26 pantallas en los cinco anchos del pliego
(375, 430, 768, 1024 y 1440) y reporta lo que se puede medir sin criterio
humano:

- scroll horizontal accidental, senalando el elemento que se sale
- areas tactiles por debajo de 44 px, ignorando controles pequenos cuya
  etiqueta ya es tocable
- violaciones de accesibilidad segun `axe-core` (WCAG 2.1 AA)
- pantallas de acceso que no quepan en una ventana de 1440x700, que es lo que
  deja una portatil real una vez descontada la barra del navegador

Ademas imprime el alto de cada pantalla como informacion. Un listado largo se
desplaza y esta bien; lo que interesa es notar cuando una pantalla de contenido
acotado se dispara.

Agrupa por problema y no por pantalla: el mismo fallo en veinte rutas es un
solo arreglo, no veinte. Mide, no arregla; el juicio visual sigue siendo humano.

Estado actual: **sin hallazgos**. La primera pasada devolvio 94.

`check:booking` localiza el id de la Server Action en el manifiesto de Next y
la invoca por HTTP con una sesion real. Cubre lo que ninguna prueba de
renderizado alcanza: validacion, propiedad de la mascota, cupo, calculo del
total y escritura en base. Crea dos reservaciones y las borra al terminar.

`check:stay` usa Playwright porque las acciones de estancia reciben `FormData`
desde componentes con `useActionState`, y eso no se puede invocar por HTTP sin
falsificar la codificacion interna de React. Recorre el dia completo haciendo
clic como lo hace el personal: check-in, registrar comida, registrar una nota
interna, publicar el reporte, avisar que esta listo y check-out.

Lo importante es que abre una segunda sesion como propietaria y comprueba dos
cosas que ninguna prueba de servidor detecta: que vea su reporte y sus
actividades, y que la nota interna **no** aparezca ni en la pantalla del dia ni
despues en el historial.

### Prueba de humo

Con `npm run dev` corriendo en otra terminal:

```bash
npm run smoke
```

Inicia sesion de verdad contra Supabase, arma la cookie que espera
`@supabase/ssr` y pide las rutas privadas. Verifica la cadena completa —
proxy, sesion, Prisma y render — sin abrir un navegador. Tambien comprueba que
un cliente no pueda entrar al panel administrativo.

Salida esperada con los datos demo cargados:

```
ADMIN   GET /admin -> 200          KPIs en orden: 1 1 0 0 1 1
CLIENTE GET /inicio -> 200
CLIENTE -> /admin  307 /inicio  (bloqueado, correcto)
```

---

## Integraciones externas

Las tres integraciones que aun no tienen credenciales reales estan disenadas
detras de una interfaz propia, con un modo **DEMO** funcional. Cambiar de
proveedor no debe tocar componentes de UI.

### Almacenamiento (`StorageProvider`)

`uploadPetPhoto`, `uploadActivityPhoto`, `uploadVaccinationDocument`, `deleteFile`
en `src/server/providers/storage.ts`. Preparado para Supabase Storage y
Cloudinary. Las filas guardan `storageKey` (ruta en el proveedor), no solo una
URL absoluta, para poder migrar sin reescribir datos.

Crear el bucket una vez por proyecto:

```bash
npm run storage:init
```

El bucket es **publico** a proposito: las rutas llevan un UUID, asi que una URL
no se adivina, pero tampoco se protege por sesion. Es un compromiso consciente
para el MVP (fotos de mascotas, no documentos sensibles) que mantiene simple
`next/image` y su cache. Para pasarlo a privado basta cambiar `public` en
`scripts/init-storage.mjs` y devolver URLs firmadas desde el proveedor; el
resto de la aplicacion no cambia.

### Camaras (`CameraProvider`)

`src/server/providers/camera.ts`. Es el modulo mas delicado del producto: de el
depende quien puede ver video de un area donde hay perros ajenos.

- **Ninguna credencial llega al navegador.** La base guarda un `providerRef`
  opaco, y el formulario rechaza que alguien pegue ahi una URL con usuario y
  contrasena.
- **El acceso se valida en el servidor** recorriendo la cadena
  **usuario → mascota → estancia → `CameraAccess`**. No existe forma de pedir
  "la camara X" sin una estancia abierta que la autorice.
- **Doble corte al terminar la estancia**: el check-out marca `revokedAt`, y
  ademas la consulta exige que la estancia siga abierta. Si una de las dos
  fallara, la otra sostiene.
- **Permisos con vencimiento**, y cada reproduccion se concede por cinco
  minutos con una URL firmada. Una URL copiada deja de servir enseguida.
- **Sin proveedor real no se inventa video.** La interfaz muestra un cartel que
  dice que es una demostracion. Un propietario no debe poder confundir una
  animacion con su mascota.

`npm run check:camera` comprueba las cinco cosas contra el servidor real.

Para conectar un proveedor: poner `CAMERA_PROVIDER`, `CAMERA_STREAM_BASE_URL` y
`CAMERA_SIGNING_SECRET`, y cambiar el protocolo de cada camara. Para navegadores
que no reproducen HLS de forma nativa hara falta `hls.js`, que se agrega cuando
exista un stream real que probar.

### Pagos (`PaymentProvider`)

`src/server/providers/payment.ts`: `createCheckout`, `getPaymentStatus`,
`refundPayment`, `verifyWebhookSignature`.

- **Ningun dato de tarjeta pasa por la plataforma.** El cliente los escribe en
  la pagina del proveedor. Solo se guarda el estado y una referencia opaca.
- **El monto sale de la reservacion guardada**, nunca del navegador.
- **Quien confirma un cobro es el proveedor**, no la pantalla de exito: al
  volver se le pregunta el estado real, y con Stripe manda el webhook firmado.
- La ruta del webhook es publica por necesidad y se protege solo con la firma,
  con ventana de cinco minutos contra reenvios.
- Las llamadas de cobro y reembolso llevan clave de idempotencia: un reintento
  por fallo de red no cobra dos veces.
- El reembolso queda restringido a ADMIN. Registrar un pago recibido en
  efectivo lo puede hacer todo el personal, porque pasa a diario.

Sin llaves configuradas corre el proveedor `demo`: una pantalla de cobro
simulada, marcada como demostracion, que **no pide ni aparenta pedir datos de
tarjeta** (un formulario falso ensenaria a la gente a escribirlos donde no
debe). Sus referencias empiezan con `demo_` para que no se confundan con cobros
reales al mirar la base o el panel.

`npm run check:payment` verifica el camino del dinero contra el servidor real.

Para activar Stripe: poner `PAYMENT_PROVIDER=stripe`, `STRIPE_SECRET_KEY` y
`STRIPE_WEBHOOK_SECRET`. El adaptador habla con la API por `fetch`, sin el SDK
oficial: mientras no haya llaves con que probarlo, la dependencia seria peso sin
verificar. Al entrar en operacion conviene migrar al SDK por sus reintentos.

---

## Datos pendientes de definir

Estos valores son **DEMO** y estan centralizados en
[`src/config/business.ts`](src/config/business.ts). No son datos oficiales del
negocio y deben confirmarse antes de mostrar la plataforma a clientes reales:

- precios de los servicios
- horarios de operacion
- direccion, telefono y correo
- impuestos y politica de cancelacion
- cupo maximo de mascotas
- veterinaria asociada
- marca y modelo de camaras

El panel administrativo los muestra con una advertencia visible en
**Configuracion**.

---

## Roadmap

| Fase | Contenido | Estado |
|---|---|---|
| 1 | Arquitectura, base de datos, auth, roles, design system, layouts | Completada |
| 2 | Dashboard del cliente, mascotas, perfiles, salud y vacunas | Completada |
| 3 | Servicios, flujo de reservacion, administracion de reservaciones | Completada |
| 4 | Check-in, estancias, actividades, timeline | Completada |
| 5 | Fotografias, reportes diarios, historial | Completada |
| 6 | Camaras, permisos, player demo | Completada |
| 7 | Pagos con Stripe sandbox | Completada |
| 8 | Notificaciones | Completada |
| 9 | Pulido de UI/UX, responsive, accesibilidad, pruebas | Completada |

---

## Convenciones del codigo

- Los **estados** son enums de Postgres. Nunca escribir un estado como string
  suelto: usar `src/lib/constants/labels.ts` para traducirlos.
- Los **precios** salen de la tabla `services`, nunca del codigo.
- El **nombre del negocio** sale de `src/config/business.ts`, nunca escrito a
  mano en un componente. Esto permite convertir la plataforma en producto para
  otras guarderias.
- Toda **Server Action** verifica sesion y permisos por su cuenta. El
  `proxy.ts` es una primera barrera, no la unica.
- Los **avisos** nacen en un solo lugar, `notify()` en `src/server/notifications.ts`,
  y se escriben dentro de la misma transaccion que el cambio que los provoca:
  si el cambio se revierte, el cliente no queda con un aviso de algo que no
  ocurrio. Ese es tambien el punto donde se enganchara el push.
- Ninguna vista queda en blanco: `loading`, `empty` y `error` siempre tienen
  tratamiento.
