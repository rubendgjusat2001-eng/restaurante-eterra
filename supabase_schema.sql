-- ===================================================================
-- ESQUEMA SQL OFICIAL PARA SISTEMA DE RESTAURANTES (POSTGRESQL / SUPABASE)
-- ===================================================================

-- 1. Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLA: RESTAURANTES (MULTI-TENANT)
CREATE TABLE IF NOT EXISTS public.restaurants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    slogan TEXT,
    story TEXT,
    hero_image_url TEXT,
    phone TEXT,
    whatsapp TEXT,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. TABLA: PERSONAL / STAFF
CREATE TABLE IF NOT EXISTS public.staff_users (
    id TEXT PRIMARY KEY,
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    pin TEXT NOT NULL,
    avatar TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. TABLA: MESAS DEL RESTAURANTE
CREATE TABLE IF NOT EXISTS public.tables (
    id TEXT PRIMARY KEY,
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    number TEXT NOT NULL,
    zone TEXT NOT NULL,
    capacity INT DEFAULT 4,
    status TEXT DEFAULT 'available',
    customer_count INT,
    current_order_id TEXT,
    seated_at TEXT,
    opened_timestamp BIGINT,
    opened_by_user_id TEXT,
    opened_by_user_name TEXT,
    assigned_waiter_id TEXT,
    assigned_waiter_name TEXT,
    closed_by_user_id TEXT,
    closed_by_user_name TEXT,
    closed_at TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. TABLA: PLATOS DEL MENÚ
CREATE TABLE IF NOT EXISTS public.menu_items (
    id TEXT PRIMARY KEY,
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    category_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL,
    image_url TEXT,
    station TEXT NOT NULL,
    is_available BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. TABLA: COMANDAS Y PEDIDOS
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    table_id TEXT,
    table_number TEXT,
    waiter_id TEXT NOT NULL,
    waiter_name TEXT NOT NULL,
    opened_by_user_id TEXT,
    opened_by_user_name TEXT,
    closed_by_user_id TEXT,
    closed_by_user_name TEXT,
    closed_at TEXT,
    order_type TEXT DEFAULT 'dine_in',
    status TEXT DEFAULT 'active',
    items JSONB DEFAULT '[]'::jsonb,
    subtotal NUMERIC(10, 2) DEFAULT 0.00,
    tax NUMERIC(10, 2) DEFAULT 0.00,
    tip NUMERIC(10, 2) DEFAULT 0.00,
    discount NUMERIC(10, 2) DEFAULT 0.00,
    total NUMERIC(10, 2) DEFAULT 0.00,
    payment_method TEXT DEFAULT 'pending',
    invoice_type TEXT,
    customer_document TEXT,
    customer_name TEXT,
    customer_phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. TABLA: TURNOS DE CAJA (ARQUEOS CORTE X / CORTE Z)
CREATE TABLE IF NOT EXISTS public.cash_shifts (
    id TEXT PRIMARY KEY,
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    shift_name TEXT NOT NULL,
    opened_by TEXT NOT NULL,
    closed_by TEXT,
    opened_at TEXT NOT NULL,
    closed_at TEXT,
    initial_cash NUMERIC(10, 2) NOT NULL,
    system_total_sales NUMERIC(10, 2) DEFAULT 0.00,
    system_cash_sales NUMERIC(10, 2) DEFAULT 0.00,
    system_card_sales NUMERIC(10, 2) DEFAULT 0.00,
    system_yape_plin_sales NUMERIC(10, 2) DEFAULT 0.00,
    counted_cash_total NUMERIC(10, 2),
    counted_card_total NUMERIC(10, 2),
    counted_yape_plin_total NUMERIC(10, 2),
    cash_difference NUMERIC(10, 2),
    status TEXT DEFAULT 'open',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. HABILITAR PUBLICACIÓN EN TIEMPO REAL (WEBSOCKETS)
ALTER PUBLICATION supabase_realtime ADD TABLE public.tables;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.menu_items;
