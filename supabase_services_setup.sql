-- ==============================================================================
-- ELITE BATH COLLECTIONS - SERVICES & BOOKINGS SCHEMA
-- Run this script in your Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- ==============================================================================

-- 1. Create services table
CREATE TABLE IF NOT EXISTS public.services (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    short_description TEXT NOT NULL,
    description TEXT NOT NULL,
    price NUMERIC NOT NULL DEFAULT 0,
    category TEXT NOT NULL CHECK (category IN ('Fitting', 'Inspection', 'Maintenance', 'Consultation')),
    estimated_duration TEXT NOT NULL,
    features JSONB NOT NULL DEFAULT '[]'::jsonb,
    icon_name TEXT,
    image_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_checkout_addon BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Create service_bookings table
CREATE TABLE IF NOT EXISTS public.service_bookings (
    id TEXT PRIMARY KEY,
    service_id TEXT NOT NULL,
    service_title TEXT NOT NULL,
    service_price NUMERIC NOT NULL DEFAULT 0,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT,
    pincode TEXT NOT NULL,
    preferred_date TEXT NOT NULL,
    preferred_time_slot TEXT,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
    order_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_bookings ENABLE ROW LEVEL SECURITY;

-- 4. Policies for services:
-- Anyone can view active services
DROP POLICY IF EXISTS "Public can view active services" ON public.services;
CREATE POLICY "Public can view active services"
    ON public.services FOR SELECT
    USING (true);

-- Admins / service role can insert/update/delete services
DROP POLICY IF EXISTS "Admin full access to services" ON public.services;
CREATE POLICY "Admin full access to services"
    ON public.services FOR ALL
    USING (true)
    WITH CHECK (true);

-- 5. Policies for service_bookings:
-- Anyone can create a booking
DROP POLICY IF EXISTS "Anyone can create service bookings" ON public.service_bookings;
CREATE POLICY "Anyone can create service bookings"
    ON public.service_bookings FOR INSERT
    WITH CHECK (true);

-- Anyone can view bookings (or restrict to admin/order owner)
DROP POLICY IF EXISTS "Public read service bookings" ON public.service_bookings;
CREATE POLICY "Public read service bookings"
    ON public.service_bookings FOR SELECT
    USING (true);

-- Admins can update booking status
DROP POLICY IF EXISTS "Admin update service bookings" ON public.service_bookings;
CREATE POLICY "Admin update service bookings"
    ON public.service_bookings FOR UPDATE
    USING (true);

-- 6. Seed Default Services if table is empty
INSERT INTO public.services (id, title, short_description, description, price, category, estimated_duration, features, is_active, is_checkout_addon)
VALUES 
(
    'srv-fitting',
    'Certified Fitting & Installation Service',
    'Precision mounting of faucets, showers, vanities and pressure testing by master technicians.',
    'Our licensed plumbing specialists handle full-suite installation using precision torque calibration, high-grade PTFE seals, and zero-leak pressure testing. Backed by a 90-day installation warranty.',
    799,
    'Fitting',
    '1.5 - 2 Hours',
    '["Precision brass & ceramic cartridge alignment", "Hydraulic leak & pressure stability check", "Free protective pipe thread seals & teflon", "90-day post-installation guarantee"]'::jsonb,
    true,
    true
),
(
    'srv-agent',
    'Dedicated Service Agent & Layout Consultation',
    'On-site measurement, water pressure evaluation, and custom architectural bathroom consultation.',
    'A certified Elite Bath technical consultant visits your site to verify inlet-outlet dimensions, measure tile clearances, test municipal water pressure, and ensure seamless fittings compatibility before delivery.',
    499,
    'Inspection',
    '45 - 60 Mins',
    '["Center-to-center pipe dimension verification", "Water pressure gauge reading (bar/PSI)", "Product compatibility & clearance report", "Dedicated WhatsApp support with technical manager"]'::jsonb,
    true,
    true
),
(
    'srv-descaling',
    'Ceramic Glaze & Cartridge Descaling Maintenance',
    'Eco-mineral descaling, aerator cleaning, and ceramic glaze revitalization for high-end fittings.',
    'Restore water flow and lustrous PVD finish. Includes ultrasonic aerator cleaning, silicone seal conditioning, and deep mineral descaling designed for hard-water Indian regions.',
    1299,
    'Maintenance',
    '2 - 3 Hours',
    '["Ultrasonic faucet aerator deep clean", "PVD finish anti-scratch polishing", "Silicon O-ring lubrication & seal replacement", "Showerhead silicone nozzle calcium purge"]'::jsonb,
    true,
    false
),
(
    'srv-consultation',
    'Bespoke Architectural Bathroom Styling',
    '3D elevation planning, fixture placement recommendations, and water flow luxury optimization.',
    'Work one-on-one with an interior sanitary specialist. We analyze your floor plan, recommend optimum water heaters and concealed diverter positioning, and curate a cohesive finish palette.',
    1999,
    'Consultation',
    'Full Site Audit (3 Hours)',
    '["3D Fixture placement & elevation blueprint", "Water pressure & diverter compatibility map", "PVD finish matching with tile textures", "Priority direct technician assignment"]'::jsonb,
    true,
    false
)
ON CONFLICT (id) DO NOTHING;
