-- ===================================================================
-- FASE D — Zonas configurables del salón
-- ===================================================================
-- Aditivo puro: no borra ni modifica columnas existentes. Reemplaza el tipo
-- hardcodeado ('Principal' | 'Terraza Marina' | 'Zona VIP' | 'Barra') por una
-- tabla editable desde Configuración. Se pre-cargan esas mismas 4 zonas para
-- el/los restaurantes ya existentes, así nada se rompe — solo se vuelve
-- editable a partir de ahora.
-- ===================================================================

CREATE TABLE IF NOT EXISTS public.restaurant_zones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.restaurant_zones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "restaurant_zones_anon_all" ON public.restaurant_zones
  FOR ALL TO anon USING (true) WITH CHECK (true);

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.restaurant_zones;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

INSERT INTO public.restaurant_zones (restaurant_id, name, sort_order)
SELECT r.id, z.zone_name, z.ord
FROM public.restaurants r
CROSS JOIN (VALUES
  ('Principal', 1),
  ('Terraza Marina', 2),
  ('Zona VIP', 3),
  ('Barra', 4)
) AS z(zone_name, ord)
WHERE NOT EXISTS (
  SELECT 1 FROM public.restaurant_zones existing WHERE existing.restaurant_id = r.id
);
