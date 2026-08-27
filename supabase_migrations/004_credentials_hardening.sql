-- ===================================================================
-- FASE 2 — ENDURECIMIENTO DE CREDENCIALES: configuración obligatoria
-- ===================================================================
-- Aditivo: no borra ni modifica columnas existentes, salvo el UPDATE puntual
-- de la fila de dueño al final (comentado abajo). Seguro de ejecutar en
-- producción en cualquier momento.
--
-- Motivo: la contraseña provisional creada por scripts/migrate_credentials.js
-- (admin@eterra.pe / Admin2026!*) no tenía ningún mecanismo que obligara a
-- rotarla — podía seguir siendo válida para siempre. Esta migración agrega:
--   - `must_change_password`: fuerza una pantalla de configuración obligatoria
--     en el próximo login (ver src/components/common/AccountSetupScreen.tsx).
--   - `email`: correo de contacto editable para la cuenta de acceso.
--   - `staff_id`: enlace opcional hacia el expediente de personal
--     (staff_users), para que Nivel 1 (login) y Nivel 2 (PIN) puedan
--     compartir un mismo nombre real en vez de vivir desincronizados.
-- ===================================================================

ALTER TABLE public.access_accounts
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS staff_id TEXT REFERENCES public.staff_users(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS access_accounts_staff_id_unique
  ON public.access_accounts(staff_id) WHERE staff_id IS NOT NULL;

-- Marca la cuenta de dueño actual para que, en su próximo login, el sistema la
-- obligue a definir usuario/email/contraseña propios antes de dejarla entrar
-- al ERP. También registra su nombre real (dato público, no sensible — seguro
-- de dejarlo en una migración versionada).
UPDATE public.access_accounts
  SET must_change_password = true,
      display_name = 'Rubén Daniel González Juárez'
  WHERE role = 'owner';
