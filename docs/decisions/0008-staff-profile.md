# 0008 — Expediente de personal, Cargos y gastos/pagos (Fase E)

**Fecha:** 2026-08-27
**Estado:** Vigente

## Contexto

El dueño pidió, inspirado en un sistema hotelero que administra, que
"Personal" deje de ser solo un nombre + PIN y se convierta en un expediente
real por colaborador: datos de contacto, un **Cargo** (puesto de trabajo,
catálogo propio), y el registro de gastos/pagos hechos a esa persona
(adelantos, sueldos) para poder verlos agrupados por colaborador.

Fue explícito en una distinción importante: el Cargo es informativo/RRHH y
**no debe otorgar permisos**. En este codebase, `staff_users.role` ya existe
desde antes (Fase 1/2a) y determina algo distinto: la función OPERATIVA de la
persona (a qué estación de KDS va su comanda si es cocina/bar, y quién
aparece como "mesero que atendió" o "cajero que cobró" en una mesa/pedido).
Confundir esos dos campos habría sido el error — se mantuvieron separados.

## Decisión

- Nueva tabla `staff_positions` (Cargo): catálogo editable desde Personal →
  Cargos, igual patrón que `restaurant_zones` (Fase D).
- `staff_users` gana `position_id` (FK opcional a Cargo) + campos de
  contacto (`phone`, `document_id`, `email`, `hire_date`, `address`,
  `notes`) — todos opcionales, no rompen nada existente.
- Nueva tabla `staff_expenses`: gastos/pagos por colaborador, con concepto,
  monto, fecha y quién lo registró.
- `staff.service.ts`/`mapRow` dejaba caer silenciosamente cualquier columna
  no listada — se corrigió para incluir los campos nuevos (antes, aunque se
  hubieran guardado en la base, nunca habrían llegado de vuelta al frontend).
- Nuevo componente `StaffDetailModal.tsx` (expediente completo: datos+Cargo,
  cambio de PIN, gastos/pagos) — **reemplaza el `prompt()` nativo del
  navegador** que se usaba antes para cambiar el PIN.

## Sobre "quién registra un gasto"

`insertStaffExpense` guarda `createdBy` con el nombre de la cuenta de acceso
(Nivel 1, `currentUser`) que lo registró — es solo un rastro de auditoría de
"qué sesión de administración lo cargó", **no** una atribución operativa tipo
"quién atendió la mesa" (eso sigue exigiendo `requestStaffIdentity()`/PIN,
ver `docs/decisions/0001-two-tier-auth.md`). No se mezclan los dos conceptos.

## Qué NO cambió

`access_accounts.role` (Nivel 1, permisos de acceso al sistema) no se tocó —
eso es la Fase G (Roles y Permisos), un sistema completamente aparte del
Cargo de esta fase.
