-- ============================================================================
-- Migration: Add Product Variants and Sanitaryware Product Attributes
-- Elite Bath Collections
-- ============================================================================

-- 1. Extend products table with sanitaryware & variant fields
alter table public.products
  add column if not exists sku text,
  add column if not exists brand text default 'Elite Bath',
  add column if not exists material text,
  add column if not exists finish text,
  add column if not exists warranty_info text,
  add column if not exists has_variants boolean not null default false,
  add column if not exists variant_config jsonb default '{"enabledOptions":[], "options":[]}'::jsonb,
  add column if not exists is_new_arrival boolean not null default false,
  add column if not exists is_active boolean not null default true;

-- 2. Create product_variants table
create table if not exists public.product_variants (
  id uuid default gen_random_uuid() primary key,
  product_id uuid references public.products(id) on delete cascade not null,
  sku text,
  price numeric(10,2) not null check (price >= 0),
  stock integer not null default 0 check (stock >= 0),
  image_url text,
  attributes jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Create indexes for high-performance variant querying
create index if not exists idx_product_variants_product_id on public.product_variants(product_id);
create index if not exists idx_product_variants_sku on public.product_variants(sku);
create index if not exists idx_product_variants_active on public.product_variants(active);
create index if not exists idx_products_has_variants on public.products(has_variants);
create index if not exists idx_products_brand on public.products(brand);

-- 4. Enable Row Level Security (RLS) on product_variants
alter table public.product_variants enable row level security;

-- Drop existing policies if any
drop policy if exists "Allow public read product_variants" on public.product_variants;
drop policy if exists "Allow admins full access to product_variants" on public.product_variants;

-- Public can read active product variants
create policy "Allow public read product_variants" 
  on public.product_variants 
  for select 
  using (true);

-- Admins have full access (create, update, delete)
create policy "Allow admins full access to product_variants" 
  on public.product_variants 
  for all 
  using (
    exists (
      select 1 from public.profiles 
      where id = auth.uid() and role = 'admin'
    )
  );

-- 5. Extend order_items table for exact variant tracking
alter table public.order_items
  add column if not exists selected_variant_id uuid references public.product_variants(id) on delete set null,
  add column if not exists selected_attributes jsonb default '{}'::jsonb;

-- 6. Seed official sanitaryware categories if missing
insert into public.categories (name, image_url, size_enabled)
values
  ('Faucets & Taps', 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=600', false),
  ('Showers & Systems', 'https://images.unsplash.com/photo-1584622781564-1d987f7333c1?auto=format&fit=crop&q=80&w=600', false),
  ('Wash Basins', 'https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&q=80&w=600', false),
  ('Toilets & Commodes', 'https://images.unsplash.com/photo-1564540586988-aa4e53c3d799?auto=format&fit=crop&q=80&w=600', false),
  ('Bathtubs & Jacuzzis', 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&q=80&w=600', false),
  ('Bathroom Vanity & Cabinets', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=600', false),
  ('Bathroom Accessories', 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&q=80&w=600', false),
  ('Drains & Waste Fittings', 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&q=80&w=600', false)
on conflict (name) do nothing;
