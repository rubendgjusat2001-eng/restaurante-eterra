# 0005 — Configuración obligatoria de cuenta en el primer login

**Fecha:** 2026-08-26
**Estado:** Vigente

## Contexto

El dueño reportó que la contraseña provisional creada por
`scripts/migrate_credentials.js` en el arranque del sistema (`admin@eterra.pe` /
`Admin2026!*`) seguía siendo válida incluso después de haber configurado
credenciales "nuevas". Auditando el código se confirmó la causa raíz: **no
existía ningún mecanismo que forzara u obligara a rotar esa contraseña**. El
`display_name` de la cuenta de dueño quedaba fijo en `"Propietario"` (no un
nombre real), el `username` nunca era editable desde la UI, y
`change-password` solo se ejecutaba si el dueño lo hacía voluntariamente desde
Ajustes — nada lo exigía, nada avisaba que la cuenta seguía en modo
provisional.

## Decisión

Se agregó `access_accounts.must_change_password` (booleano). La migración
`004_credentials_hardening.sql` lo marca en `true` para la fila de dueño
existente y le asigna su nombre real ("Rubén Daniel González Juárez" — dato
público, seguro de versionar). Mientras ese campo sea `true`:

- `POST /api/auth/login` y `GET /api/auth/me` lo devuelven en la respuesta y lo
  incluyen en el JWT de sesión (`SessionClaims.mustChangePassword`).
- `src/app/sistema/page.tsx` intercepta el render entre "no autenticado" y "ERP
  normal": si hay sesión válida pero `mustChangePassword` es `true`, muestra
  `AccountSetupScreen.tsx` en vez del ERP — no hay forma de saltarse esta
  pantalla desde la UI.
- `AccountSetupScreen` exige la contraseña actual (para confirmar identidad,
  igual que `change-password`) y una contraseña nueva de al menos 8
  caracteres, más usuario/email opcionales. `POST /api/auth/complete-setup`
  verifica la contraseña actual con bcrypt, sobrescribe el hash, pone
  `must_change_password = false`, y si la cuenta es `owner` incrementa
  `restaurants.auth_version` (mismo mecanismo de "kill switch" que ya usa
  `change-password` — cierra sesión en el resto de dispositivos).

`GET /api/auth/me` revalida `must_change_password` contra la base de datos en
cada carga (no solo confía en el JWT firmado), igual que ya hacía con
`auth_version` — así, completar la configuración en un dispositivo se refleja
de inmediato en cualquier otra pestaña abierta con la misma cuenta.

## Por qué una pantalla en vez de un script

Ya existía el patrón de "correr un script local" (`migrate_credentials.js`,
`clean_cloud_data.js`) para tareas de un solo uso. Se descartó para este caso
porque: (1) el dueño pidió explícitamente que el sistema lo *obligue* en el
primer login, no que dependa de acordarse de correr algo; (2) un flujo en la
app funciona igual para cualquier restaurante futuro (multi-tenant, ver
CLAUDE.md §6.2), mientras que un script es un paso manual por cliente; (3) no
requiere que el dueño tenga la service role key a mano.

## Bug real encontrado durante la verificación (no relacionado a la causa raíz original)

Al probar el flujo en vivo, el dueño completó la configuración obligatoria
correctamente, pero al navegar dentro del ERP y volver a cargar la página, el
candado desaparecía. Causa: `src/app/sistema/page.tsx` (ruta `/sistema`) y
`src/app/sistema/[section]/page.tsx` (rutas `/sistema/mesas`,
`/sistema/caja`, etc.) eran **dos archivos con el shell del ERP duplicado**
— Next.js exige un archivo de página por ruta, y esa duplicación ya existía
desde antes. Se actualizó el candado (`mustChangePassword`) solo en el
primero; el segundo, usado en cualquier carga directa o F5 de una sub-sección,
se quedó sin él y dejaba pasar directo al ERP.

Se corrigió extrayendo TODO el shell (candado de autenticación, cabecera,
sidebar, las 7 vistas) a `src/components/internal/SistemaApp.tsx` — ambos
archivos de ruta ahora son solo un wrapper de una línea que renderiza ese
componente. Estructuralmente ya no es posible que las dos rutas se
desincronicen entre sí, porque solo existe una implementación.

## Qué NO cambió

El modelo de dos niveles (`access_accounts` / `staff_credentials`, ver
`docs/decisions/0001-two-tier-auth.md`) no se tocó — esto es un endurecimiento
del Nivel 1, no un cambio de arquitectura. La postura de RLS de
`docs/decisions/0002-rls-posture-phase1.md` tampoco cambia: `access_accounts`
sigue siendo deny-by-default real, solo accesible por `service_role`.
