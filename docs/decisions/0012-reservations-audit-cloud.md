# 0012 — Reservas y auditoría en la nube (Fase I)

**Fecha:** 2026-08-27
**Estado:** Vigente

## Contexto

`reservations` y `audit_logs` vivían solo en memoria del navegador desde el
inicio del proyecto — documentado en CLAUDE.md §6 como el hueco pendiente de
Fase 2b junto con caja (ya resuelto en la Fase F) y pedidos online (ya
resuelto en la Fase C). Una reserva hecha por un cliente, o una acción
auditable (anular un ítem, cerrar caja), se perdían por completo al recargar
la página.

## Decisión

Nuevas tablas `reservations` y `audit_logs`, mismo patrón fetch+realtime+
persist que el resto de dominios (`reservations.service.ts`,
`audit-log.service.ts`).

**Asimetría deliberada en `isPrivateRoute`**: la ESCRITURA nunca se limita a
`/sistema/*` (las reservas se crean desde el portal público, sin sesión; los
logs de auditoría se generan desde cualquier acción, en cualquier hook) —
solo la LECTURA/tiempo real (la lista que gestiona el ERP) se limita a la
ruta privada, igual criterio que mesas/pedidos/personal de la Fase B.

## Qué NO cambió

`updateReservationStatus`/`updatePromotion` mantienen su firma y
comportamiento exactos — solo se les agregó la persistencia de fondo.
