-- ===================================================================
-- FASE I — Reservas y auditoría en la nube
-- ===================================================================
-- Aditivo, tablas 100% nuevas. Reservations/audit_logs vivían solo en
-- memoria del navegador desde el inicio del proyecto (documentado en
-- CLAUDE.md §6 como hueco de la Fase 2b) — se perdían al recargar.
-- Misma postura de RLS que el resto de tablas operativas (docs/decisions/0002).
-- ===================================================================

CREATE TABLE IF NOT EXISTS public.reservations (
    id TEXT PRIMARY KEY,
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT,
    party_size INT NOT NULL,
    reservation_date TEXT NOT NULL,
    reservation_time TEXT NOT NULL,
    zone_preference TEXT,
    table_id TEXT,
    status TEXT DEFAULT 'pending',
    special_requests TEXT,
    deposit_amount NUMERIC(10, 2) DEFAULT 0.00,
    payment_status TEXT DEFAULT 'none',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id TEXT PRIMARY KEY,
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    ts_label TEXT NOT NULL,
    user_id TEXT,
    user_name TEXT,
    user_role TEXT,
    action TEXT NOT NULL,
    description TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reservations_anon_all" ON public.reservations
  FOR ALL TO anon USING (true) WITH CHECK (true);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_logs_anon_all" ON public.audit_logs
  FOR ALL TO anon USING (true) WITH CHECK (true);

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.reservations;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_logs;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;
