-- ===================================================================
-- FASE H — Almacén (nuevo módulo, MVP)
-- ===================================================================
-- Aditivo, 100% nuevo — no existía ninguna tabla de inventario antes.
-- Pensado para escalar desde un restaurante chico hasta una cadena grande:
-- categorías y unidades son texto libre (configurables por el dueño, no un
-- enum fijo), cada tabla ya lleva restaurant_id para cuando se cierre el
-- multi-tenant (CLAUDE.md §6.2).
--
-- Fuera de alcance deliberado de este MVP (evolución futura, NO construida
-- ahora): descuento automático de insumos por receta/BOM al vender un
-- plato, y soporte multi-sede (varias ubicaciones de almacén por
-- restaurante). Se deja anotado para no disparar el alcance de esta fase.
-- ===================================================================

CREATE TABLE IF NOT EXISTS public.warehouse_suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    contact_name TEXT,
    phone TEXT,
    email TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.warehouse_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    unit TEXT NOT NULL,
    current_stock NUMERIC(12, 3) NOT NULL DEFAULT 0,
    min_stock NUMERIC(12, 3) NOT NULL DEFAULT 0,
    supplier_id UUID REFERENCES public.warehouse_suppliers(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.warehouse_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    item_id UUID REFERENCES public.warehouse_items(id) ON DELETE CASCADE,
    movement_type TEXT NOT NULL, -- 'in' | 'out' | 'adjustment'
    quantity NUMERIC(12, 3) NOT NULL,
    reason TEXT NOT NULL,
    created_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.warehouse_suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "warehouse_suppliers_anon_all" ON public.warehouse_suppliers
  FOR ALL TO anon USING (true) WITH CHECK (true);

ALTER TABLE public.warehouse_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "warehouse_items_anon_all" ON public.warehouse_items
  FOR ALL TO anon USING (true) WITH CHECK (true);

ALTER TABLE public.warehouse_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "warehouse_movements_anon_all" ON public.warehouse_movements
  FOR ALL TO anon USING (true) WITH CHECK (true);

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.warehouse_suppliers;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.warehouse_items;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.warehouse_movements;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- Semilla de Permisos de Roles (Fase G, migración 011) para el módulo nuevo
-- "warehouse" — sin esto, canView('warehouse') se leería como "false" para
-- cualquier rol que no sea owner en cuanto la migración 011 ya haya corrido
-- (deja de estar "vacía", y una tabla sin filas para este módulo específico
-- se interpretaría como sin acceso). Mismo criterio que "Gestión": visible
-- para owner/manager, oculto para el resto por defecto.
INSERT INTO public.role_permissions (restaurant_id, role, module, can_view, can_edit, can_delete)
SELECT r.id, x.role, 'warehouse', x.can_view, x.can_edit, x.can_delete
FROM public.restaurants r
CROSS JOIN (VALUES
  ('owner', true, true, true),
  ('manager', true, true, false)
) AS x(role, can_view, can_edit, can_delete)
WHERE EXISTS (SELECT 1 FROM public.role_permissions rp WHERE rp.restaurant_id = r.id)
  AND NOT EXISTS (
    SELECT 1 FROM public.role_permissions existing
    WHERE existing.restaurant_id = r.id AND existing.role = x.role AND existing.module = 'warehouse'
  );
