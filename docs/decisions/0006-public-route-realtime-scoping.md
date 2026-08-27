# 0006 — El portal público deja de abrir Realtime del ERP

**Fecha:** 2026-08-27
**Estado:** Vigente

## Contexto

`RestaurantProvider` envuelve todo el sitio en `layout.tsx` (portal público
`/` y ERP `/sistema/*` comparten el mismo árbol de React, ver
`docs/decisions/0004-context-decomposition.md`). Como los hooks de React se
llaman siempre en el mismo orden, `useTables`/`useOrders`/`useStaff` se
montaban sin condición alguna — es decir, cualquier visitante anónimo de la
web de clientes abría en silencio 3 suscripciones Realtime de Supabase
(mesas, pedidos, personal) y hacía 3 lecturas completas de esas tablas, sin
necesitarlas para nada (el portal público solo usa `restaurant`, `menuItems`,
`categories`, `cart`, `reservations`/`promotions` — confirmado con un grep de
`useRestaurant()` en los 6 componentes de `src/components/public/`). Esto
gasta la cuota gratuita de conexiones Realtime de Supabase con tráfico que no
la necesita, y expone datos operativos internos (estado de mesas, montos de
pedidos) al navegador de un visitante que nunca inició sesión.

## Decisión

`RestaurantContext.tsx` calcula `isPrivateRoute = pathname?.startsWith('/sistema')`
con `usePathname()` (`next/navigation`) y se lo pasa como dependencia a
`useTables`, `useOrders` y `useStaff`. Cada uno de esos hooks sigue
llamándose siempre (regla de hooks respetada, mismo orden en cada render) —
solo que su `useEffect` de fetch inicial y su canal Realtime hacen
`if (!isPrivateRoute) return;` antes de tocar Supabase. Se agregó
`isPrivateRoute` al arreglo de dependencias de esos efectos para que, al
navegar de `/` a `/sistema` sin recargar la página, el fetch/suscripción se
active recién en ese momento (y se desactive si se vuelve a `/`).

No se separó el contexto en dos providers distintos — habría roto la forma
única de `useRestaurant()` que usan los ~25 componentes existentes (ver
0004). `useRestaurantProfile` y `useMenu` NO llevan esta bandera porque el
portal público sí los necesita (tema visual, carta).

## Qué NO cambió

El comportamiento dentro de `/sistema/*` es idéntico a como estaba — mismos
fetches, misma sincronización en tiempo real entre dispositivos. Solo cambia
qué pasa en el portal público.
