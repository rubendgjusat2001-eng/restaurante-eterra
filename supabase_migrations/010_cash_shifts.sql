-- ===================================================================
-- FASE F — Persistencia real de Caja + una sola caja abierta a la vez
-- ===================================================================
-- Aditivo. cash_shifts ya existia (Fase 1) pero el codigo nunca la usaba
-- (todo vivia solo en memoria del navegador, se perdia al recargar). Se
-- agregan las columnas que el tipo CashShift ya esperaba, mas un vinculo
-- orders.shift_id para poder reportar "quien atendio / quien cobro" por
-- turno, mas una tabla de movimientos manuales por categoria (egresos como
-- "Pago a Trabajadores"), mas la regla dura de una sola caja abierta.
-- ===================================================================

ALTER TABLE public.cash_shifts
  ADD COLUMN IF NOT EXISTS system_other_sales NUMERIC(10, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS manual_cash_withdrawals NUMERIC(10, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS manual_cash_entries NUMERIC(10, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS counted_cash_breakdown JSONB,
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Regla dura: nunca dos turnos abiertos a la vez para el mismo restaurante,
-- ni siquiera si dos dispositivos intentan abrir turno en el mismo instante
-- (una condicion de carrera que una validacion solo en la app no cubre).
CREATE UNIQUE INDEX IF NOT EXISTS cash_shifts_one_open_per_restaurant
  ON public.cash_shifts(restaurant_id)
  WHERE status = 'open';

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS shift_id TEXT;

CREATE TABLE IF NOT EXISTS public.cash_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    shift_id TEXT REFERENCES public.cash_shifts(id) ON DELETE CASCADE,
    movement_type TEXT NOT NULL, -- 'expense' | 'income'
    category TEXT NOT NULL,      -- ej. "Pago a Trabajadores", "Servicios y Otros"
    concept TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    created_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.cash_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cash_movements_anon_all" ON public.cash_movements
  FOR ALL TO anon USING (true) WITH CHECK (true);

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.cash_shifts;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.cash_movements;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;
