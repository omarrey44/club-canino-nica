# Arquitectura — Club Canino Nica

Documento de decisiones. Explica **por que** el sistema esta construido asi, no
solo como. Complementa el `README.md`, que cubre instalacion y uso.

---

## 1. El problema real

Una guarderia canina no falla por falta de software de reservas. Falla porque el
propietario deja a su perro y se queda sin informacion durante ocho horas. La
funcion central del producto no es reservar ni cobrar: es **hacer visible el dia
de la mascota**.

Eso ordena las prioridades tecnicas:

1. El registro de una actividad por parte del personal debe tardar segundos.
   Si es lento, no se registra, y sin registro no hay nada que mostrarle al
   propietario.
2. La vista del cliente debe reflejar lo registrado casi de inmediato.
3. Todo lo demas (pagos, catalogos, reportes) es soporte de eso.

---

## 2. Decisiones estructurales

### 2.1 Dos experiencias, un solo dominio

`(client)` y `(admin)` son grupos de rutas separados, con layouts, navegacion y
guardas distintos, sobre el mismo modelo de datos y los mismos servicios. No hay
duplicacion de logica de negocio entre ambos.

### 2.2 Supabase Auth como proveedor de identidad, Prisma como duenio del dominio

La tabla `auth.users` la administra Supabase. Nuestra tabla `users` la administra
Prisma y se enlaza con `authUserId` (UUID unico).

Por que separadas:

- Supabase resuelve gratis lo aburrido y riesgoso: hash de contrasenas, tokens,
  correos de confirmacion y recuperacion.
- El dominio (rol, organizacion, telefono, relacion con mascotas) es nuestro y
  se consulta con joins normales de Postgres.
- Si algun dia se cambia de proveedor de identidad, solo cambia la columna
  puente.

El **rol nunca viaja en el formulario de registro**. Registrarse siempre crea un
`CLIENT`; los roles internos los otorga un administrador.

### 2.3 `Organization` desde el dia uno

Hoy hay una sola fila. Existe porque agregarla despues obligaria a rellenar
retroactivamente la columna en cada tabla y a reescribir todas las consultas.
Es la unica concesion a "multi-tenant futuro" que se hizo por adelantado; el
resto (sucursales, membresias, cupones) se agregara cuando haga falta.

El nombre "Club Canino Nica" no aparece en la logica: sale de
`src/config/business.ts` y de `Organization.settings`.

### 2.4 Estados como enums de Postgres

`ReservationStatus`, `StayStatus`, `PaymentStatus`, `ActivityType`,
`NotificationType`, etc. viven en la base. La traduccion al espanol y el tono
visual estan en `src/lib/constants/labels.ts`.

Consecuencia: un estado invalido es imposible de escribir, no solo improbable.

### 2.5 Precios congelados en la reservacion

`Reservation.subtotal/taxes/total` y `ReservationExtra.unitPrice` guardan el
monto al momento de cotizar. Cambiar el catalogo de servicios no altera
reservaciones ya hechas.

---

## 3. Modelo de datos

### 3.1 Cadena central

```
User (CLIENT)
  └── Pet
        └── Reservation ──── Payment
              └── Stay            (se crea en el check-in)
                    ├── PetActivity
                    ├── PetPhoto
                    ├── DailyReport
                    └── CameraAccess ──── Camera
```

**Reservation vs Stay** es la separacion clave. Una reservacion es una intencion
con fechas y precio. Una estancia es lo que efectivamente ocurrio. Muchas
reservaciones nunca se convierten en estancia (se cancelan); una estancia sin
reservacion no tiene sentido. Por eso `Stay.reservationId` es unico y obligatorio,
y `Stay` solo nace en el check-in.

### 3.2 Entidades

| Modelo | Rol |
|---|---|
| `Organization` | Raiz de tenant. Branding y configuracion en `settings` (JSON). |
| `User` | Persona. Rol, organizacion, puente con Supabase Auth. |
| `EmployeeProfile` | Datos exclusivos del personal, fuera de `User` para no llenarlo de columnas nulas. |
| `Pet` | Mascota. Pertenece a un propietario. |
| `PetMedicalInfo` | 1:1 con la mascota. Informacion administrativa de cuidado, **no** expediente clinico. |
| `PetVaccination` | Vacunas con vencimiento y comprobante. |
| `EmergencyContact` | Contactos por mascota. |
| `Service` | Catalogo con precio, unidad de cobro y cupo. |
| `Reservation` | Intencion de estancia, con codigo corto legible (`CCN-1001`). |
| `ReservationExtra` | Adicionales con precio congelado. |
| `Stay` | La estancia real. Contenedor del dia. |
| `PetActivity` | Cada evento del dia. Puede ocultarse al propietario. |
| `PetPhoto` | Fotos ligadas a estancia y mascota. |
| `DailyReport` | Un reporte por dia de estancia (`@@unique([stayId, reportDate])`). |
| `Camera` | Camara del club. Sin credenciales, solo `providerRef` opaco. |
| `CameraAccess` | Autorizacion temporal camara ↔ estancia. |
| `Payment` | Estado y referencia del proveedor. Sin datos de tarjeta. |
| `Notification` | Aviso in-app, preparado para push. |
| `AuditLog` | Rastro de acciones administrativas relevantes. |

