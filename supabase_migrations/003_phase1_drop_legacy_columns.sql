-- ===================================================================
-- FASE 1 — SEGURIDAD CRÍTICA (3/3): Limpieza final
-- ===================================================================
-- ⚠️ Ejecutar SOLO al final, después de confirmar en producción durante unos
-- días que login, PIN de identificación, F5, inactividad de 15 min, cierre de
-- sesión global y el sync en tiempo real funcionan correctamente con 002 ya
-- aplicado. Este paso es irreversible sin un backup: borra las columnas viejas
-- en texto plano que ya no usa ningún código.
-- ===================================================================

-- Retira la fila sentinela del hack de kill-switch anterior (el timestamp ahora
-- vive en restaurants.auth_version / force_logout_timestamp, columnas reales).
DELETE FROM public.staff_users WHERE id = 'system-security';

ALTER TABLE public.staff_users DROP COLUMN IF EXISTS pin;
ALTER TABLE public.restaurants DROP COLUMN IF EXISTS owner_password;
