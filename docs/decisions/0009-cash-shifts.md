# 0009 — Persistencia real de Caja, una sola caja abierta, reporte por turno

**Fecha:** 2026-08-27
**Estado:** Vigente

## Contexto

`cash_shifts` existía desde la Fase 1 pero el código nunca la usaba — todo el
estado de caja (turno activo, historial de cierres) vivía solo en memoria del
navegador (`use-cash-shifts.ts`), documentado como hueco conocido desde la
Fase 2a. El dueño pidió, inspirado en un sistema hotelero que administra:
- Un panel en vivo con Efectivo Bruto / Tarjeta Bruto / Total Bruto (sin
  descontar egresos) del turno activo.
- Que sea **imposible tener dos cajas abiertas al mismo tiempo**.
- Un historial reordenado: Descuento → Total Bruto → Bruto Efectivo → Bruto
  Tarjeta → Egresos → Transferencia de Turno → Estado (Abierta/Cerrada), con
  detalle expandible por turno mostrando egresos por categoría.

## Decisión

- `cash_shifts` gana las columnas que el tipo `CashShift` ya esperaba
  (`system_other_sales`, `manual_cash_withdrawals`, `manual_cash_entries`,
  `counted_cash_breakdown`, `notes`).
- **Índice único parcial** `cash_shifts_one_open_per_restaurant` sobre
  `(restaurant_id) WHERE status = 'open'` — la regla de "una sola caja
  abierta" se refuerza en DOS capas: `openNewShift` la valida en la app
  (mensaje claro), y el índice la hace imposible incluso si dos dispositivos
  intentan abrir turno en el mismo instante (condición de carrera que una
  validación solo en la app no cubre). Si eso llegara a pasar, el cliente
  recarga el turno real desde la nube en vez de quedar con un estado
  inconsistente.
- Nueva tabla `cash_movements`: egresos/ingresos manuales por categoría (ej.
  "Pago a Trabajadores"), reemplaza los totales sueltos que existían antes
  sin desglose.
- `orders.shift_id`: cada venta cobrada queda ligada al turno en que se
  cobró — permite que el reporte cruce `waiterName` (quién atendió) y
  `closedByUserName` (quién cobró) por turno, sin adivinar por rango de
  horas.
- "Transferencia de Turno" en el historial = `countedCashTotal` del turno
  (lo que se contó/entregó al cerrar) — no se agregó un campo nuevo, es un
  valor que ya existía y se reetiquetó según el ejemplo del dueño.
- El panel en vivo (`InternalHeader.tsx`) ahora muestra Efectivo/Tarjeta/
  Total Bruto en vez de solo el total.

## Qué NO se hizo (fuera de alcance de esta fase)

No se agregó un sistema de aprobación/autorización para registrar un egreso
(cualquier cuenta con acceso a Caja puede hacerlo) — el dueño no lo pidió
explícitamente y agregar un candado ahí sin que lo pidiera habría sido
alcance no solicitado.
