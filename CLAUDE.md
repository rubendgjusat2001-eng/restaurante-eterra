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
                                 change-password, set-staff-pin, accounts
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
                                 use-auth, use-staff, use-menu, use-tables,
                                 use-orders, use-table-lifecycle (orquestador:
                                 abrir/mudar mesa), use-checkout (orquestador:
                                 cobrar mesa), use-cash-shifts, use-reservations,
                                 use-cart, use-audit-log, use-toasts,
                                 use-restaurant-profile.
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
6. **Sin code-splitting** — las 7 vistas del ERP + modales pesados cargan en
   un solo bundle sin importar la sección activa.
7. **Caja/turnos, reservas, carrito público (pedidos online) y auditoría NO se
   guardan en Supabase** — viven solo en memoria del navegador, se pierden al
   recargar. La tabla `cash_shifts` ya existe pero el código nunca la usa;
   `reservations`/`audit_logs` ni siquiera tienen tabla todavía. Primer punto
   de Fase 2b (ver `src/hooks/use-cash-shifts.ts`, `use-reservations.ts`,
   `use-cart.ts`, `use-audit-log.ts` para el detalle exacto de qué falta).
8. **`submitOnlineOrder` no persiste el pedido en la nube** — inconsistente
   con el resto de comandas (que sí se guardan vía `persistOrderToCloud`).
   Es el arreglo más simple y urgente de la Fase 2b.

No "arregles" estos puntos de pasada dentro de una tarea distinta — son Fase 2,
se abordan aparte y con verificación completa.

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
