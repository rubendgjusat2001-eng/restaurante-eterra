# 0010 — Permisos de Roles configurables (Fase G)

**Fecha:** 2026-08-27
**Estado:** Vigente — enforcement parcial deliberado, ver "Alcance" abajo

## Contexto

Antes de esta fase, el control de acceso era ~20 verificaciones sueltas
(`currentUser?.role === 'owner'`, `role !== 'manager'`, etc.) repartidas en
15+ archivos, inconsistentes entre sí — por ejemplo, `manager` tenía acceso a
"Gestión" pero no a "Configuración" sin que eso estuviera documentado en
ningún lado. El dueño pidió, inspirado en un sistema hotelero, una matriz de
permisos configurable (Ver / Crear-Editar / Eliminar por módulo y por rol),
separada del PIN de Personal (que nunca tiene permisos propios).

## Decisión

- Nueva tabla `role_permissions` (role, module, can_view, can_edit,
  can_delete), pre-cargada replicando EXACTAMENTE el comportamiento actual
  (los ~20 checks encontrados durante la investigación) para que activar
  esto no cambie nada visible hasta que el dueño reconfigure algo.
- `use-permissions.ts`: `canView`/`canEdit`/`canDelete` por módulo, con dos
  redes de seguridad deliberadas:
  1. `owner` siempre tiene acceso total, sin importar la base de datos.
  2. Si la tabla está vacía (migración 011 no corrida todavía), no se oculta
     nada — igual que antes de esta fase.
- Nueva pantalla "Permisos de Roles" en Personal (antes era una pestaña
  fantasma que no mostraba nada distinto a la tabla de Personal).

## Alcance — qué SÍ y qué NO se reemplazó esta noche

Se aplicó el nuevo sistema a la **visibilidad de la navegación**
(`SidebarDrawer.tsx`: qué botones del menú lateral ve cada rol) — es un
cambio de bajo riesgo, puramente de interfaz.

**Deliberadamente NO se tocaron** los ~15 checks de autorización real
(rutas de servidor como `/api/auth/accounts`, `/api/auth/set-staff-pin`, ni
los botones de "eliminar"/"editar" dentro de cada pantalla). Motivo: esta
fase se hizo de madrugada, sin que el dueño pudiera probar el login en vivo
— reemplazar de una sola vez todos los puntos de control de acceso sin poder
verificarlo habría sido un riesgo real de dejar a alguien bloqueado (incluso
al propio dueño) sin nadie despierto para revisarlo. Esos checks siguen
funcionando exactamente igual que antes (ya eran correctos y seguros) y
migrarlos a `canEdit`/`canDelete` queda como un paso posterior, ya con el
dueño presente para probar cada cambio antes de subirlo.

## Qué NO cambió

El PIN de Personal (Nivel 2) sigue sin tener ningún concepto de permisos —
tal como se acordó, solo identifica quién hizo una acción.
