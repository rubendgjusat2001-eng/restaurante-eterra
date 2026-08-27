# ÉTERRA OS — Guía del Proyecto para IA

Este archivo lo lee automáticamente cualquier sesión de Claude Code antes de tocar
el proyecto. Su objetivo: que una IA (o una persona nueva) entienda el sistema,
por qué está hecho así, y qué NO debe cambiar sin preguntar — antes de escribir
una sola línea de código.

**El dueño del proyecto no programa.** Todas las instrucciones de negocio vienen
de él en lenguaje simple; el criterio técnico (cómo implementarlo bien) es
responsabilidad de quien lo asista. Ante la duda, prioriza seguridad y no-romper-
nada sobre velocidad.

---

## 1. Qué es este proyecto

**ÉTERRA OS**: un sistema operativo de restaurante (ERP) con dos caras:

- **Portal público** (`/`) — web de clientes: menú, promociones, reservas, pedidos
  online. Sin ningún botón ni referencia al sistema interno.
- **ERP interno** (`/sistema/*`) — panel privado para el personal: mesas, cocina
  (KDS), caja, personal, carta, configuración, dashboard del dueño.

Pensado para venderse como producto a **varios restaurantes distintos**
(multi-tenant) — ver la sección de brechas conocidas, esto todavía no está
completo.

## 2. Stack técnico

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS 4**
- **Supabase** (Postgres + Realtime + Storage) — base de datos y sincronización
  en tiempo real entre dispositivos
- **bcryptjs** (hash de contraseñas/PIN) + **jose** (firma de sesión JWT)
- Sin backend propio aparte de las Route Handlers de Next.js (`src/app/api/*`)

## 3. Estructura de carpetas

```
src/
  app/
    page.tsx                 → Portal público (home)
    sistema/                 → ERP interno (protegido por sesión)
    api/auth/*                → Rutas de servidor: login, identify, logout, me,
                                 change-password, complete-setup, set-staff-pin,
                                 accounts
    api/system/time            → Reloj de confianza del servidor
  components/
    public/                  → Componentes de la web de clientes
    internal/                → Componentes del ERP (mesas, cocina, caja, etc.)
    common/                  → Compartidos (login, modales, toasts)
  context/
    RestaurantContext.tsx    → Solo el "punto de composición" (~350 líneas):
                                 junta un hook por dominio en un solo objeto de
                                 contexto. Ya NO contiene lógica de negocio —
                                 ver sección 6 y docs/decisions/0004.
  hooks/                     → Un hook de React por dominio (estado + efectos +
                                 su propia suscripción en tiempo real si aplica):
                                 use-auth, use-staff, use-staff-positions
                                 (Cargos), use-menu, use-tables, use-zones,
                                 use-orders, use-table-lifecycle (orquestador:
                                 abrir/mudar mesa), use-checkout (orquestador:
                                 cobrar mesa), use-cash-shifts, use-permissions
                                 (Roles), use-warehouse (Almacén),
                                 use-reservations, use-cart, use-audit-log,
                                 use-toasts, use-restaurant-profile. Todos los
                                 que leen/suscriben a Supabase (no los que solo
                                 escriben) reciben `isPrivateRoute` — ver
                                 docs/decisions/0006.
  services/                  → Acceso a datos de cada dominio (llamadas a
                                 Supabase). Sigue siendo la anon key desde el
                                 navegador — NO es la "capa de servicios" de
                                 la sección 5/6.3 (esa mueve las escrituras a
                                 rutas de servidor; esto es solo organización
                                 de código). Ver docs/decisions/0002 y 0004.
  lib/
    supabase.ts               → Cliente Supabase del NAVEGADOR (anon key, público)
    supabase-service.ts        → Cliente Supabase del SERVIDOR (service role,
                                 NUNCA importar desde un componente 'use client')
    session.ts                 → Firma/lee la cookie de sesión (JWT httpOnly)
    server-time.ts             → Reloj corregido contra el servidor
  types/restaurant.ts          → Todos los modelos de datos (TypeScript)
supabase_schema.sql            → Schema original (histórico, ya no se re-ejecuta tal cual)
supabase_migrations/           → Migraciones aplicadas en orden numérico (001, 002, 003...)
scripts/                       → Utilidades de un solo uso (migración de credenciales, limpieza)
docs/                          → Mapas y decisiones de arquitectura (ver abajo)
```

## 4. Modelo de autenticación (dos niveles) — NO simplificar a uno solo

Esto se diseñó a propósito así, después de una revisión de seguridad completa.
No "optimizar" de vuelta a un solo nivel sin entender por qué:

