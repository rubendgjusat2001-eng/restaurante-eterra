-- ===================================================================
-- FASE 1 — SEGURIDAD CRÍTICA (1/2): Nuevas tablas de credenciales
-- ===================================================================
-- Aditivo puro: no modifica ni borra ninguna tabla/columna existente.
-- Seguro de ejecutar en producción en cualquier momento.
--
-- Modelo de dos niveles:
--   Nivel 1 (access_accounts)  = usuario+contraseña para ENTRAR al sistema
--                                  (dueño, "Turno Día", "Turno Noche", gerentes...)
--   Nivel 2 (staff_credentials) = PIN de cada colaborador, para IDENTIFICAR quién
--                                  hace una acción sensible ya dentro del sistema
--                                  (abrir/cerrar mesa, anular ítem, cerrar caja)
-- ===================================================================

CREATE TABLE IF NOT EXISTS public.access_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    display_name TEXT NOT NULL,
    role TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(restaurant_id, username)
);

CREATE TABLE IF NOT EXISTS public.staff_credentials (
    staff_id TEXT PRIMARY KEY REFERENCES public.staff_users(id) ON DELETE CASCADE,
    pin_hash TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- El código nuevo deja de escribir staff_users.pin (el PIN ahora se hashea y
-- guarda en staff_credentials). Se relaja el NOT NULL para que los nuevos
-- INSERT no fallen mientras la columna vieja sigue existiendo (se elimina en
-- 003_phase1_drop_legacy_columns.sql, al final del proceso).
ALTER TABLE public.staff_users ALTER COLUMN pin DROP NOT NULL;

-- Siguiente paso: correr `node scripts/migrate_credentials.js` para poblar estas
-- dos tablas con las credenciales actuales, ya hasheadas (bcrypt).
