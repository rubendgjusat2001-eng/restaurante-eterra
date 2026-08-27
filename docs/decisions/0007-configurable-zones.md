# 0007 — Zonas del local configurables (Fase D)

**Fecha:** 2026-08-27
**Estado:** Vigente

## Contexto

El dueño reportó que "los espacios del local... no se actualizan y no tienen
funcionalidad". Se investigó antes de tocar código y se confirmaron dos
problemas reales, distintos entre sí:

1. `Table.zone` era un tipo de TypeScript hardcodeado a 4 nombres fijos
   (`'Principal' | 'Terraza Marina' | 'Zona VIP' | 'Barra'`), repetido en 4
   archivos — imposible agregar una zona nueva sin editar código. La base de
   datos ya guardaba `zone` como `TEXT` libre, sin restricción — el límite
   era solo del frontend.
2. `updateTable` (la función para editar número/zona/capacidad de una mesa ya
   creada) existía en `use-tables.ts` desde la Fase 2a, pero **no tenía
   ningún botón que la llamara en ninguna pantalla** — no había forma de
   editar una mesa. Y el manejador de eventos Realtime en `use-tables.ts`
   ignoraba los campos `zone`/`number`/`capacity` al recibir una
   actualización de otro dispositivo — aunque se hubiera agregado un botón de
   editar, otros dispositivos conectados no habrían visto el cambio.

## Decisión

- Nueva tabla `restaurant_zones` (migración `008_zones.sql`), pre-cargada con
  las 4 zonas actuales — nada se rompe, se vuelve editable desde
  Configuración → "Zonas del Local".
- `Table.zone` pasa a `string` simple en todo el código.
- El mapa de mesas (`WaiterFloorMap.tsx`) genera sus pestañas de zona de
  forma dinámica: unión de lo que hay en `restaurant_zones` y de cualquier
  zona que ya tengan mesas existentes — así sigue funcionando aunque la
  migración todavía no se haya corrido, o si una mesa quedó con un nombre de
  zona que ya no está en el catálogo (defensivo, no rompe si los datos están
  desincronizados).
- Se agregó un botón de lápiz por mesa que abre un modal real de "Editar
  Mesa" (número, zona, capacidad, y eliminar), conectando por fin
  `updateTable`.
- Se corrigió el manejador de Realtime para incluir `zone`/`number`/
  `capacity` en las actualizaciones recibidas de otros dispositivos.

## Qué NO se tocó

El selector de zona del formulario de reservas del portal público
(`PublicReservations.tsx`) es un campo de preferencia del cliente, con su
propio texto descriptivo — es un concepto distinto al plano operativo de
mesas y no se modificó en esta fase.