- **Nivel 1 — `access_accounts`** (usuario + contraseña): con qué se **entra al
  sistema**. El dueño y cuentas de turno compartidas ("Turno Día", "Turno
  Noche"). Login vía `POST /api/auth/login`. Contraseña hasheada con bcrypt,
  verificada en el servidor con la service role key — nunca en el cliente.
- **Nivel 2 — `staff_credentials`** (PIN de 4 dígitos): **NO otorga acceso al
  sistema**. Identifica a un colaborador específico dentro de una sesión ya
  activa, en el momento de una acción sensible (abrir/cerrar mesa, cobrar,
  cerrar caja). Verificado vía `POST /api/auth/identify`, componente compartido
  `src/components/common/PinPadModal.tsx`, disparado con
  `requestStaffIdentity()` del contexto.

**Regla crítica:** `currentUser` (del contexto) es la cuenta de acceso logueada
(Nivel 1) — **NO es un colaborador de `staff_users`**. Sus IDs viven en
namespaces distintos (`access_accounts.id` es un UUID; `staff_users.id` es un
texto tipo `user-owner`). Nunca uses `currentUser` como si fuera un
`StaffUser` para identificar quién hizo una acción — usa
`requestStaffIdentity()` para eso. (Este error exacto causó un bug real en
2026-08 — ver `docs/decisions/0001-two-tier-auth.md`.)

Sesión: cookie httpOnly `eterra_session` (JWT, 15 min, se renueva mientras hay
actividad). Un "hint" sin secretos se espeja en `localStorage`/`sessionStorage`
solo para hidratar la UI sin parpadeo — la cookie es la única autoridad real,
todo se revalida contra `GET /api/auth/me`.

**Configuración obligatoria de cuenta:** ninguna cuenta puede quedarse
indefinidamente con una contraseña provisional/de fábrica. `access_accounts.
must_change_password` fuerza, en el próximo login, la pantalla
`AccountSetupScreen.tsx` (bloquea el ERP hasta definir contraseña definitiva,
usuario y email) antes de dejar pasar a `/sistema` — ver
`docs/decisions/0005-forced-account-setup.md`.

## 5. Seguridad de la base de datos (RLS)

RLS está **activado en todas las tablas**. Postura actual (Fase 1, deliberada):

- `access_accounts`, `staff_credentials`: **sin políticas** para `anon`/
  `authenticated` — deny-by-default real. Solo `service_role` (rutas del
  servidor) puede tocarlas.
- `restaurants`, `staff_users`, `tables`, `orders`, `menu_items`,
  `cash_shifts`: política permisiva (`TO anon USING (true) WITH CHECK (true)`)
  — **riesgo residual conocido y documentado**, no accidental. Se cierra en
  Fase 2 migrando cada escritura a una capa de servicios. Ver
  `docs/decisions/0002-rls-posture-phase1.md`.
- `staff_users` tiene un trigger que bloquea que un cliente cambie su propia
  columna `role` (anti auto-escalación de privilegios).

**Nunca** quites `SUPABASE_SERVICE_ROLE_KEY` de las validaciones de entorno en
`src/lib/supabase-service.ts`, ni agregues fallbacks hardcodeados de URL/keys
como existían antes de la auditoría de seguridad — eso fue un hallazgo crítico
ya corregido.

## 6. Deuda técnica conocida (no es "no pensado", es priorización explícita)

1. ~~`RestaurantContext.tsx` (~1900 líneas) hacía todo~~ — **resuelto en Fase
   2a** (2026-08-26): dividido en `src/hooks/` + `src/services/` por dominio,
   con `RestaurantContext.tsx` como un simple punto de composición. Ningún
   componente cambió (misma forma de `useRestaurant()` que antes). Ver
   `docs/decisions/0004-context-decomposition.md`. **Esto NO cerró el hueco de
   RLS del punto 3** — son cosas distintas, no confundir.
2. **Multi-tenant incompleto** — las tablas tienen `restaurant_id`, pero el
   código del cliente no filtra por él (asume un solo restaurante). Hay que
   resolver esto antes de vender el sistema a un segundo cliente.
3. **La mayoría de las escrituras operativas** (mesas, pedidos, carta) siguen
   yendo directo del cliente a Supabase con la anon key, protegidas solo por
   la postura de RLS de la sección 5 — no por una capa de servicios propia.
4. **Identificación por PIN (Nivel 2)** está conectada en: abrir mesa, cobrar/
   cerrar mesa, cerrar turno de caja. **Todavía falta** en: anular un ítem,
   aplicar un descuento (`OrderPadModal.tsx` usa `currentUser?.name` como
   marcador, no una identificación real).
5. **Cero pruebas automatizadas.** Cada cambio se verifica manualmente
   (`npm run build` + navegador) — ver sección 8.
6. **Sin code-splitting** — las 7+ vistas del ERP + modales pesados cargan en
   un solo bundle sin importar la sección activa. Sigue pendiente.
7. ~~Caja/turnos, reservas, carrito público y auditoría NO se guardan en
   Supabase~~ — **resuelto en las Fases F e I** (2026-08-27): las 4 tablas
   persisten de verdad con el patrón fetch+realtime+persist estándar del
   proyecto. Ver `docs/decisions/0009` y `0012`.
8. ~~`submitOnlineOrder` no persiste el pedido en la nube~~ — **resuelto en la
   Fase C** (2026-08-27).
9. **Permisos de Roles: enforcement parcial a propósito** — la Fase G
   construyó la matriz completa y configurable, pero solo se aplicó a la
   visibilidad de la navegación (`SidebarDrawer.tsx`). Las ~15 verificaciones
   `role === 'owner'` en rutas de servidor y botones de editar/eliminar
   siguen igual que antes (ya eran correctas) — migrarlas a `canEdit`/
   `canDelete` es un paso aparte, pendiente, para hacerlo con el dueño
   presente probando cada cambio antes de subirlo. Ver `docs/decisions/0010`.
10. **Almacén (Fase H) es un MVP** — no descuenta insumos automáticamente al
    vender un plato (sin recetas/BOM todavía) ni soporta multi-sede. Ver
    `docs/decisions/0011`.

No "arregles" estos puntos de pasada dentro de una tarea distinta — se
abordan aparte y con verificación completa.

## 7. Qué NO tocar sin preguntar al dueño primero

- El modelo de dos niveles de autenticación (sección 4).
- La postura de RLS (sección 5) — sobre todo, no relajar `access_accounts` /
  `staff_credentials`.
- Los archivos en `supabase_migrations/` (son historial — no editar una
  migración ya aplicada, crear una nueva).
- Ejecutar SQL directo contra la base de datos de producción — eso lo corre
  siempre el dueño manualmente en el SQL Editor de Supabase, nunca de forma
  automática (ver `docs/decisions/0002-rls-posture-phase1.md` para el porqué).
- Borrar o downgradear dependencias sin justificar por qué.
- Cualquier cosa relacionada a pagos reales (Fase 3, todavía no construida) —
  nunca pedir ni guardar datos bancarios/tarjetas; solo API keys de la
  pasarela (Culqi, planeado).

## 8. Antes de dar un cambio por terminado

1. `npm run build` — 0 errores de TypeScript, exit code 0. Obligatorio.
2. Si el cambio es visible/interactivo: probarlo en el navegador (no solo
   confiar en que compiló), con evidencia (captura o texto de la página).
3. Si toca autenticación, dinero, u horarios: probar el flujo real de punta a
   punta, no solo el código que cambió.

## 9. Mapas y decisiones

- `docs/architecture.md` — diagrama de cómo se conectan navegador, Next.js,
  Supabase y las rutas del servidor.
- `docs/database-schema.md` — diagrama de las tablas y sus relaciones.
- `docs/decisions/` — por qué se tomaron las decisiones importantes (léelas
  antes de "corregir" algo que parece raro a primera vista — probablemente es
  intencional).

## 10. Estado del proyecto

- **Fase 1 (Seguridad crítica): completa y verificada** — auth server-side,
  contraseñas/PIN hasheados, RLS activo, reloj de servidor para timestamps.
- **Fase 2a (Reorganización del estado en módulos): completa y verificada**
  (2026-08-26) — `RestaurantContext.tsx` dividido en `src/hooks/`+`src/services/`
  por dominio, mismo comportamiento, cero cambios en los 25 componentes
  consumidores. Verificado con build limpio + recorrido completo en el
  navegador (login, PIN en abrir/cobrar mesa, sync en tiempo real entre dos
  pestañas). Ver `docs/decisions/0004-context-decomposition.md`.
- **Fase 2b (Persistencia faltante): planificada, no iniciada** — guardar en
  Supabase lo que hoy vive solo en memoria (caja, reservas, pedidos online,
  auditoría) — ver punto 7-8 de la sección 6.
- **Fase 2c (Escalabilidad restante): planificada, no iniciada** —
  code-splitting por sección del ERP, multi-tenant real, cerrar el RLS
  permisivo migrando escrituras a rutas de servidor, pruebas automatizadas.
- **Fase 3 (Portal de pagos para clientes): planificada, no iniciada** —
  subdominio separado, pasarela Culqi, sincronización en tiempo real con el
  ERP.
- **Endurecimiento de credenciales (dentro de Fase 2c): completa y
  verificada** (2026-08-26) — `must_change_password` fuerza configuración
  obligatoria en el primer login (`AccountSetupScreen.tsx`), se unificaron
  `/sistema` y `/sistema/[section]` en un solo componente compartido
  (`SistemaApp.tsx`) para que no puedan volver a desincronizarse. Ver
  `docs/decisions/0005-forced-account-setup.md`. Verificado en producción real
  (no solo local).
- **Infraestructura de Vercel: consolidada** (2026-08-26) — existían 6
  proyectos de Vercel duplicados conectados al mismo repositorio (restos de
  configuraciones anteriores); se redujeron a uno solo (`restaurante-eterra`).
  Ver `[[vercel-single-project]]` en la memoria del asistente y la sección 11
  de este documento — nunca crear un proyecto de Vercel nuevo para este repo
  sin revisar primero si ya existe.
- **Fases B a I (mesas/zonas, personal/Cargos, caja, permisos, almacén,
  reservas/auditoría): código completo, compilado limpio, subido a
  producción** (2026-08-27) — **pero las migraciones SQL 008 a 013 todavía no
  se corrieron en Supabase** (el dueño no estaba disponible esa madrugada).
  Hasta que se corran, en orden, estas funciones se comportan de forma
  degradada-pero-segura (no rompen nada, solo aparecen vacías/inactivas):
  zonas configurables, expediente de personal + Cargos + gastos, caja
  persistente + una sola caja abierta + reporte por turno, matriz de
  Permisos de Roles, Almacén, y reservas/auditoría en la nube. Ver
  `docs/decisions/0007` a `0012` para el detalle de cada una, y correr las
  migraciones en el SQL Editor de Supabase en orden numérico antes de dar
  por probada cualquiera de estas pantallas en el navegador.

## 11. Configuración inicial de infraestructura/servicios externos → delegar a Antigravity

Esta sección aplica específicamente cuando el dueño necesita **configurar algo
de cero, o reconfigurar una conexión externa** — Vercel, dominios, un
proveedor de pagos, correo transaccional, o cualquier servicio parecido que
no sea el código ni la base de datos del proyecto. NO aplica a tareas
normales de desarrollo dentro del código (esas las hace Claude Code
directamente, sin desviar a otra herramienta).

Claude Code tiene prohibido, sin excepción, escribir contraseñas, claves API
o tokens en cualquier formulario — ni siquiera si el dueño lo autoriza
explícitamente — y no tiene ninguna integración conectada a estos servicios
externos (Vercel, registradores de dominio, pasarelas de pago, etc.). Por
eso, para este tipo específico de configuración, la forma de trabajar es:
Antigravity IDE se conecta al servicio externo usando una clave de acceso
momentánea (un token que el dueño genera ahí mismo para esa tarea puntual, y
que después de usarse se revoca — nunca queda como una conexión permanente),
hace el ajuste, y listo. Claude Code sigue siendo quien decide **qué** hay
que configurar y por qué, pero Antigravity es quien ejecuta la conexión.

Entonces, apenas se detecte que la tarea requiere esto, **la recomendación
por defecto es pedirle a Antigravity que lo haga, no guiar al dueño clic por
clic en el panel del servicio** (Vercel, etc.) — esa vía manual es lenta,
propensa a errores de la propia interfaz (ya pasó con un botón "Save" que no
guardaba), y de todas formas Claude Code no puede escribir la clave por él.
Hay que entregar de inmediato un prompt listo para copiar y pegar en
Antigravity, sin que el dueño tenga que pedirlo aparte ni que Claude Code
intente primero el camino manual.

Ese prompt debe, siempre:
- Explicar el contexto exacto: qué se intentó desde Claude Code, qué falta,
  y por qué.
- Dejar explícito que Antigravity **NO debe tocar código, base de datos, ni
  Git** — el equipo de Claude Code ya está trabajando ahí activamente; su
  alcance es únicamente la acción externa puntual (ej. Vercel).
- Pedir que Antigravity **no muestre tokens ni claves en su respuesta
  final**, solo un resumen de lo que hizo (esto ya falló dos veces el
  2026-08-26 — un token de Vercel quedó expuesto en el chat cada vez).
- Pedir confirmación explícita antes de cualquier acción destructiva o
  irreversible (borrar proyectos, dominios, etc.).
- Indicar que lea los valores sensibles (URLs, claves) directamente de
  `.env.local` en la raíz del proyecto en vez de que el dueño los reescriba a
  mano — así ninguna clave pasa por texto de por medio.
