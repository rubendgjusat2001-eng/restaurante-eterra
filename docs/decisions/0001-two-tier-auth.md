# 0001 — Autenticación de dos niveles (cuenta de acceso vs. PIN de colaborador)

**Fecha:** 2026-08-26
**Estado:** Vigente

## Contexto

El sistema original mezclaba dos cosas distintas bajo un solo concepto de
"usuario": el PIN de 4 dígitos servía tanto para "entrar al sistema" como para
"identificar quién hace una acción". El dueño pidió explícitamente separarlo:
cuentas de turno compartidas (usuario + contraseña) para entrar, y el PIN solo
para identificar a la persona real dentro de una sesión ya activa.

## Decisión

- **Nivel 1** (`access_accounts`): usuario + contraseña, controla el acceso al
  sistema. El dueño crea cuentas como "Turno Día"/"Turno Noche" desde
  Personal → Cuentas de Acceso.
- **Nivel 2** (`staff_credentials`): PIN de 4 dígitos, identifica a un
  colaborador específico en el momento de una acción sensible. No otorga
  acceso — se dispara con `requestStaffIdentity()` desde cualquier flujo que
  lo necesite.

## Por qué importa para el código

`currentUser` (la sesión activa) es ahora una **cuenta de acceso**, no una
persona de `staff_users`. Sus IDs son UUIDs de `access_accounts`, mientras que
`staff_users.id` son strings tipo `user-owner`. Son namespaces distintos.

**Bug real que causó esto:** al construir esta feature, varios componentes
seguían usando `currentUser || staff[0]` como si `currentUser` fuera un
colaborador válido (patrón heredado de cuando el PIN sí era el login). Esto
hacía que `verifyStaffPin()` recibiera el UUID de la cuenta de acceso en vez
del ID real del colaborador, y el servidor rechazaba la identificación con
401 aunque el PIN fuera correcto. Se corrigió reemplazando esos fallbacks por
`staff[0]` o por el colaborador realmente asignado a la mesa/orden.

**Si una IA futura ve `currentUser` usado como candidato de identificación por
PIN, es casi seguro un bug — no un patrón a replicar.**
