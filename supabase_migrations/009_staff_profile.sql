-- ===================================================================
-- FASE E — Expediente de personal, Cargos y gastos/pagos por colaborador
-- ===================================================================
-- Aditivo puro. `staff_users.role` sigue siendo la función OPERATIVA
-- (a qué estación de cocina va su comanda, quién aparece como "atendió"/
-- "cobró") y NO se toca — el Cargo (`staff_positions`) es un concepto nuevo
-- y separado, solo informativo/RRHH (como en el ejemplo del hotel: "los
-- cargos describen el puesto de trabajo, no conceden permisos").
-- ===================================================================

CREATE TABLE IF NOT EXISTS public.staff_positions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.staff_positions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff_positions_anon_all" ON public.staff_positions
  FOR ALL TO anon USING (true) WITH CHECK (true);

ALTER TABLE public.staff_users
  ADD COLUMN IF NOT EXISTS position_id UUID REFERENCES public.staff_positions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS document_id TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS hire_date DATE,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT;

CREATE TABLE IF NOT EXISTS public.staff_expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    staff_id TEXT REFERENCES public.staff_users(id) ON DELETE CASCADE,
    concept TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_by TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.staff_expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff_expenses_anon_all" ON public.staff_expenses
  FOR ALL TO anon USING (true) WITH CHECK (true);

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.staff_positions;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.staff_expenses;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;