### 3.3 Indices y por que existen

| Indice | Consulta que sirve |
|---|---|
| `reservations(organizationId, startAt)` | Agenda del dia y de la semana en el panel. |
| `reservations(organizationId, status)` | Filtros por estado y conteo de entradas pendientes. |
| `reservations(clientId, startAt)` | "Mis reservaciones" del cliente. |
| `pet_activities(stayId, occurredAt)` | El timeline, que es la lectura mas frecuente del producto. |
| `stays(status, checkInAt)` | Mascotas presentes ahora mismo. |
| `notifications(userId, readAt)` | Contador de no leidas en la campanita. |
| `pet_vaccinations(petId, expiresAt)` | Advertencia de vacuna proxima a vencer. |

### 3.4 Borrados

- `onDelete: Cascade` donde el hijo no tiene sentido sin el padre
  (actividades sin estancia, vacunas sin mascota).
- `onDelete: Restrict` donde borrar destruiria historial contable o legal
  (no se puede borrar una mascota con reservaciones).
- `onDelete: SetNull` en autorias (`recordedById`, `authorId`): si un
  colaborador deja el club, sus registros permanecen sin firma.

---

## 4. Seguridad

### 4.1 Capas

1. **`proxy.ts`** (antes `middleware.ts`; Next.js 16 lo renombro) — renueva la
   sesion y redirige rutas privadas sin sesion. Es conveniencia, no proteccion.
2. **Layouts de servidor** — `requireUser()`, `requireStaff()`, `requireRole()`.
   Corren en cada navegacion.
3. **Cada Server Action y cada consulta** — vuelven a verificar sesion y
   pertenencia. Una Server Action es alcanzable por POST directo, sin pasar por
   la interfaz.

El punto 3 no es redundancia: es el unico control que no se puede saltar.

### 4.2 Reglas de aislamiento

- Un cliente solo lee mascotas cuyo `ownerId` es el suyo.
- Un cliente solo lee reportes, fotos y actividades de estancias de sus mascotas.
- Toda consulta administrativa se acota por `organizationId` del usuario en
  sesion, nunca por un id que venga del cliente.

### 4.3 Camaras

El modulo mas delicado del producto. Reglas duras:

- Las credenciales del proveedor **no salen del servidor**. `Camera.providerRef`
  es un identificador opaco; el adaptador lo resuelve en backend.
- El acceso se valida recorriendo **usuario → mascota → estancia → `CameraAccess`**.
  No existe forma de pedir "la camara X" sin una estancia activa que la autorice.
- `CameraAccess.expiresAt` y `revokedAt` cortan el acceso al terminar la estancia.
- Sin proveedor real configurado, se sirve un video de muestra etiquetado
  visiblemente como **DEMO**. Nunca se simula una transmision real.

### 4.4 Fugas de informacion

- El login responde igual ante correo inexistente y contrasena incorrecta.
- La recuperacion de contrasena responde igual exista o no la cuenta.
- Los errores de proveedor y de base se registran en servidor; el usuario recibe
  un mensaje en lenguaje natural.

---

## 5. Estructura de carpetas

```
src/
  app/
    (auth)/           login, registro, recuperar, restablecer
    (client)/         portal del propietario
    (admin)/admin/    panel operativo
    auth/callback/    intercambio de enlaces de correo por sesion
  components/
    ui/               primitivas del design system
    layout/           navegacion y shells
  config/
    business.ts       branding y datos del negocio (fuente unica)
  lib/
    constants/        etiquetas y agrupaciones de estados
    supabase/         clientes browser / server / admin
    prisma.ts         instancia unica de Prisma
    datetime.ts       zona horaria del club, saludos y formatos
    utils.ts
  server/
    actions/          Server Actions (mutaciones)
    queries/          lecturas de solo servidor
    auth/             sesion y guardas
    organization.ts   resolucion de tenant
  validations/        esquemas Zod
  generated/prisma/   cliente generado (no editar)
prisma/
  schema.prisma
  seed.ts
prisma.config.ts      URLs de conexion (Prisma 7)
```

