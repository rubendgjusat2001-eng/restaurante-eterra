-- ===================================================================
-- FASE 1 — SEGURIDAD CRÍTICA (2/2): Row Level Security
-- ===================================================================
-- ⚠️ NO ejecutar todavía junto con 001. Aplicar SOLO después de:
--   1. Ejecutar 001_phase1_credentials.sql
--   2. Correr scripts/migrate_credentials.js contra producción
--   3. Desplegar el código nuevo (rutas /api/auth/*, RestaurantContext.tsx,
--      SystemLoginScreen.tsx, PinPadModal.tsx actualizados) y confirmar que
--      login, PIN de identificación, F5 y el realtime siguen funcionando.
--
-- Ejecutar TODO este archivo de una sola vez (una transacción por bloque).
-- Antes de esto, la anon key pública tenía lectura/escritura total sobre
-- restaurants/staff_users/tables/orders/menu_items/cash_shifts (sin RLS).
-- ===================================================================

-- access_accounts y staff_credentials: deny-by-default real. Sin políticas
-- para anon/authenticated → solo el service_role (usado por los Route Handlers
-- del servidor) puede tocarlas.
ALTER TABLE public.access_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_credentials ENABLE ROW LEVEL SECURITY;

-- Resto de tablas: postura intermedia deliberada para Fase 1 (documentada como
-- riesgo residual conocido — se cierra en Fase 2 migrando cada escritura a una
-- capa de servicios). Se preserva el comportamiento actual para no romper la app,
-- pero ahora queda explícito y auditable en vez de "sin RLS por accidente".
-- IMPORTANTE: las políticas usan `TO anon` (no solo `authenticated`) porque esta
-- app nunca llama a supabase.auth.signIn — toda lectura/realtime hoy autentica
-- como rol `anon`.

ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "restaurants_anon_all" ON public.restaurants
  FOR ALL TO anon USING (true) WITH CHECK (true);

ALTER TABLE public.staff_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff_users_anon_all" ON public.staff_users
  FOR ALL TO anon USING (true) WITH CHECK (true);

ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tables_anon_all" ON public.tables
  FOR ALL TO anon USING (true) WITH CHECK (true);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders_anon_all" ON public.orders
  FOR ALL TO anon USING (true) WITH CHECK (true);

ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "menu_items_anon_all" ON public.menu_items
  FOR ALL TO anon USING (true) WITH CHECK (true);

ALTER TABLE public.cash_shifts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cash_shifts_anon_all" ON public.cash_shifts
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- Excepción de privilegio: un cliente puede seguir escribiendo en staff_users
-- (para que el mozo/cocina se sigan viendo en tiempo real, avatar, etc.) pero
-- NUNCA puede cambiar la columna `role` de una fila existente — evita que
-- alguien se auto-asigne 'owner' llamando directo a la API REST de Supabase.
-- El service_role (Route Handlers del servidor) sí puede, para cuando el dueño
-- cambie el rol de alguien desde el panel.
CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role AND auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'No autorizado: el rol no se puede modificar sin privilegios de servidor';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS staff_users_prevent_role_escalation ON public.staff_users;
CREATE TRIGGER staff_users_prevent_role_escalation
  BEFORE UPDATE ON public.staff_users
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_role_escalation();
