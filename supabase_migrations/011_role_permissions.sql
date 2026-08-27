-- ===================================================================
-- FASE G — Permisos de Roles configurables (solo Usuarios, Nivel 1)
-- ===================================================================
-- Aditivo. Aplica UNICAMENTE a access_accounts.role (Nivel 1 — quien entra
-- al sistema y que pantallas ve). El PIN de Personal (Nivel 2) nunca tiene
-- permisos propios, tal como se definio con el dueno.
--
-- Se pre-cargan filas que replican EXACTAMENTE el comportamiento actual
-- (hardcodeado hasta ahora en SidebarDrawer.tsx) para que activar esto no
-- cambie nada visible hasta que el dueno decida reconfigurar algo.
-- ===================================================================

CREATE TABLE IF NOT EXISTS public.role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    module TEXT NOT NULL,
    can_view BOOLEAN NOT NULL DEFAULT false,
    can_edit BOOLEAN NOT NULL DEFAULT false,
    can_delete BOOLEAN NOT NULL DEFAULT false,
    UNIQUE(restaurant_id, role, module)
);

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "role_permissions_anon_all" ON public.role_permissions
  FOR ALL TO anon USING (true) WITH CHECK (true);

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.role_permissions;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- Semilla: replica el comportamiento actual hardcodeado (owner = todo;
-- manager = todo menos Configuracion; el resto = solo pantallas operativas).
INSERT INTO public.role_permissions (restaurant_id, role, module, can_view, can_edit, can_delete)
SELECT r.id, x.role, x.module, x.can_view, x.can_edit, x.can_delete
FROM public.restaurants r
CROSS JOIN (VALUES
  ('owner', 'waiter', true, true, true),
  ('owner', 'kitchen', true, true, true),
  ('owner', 'cashier', true, true, true),
  ('owner', 'owner', true, true, true),
  ('owner', 'dishes', true, true, true),
  ('owner', 'staff', true, true, true),
  ('owner', 'settings', true, true, true),
  ('manager', 'waiter', true, true, true),
  ('manager', 'kitchen', true, true, true),
  ('manager', 'cashier', true, true, true),
  ('manager', 'owner', true, true, false),
  ('manager', 'dishes', true, true, true),
  ('manager', 'staff', true, true, false),
  ('manager', 'settings', false, false, false),
  ('cashier', 'waiter', true, false, false),
  ('cashier', 'kitchen', true, false, false),
  ('cashier', 'cashier', true, true, false),
  ('waiter', 'waiter', true, true, false),
  ('waiter', 'kitchen', true, false, false),
  ('waiter', 'cashier', true, false, false),
  ('waiter_cashier', 'waiter', true, true, false),
  ('waiter_cashier', 'kitchen', true, false, false),
  ('waiter_cashier', 'cashier', true, true, false),
  ('kitchen', 'waiter', true, false, false),
  ('kitchen', 'kitchen', true, true, false),
  ('bar', 'waiter', true, false, false),
  ('bar', 'kitchen', true, true, false)
) AS x(role, module, can_view, can_edit, can_delete)
WHERE NOT EXISTS (
  SELECT 1 FROM public.role_permissions existing WHERE existing.restaurant_id = r.id
);