`server/` no se importa nunca desde un componente cliente; los modulos llevan
`import 'server-only'` para que el error aparezca en compilacion y no en
produccion.

---

## 6. Design system

### 6.1 El naranja es acento, no fondo

La marca es naranja (`#FF7A00`), pero el producto vive sobre neutros calidos.
El naranja se reserva para la accion principal de cada pantalla y para el estado
"en estancia". El protagonista visual es la foto del perro, no la interfaz.

El panel administrativo usa navy oscuro en la navegacion: separa de un vistazo
"estoy operando" de "estoy viendo a mi mascota".

### 6.2 Tokens

Definidos en `@theme` de Tailwind v4 (`src/app/globals.css`): escalas `brand` y
`navy`, superficies (`surface`, `canvas`, `canvas-warm`), texto (`ink`,
`ink-muted`, `ink-subtle`), lineas y semanticos.

Sombras deliberadamente discretas. Sin glassmorphism, sin gradientes decorativos,
sin cards flotando.

### 6.3 El contraste manda sobre la paleta

La paleta original no cumplia AA y hubo que ceder en tres sitios:

- **El naranja de marca no sirve como fondo de boton.** Blanco sobre `#F97316`
  da 2.8:1. Los botones y las pastillas activas usan `brand-700`; el naranja
  vivo queda para acentos, puntos de estado y bordes, donde no lleva texto
  encima.
- **Los colores semanticos se oscurecieron.** Cada uno se usa como texto sobre
  su propio `-soft`, y ahi es donde tiene que cumplir. Los tonos vivos no
  llegaban ni sobre blanco.
- **`ink-subtle` acabo valiendo lo mismo que `ink-muted`.** A 11-12px no existe
  un gris mas palido que cumpla 4.5:1. El token se conserva porque marca
  intencion y podra separarse en tamanos mayores, pero hoy la jerarquia del
  texto secundario la da el tamano y el peso, no un gris mas claro.

Todo esto salio de medir, no de opinar: `npm run audit:ui` devolvio 94
hallazgos en la primera pasada.

### 6.4 Accesibilidad, no como capa final

- Foco visible global; nunca `outline: none` sin reemplazo.
- Controles de 44px minimo de alto.
- Inputs a 16px: por debajo, iOS hace zoom al enfocar.
- El color no es el unico portador de estado: `StatusBadge` siempre lleva texto.
- `Field` cablea `htmlFor`, `aria-invalid` y `aria-describedby` automaticamente,
  para que sea mas facil hacerlo bien que mal.
- `prefers-reduced-motion` respetado globalmente.

### 6.4 Movil primero, escritorio con criterio

El cliente en movil usa barra inferior de 5 destinos (mas de 5 es ilegible en
375px). En escritorio esa misma navegacion se vuelve sidebar con etiquetas
completas: no es el diseno movil estirado.

El personal usa el panel de pie, con celular o tablet. Por eso en movil la
navegacion administrativa es una tira horizontal deslizable y no una gaveta:
deslizar cuesta menos que abrir, buscar y tocar.

---

## 7. Zona horaria

Nicaragua no observa horario de verano, asi que `America/Managua` es UTC-6 todo
el ano. `clubDayRange()` usa ese desfase fijo para calcular los limites del dia
operativo en UTC. Si la plataforma se abre a una zona con DST, esa funcion debe
pasar a `date-fns-tz`; el resto del codigo no cambia.

---

## 8. Que se dejo fuera a proposito

- **Politicas de RLS.** Las tablas tienen RLS **activo pero sin politicas**
  (`supabase/03_rls.sql`), lo que cierra por completo la API publica de Supabase.
  No se escribieron politicas porque duplicarian en SQL la logica de negocio
  (propietario → mascota → estancia → camara) con riesgo de divergencia, y hoy
  nadie consulta la base desde el navegador. Prisma sigue leyendo porque se
  conecta como dueno de las tablas y no se uso `FORCE ROW LEVEL SECURITY`.
  Si algun dia se expone PostgREST o Realtime a clientes, ahi si hacen falta
  politicas.
- **Sucursales, membresias, cupones, facturacion, chat, QR.** El modelo no los
  impide, pero construirlos hoy seria adivinar requisitos.
- **Offline avanzado en la PWA.** El manifest y la experiencia standalone estan;
  el service worker con cache offline llega cuando haya uso real que lo justifique.
- **Graficos en el panel.** En recepcion importa el numero grande y legible, no
  una tendencia decorativa.
