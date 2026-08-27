# 0011 — Almacén (Fase H, módulo nuevo)

**Fecha:** 2026-08-27
**Estado:** Vigente

## Contexto

El dueño pidió un módulo de Almacén "bien pensado para restaurantes grandes,
lo más grandes que pueden haber en Perú, cadenas de restaurantes, y hasta
restaurantes pequeños" — configurable y fácil de usar. No existía absolutamente
ninguna tabla ni componente de inventario en el proyecto antes de esta fase.

## Decisión

Se construyó un MVP completo y funcional: `warehouse_items` (insumos, con
categoría y unidad libres — no un enum fijo, para que se adapte a cualquier
tipo de restaurante), `warehouse_movements` (entradas/salidas/ajustes de
stock, con motivo y quién lo registró) y `warehouse_suppliers` (proveedores).
Nueva vista `AlmacenView.tsx`, con alerta visual de stock bajo el mínimo
configurado por insumo.

## Alcance — qué se dejó explícitamente fuera de este MVP

Para no disparar el alcance de una sola fase, no se construyó (queda como
evolución futura, cuando el dueño lo pida):
- **Descuento automático de insumos por receta** al vender un plato (vincular
  `menu_items` con cantidades de `warehouse_items` consumidos) — el `MenuItem`
  actual solo tiene un `costPrice` plano, sin lista de ingredientes.
- **Multi-sede**: cada tabla ya lleva `restaurant_id` (preparado para cuando
  se cierre el multi-tenant real, ver CLAUDE.md §6.2), pero no hay concepto
  de "varios almacenes/ubicaciones" dentro de un mismo restaurante todavía.

## Integración con Permisos de Roles (Fase G)

Se agregó el módulo `warehouse` al sistema de permisos de la Fase G, con el
mismo criterio que el resto de "Gestión": visible para `owner`/`manager` por
defecto, oculto para el resto — configurable desde Personal → Permisos de
Roles como cualquier otro módulo.
