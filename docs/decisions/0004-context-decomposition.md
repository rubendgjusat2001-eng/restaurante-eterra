# 0004 — División de RestaurantContext.tsx en hooks + services por dominio

**Fecha:** 2026-08-26
**Estado:** Vigente

## Contexto

`RestaurantContext.tsx` creció hasta ~1940 líneas: un solo archivo con todo el
estado de la app, todas las llamadas a Supabase, las 4 suscripciones en tiempo
real, y la autenticación. Cualquier cambio corría el riesgo de afectar algo
sin relación aparente. El dueño pidió reorganizar el sistema pensando en que
una IA (o programador) futuro, sin contexto previo, lo mantenga sin romper
nada — este es el primer paso concreto de esa reorganización (Fase 2a).

## Decisión

Se dividió en tres capas:

- **`src/services/`** — funciones puras que llaman a Supabase (una por
  dominio: `restaurant`, `staff`, `menu`, `tables`, `orders`). Sin React.
  **Importante:** sigue usando la anon key desde el navegador, misma postura
  de RLS que antes — esto NO es la "capa de servicios" que menciona
  `docs/decisions/0002-rls-posture-phase1.md` (esa mueve las escrituras a
  rutas de servidor). Son conceptos distintos con un nombre parecido — no
  asumir que crear estos archivos cerró el hueco de seguridad de RLS.
- **`src/hooks/`** — un hook de React por dominio (estado + efectos + su
  propia suscripción en tiempo real si aplica). Dos hooks son "orquestadores"
  (`use-table-lifecycle.ts` para abrir/mudar mesa, `use-checkout.ts` para
  cobrar) porque esas acciones tocan varios dominios a la vez a propósito
  (mesas + pedidos + personal + caja) — no es un error de organización, es lo
  que la acción de negocio realmente hace.
- **`src/context/RestaurantContext.tsx`** — quedó reducido a ~350 líneas: solo
  junta los hooks en un único objeto de contexto, con la MISMA forma que
  tenía antes. Por eso ningún componente de los 25 que usan `useRestaurant()`
  necesitó cambiar una sola línea.

## Por qué un `ref` para `currentUser` en vez de pasar el valor directo

Auth, Personal y Auditoría se necesitan mutuamente: Auth usa la lista de
`staff` (para el selector de PIN), Personal usa `currentUser.role` (permiso
para cambiar PINs de otros), y Auditoría usa `currentUser` (para atribuir cada
registro). Como los hooks de React se llaman en un orden fijo y ninguno puede
llamar a otro hook directamente, un `currentUserRef` (actualizado por un
`useEffect` en `RestaurantProvider`) rompe ese ciclo: Personal y Auditoría se
construyen primero leyendo el ref (todavía vacío), y Auth se construye
después con el valor real — el ref se mantiene sincronizado en cada render.

## Qué NO cambió (a propósito)

Ningún comportamiento visible cambió en este paso — es una reorganización
pura. En particular:
- Ninguna función se envolvió en `useCallback` que no lo estuviera ya (el
  archivo original casi no usaba memoización; copiar ese patrón exactamente
  evita introducir bugs de "closure vieja" que son fáciles de meter sin querer
  al dividir un archivo grande).
- Los huecos de datos que no se guardan en la nube (caja, reservas, pedidos
  online, auditoría) se extrajeron TAL CUAL estaban — arreglarlos es un paso
  aparte (Fase 2b), no mezclado con la reorganización.

## Bug real encontrado durante la verificación (no introducido por este cambio)

Al probar el cobro de una mesa después de la división, apareció un PIN
"incorrecto" con un PIN que sí era correcto. La causa: `CashierDesk.tsx`
guardaba el cajero seleccionado con `useState(() => staff.find(...) ||
staff[0])` — un valor que se congela en el primer render, antes de que
termine de llegar la lista real de personal desde Supabase. Si el usuario
cobra muy rápido, queda seleccionado el colaborador de los datos de ejemplo
(`user-01`) en vez del real (`user-owner`), y el PIN se valida contra un ID
que no existe en la base de datos. Ya estaba así antes de esta reorganización
(no lo causó); se corrigió agregando un `useEffect` que reemplaza la
selección si el ID seleccionado ya no existe en la lista real de personal.
