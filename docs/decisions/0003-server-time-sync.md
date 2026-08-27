# 0003 — Reloj corregido contra el servidor (no confiar en la hora del dispositivo)

**Fecha:** 2026-08-26
**Estado:** Vigente

## Contexto

El dueño notó que casi todos los timestamps del negocio (hora de apertura de
mesa, hora de un pedido, cierre de turno de caja, registros de auditoría) se
generaban con `new Date()` / `Date.now()` del navegador — es decir, con la
hora del dispositivo del mozo/cajero. Un reloj mal configurado (sin internet,
zona horaria incorrecta, o alterado a propósito) rompería reportes de turno,
disputas de tiempos de espera, y la integridad de la auditoría.

## Decisión

`src/lib/server-time.ts` sincroniza una sola vez (y cada 5 minutos) un
"offset" contra `GET /api/system/time` (la hora real del servidor), y expone
`serverNow()` / `serverDate()`. Todo timestamp que se **persiste** como
registro del negocio usa estas funciones en vez de `Date.now()`/`new Date()`
directos.

## Qué SÍ sigue usando el reloj local (y está bien)

- Generación de IDs únicos (`` `cmd-${Date.now()}` ``) — no es un timestamp de
  negocio, solo necesita ser "suficientemente único".
- Contadores puramente visuales que no se guardan (ej. un cronómetro en
  pantalla que se recalcula cada 10s) — igual se inicializan en `0` primero y
  se corrigen en un `useEffect`, para evitar un mismatch de hidratación entre
  servidor y cliente (ver nota de implementación abajo).

## Nota de implementación: por qué el estado inicial nunca es `Date.now()`

`useState(Date.now())` o `useState(new Date())` en un componente que se
renderiza en el servidor (todo componente `'use client'` en Next.js igual se
renderiza una vez en el servidor) causa un error de hidratación: el servidor
calcula la hora en un instante, el cliente en otro, y React detecta que el
HTML no coincide. El patrón correcto es inicializar en un valor fijo (`0` o
`null`) y fijar el valor real dentro de un `useEffect`, que solo corre en el
cliente después de hidratar.
