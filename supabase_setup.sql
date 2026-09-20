-- ============================================================
-- AnimeMaze - Complete Supabase Database Schema
-- Run ALL of this in Supabase Dashboard > SQL Editor > New Query
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id OR public.is_admin());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''), 'user')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- CATEGORIES
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  image_url TEXT NOT NULL DEFAULT '',
  size_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS size_enabled BOOLEAN DEFAULT false;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view categories" ON public.categories;
DROP POLICY IF EXISTS "Admin can manage categories" ON public.categories;
CREATE POLICY "Anyone can view categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admin can manage categories" ON public.categories FOR ALL USING (
  auth.role() = 'authenticated' OR public.is_admin() OR auth.uid() IS NOT NULL
) WITH CHECK (true);

-- PRODUCTS
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  featured BOOLEAN NOT NULL DEFAULT false,
  main_image_url TEXT NOT NULL DEFAULT '',
  additional_images JSONB NOT NULL DEFAULT '[]',
  sku TEXT,
  brand TEXT DEFAULT 'Elite Bath',
  material TEXT,
  finish TEXT,
  warranty_info TEXT,
  has_variants BOOLEAN NOT NULL DEFAULT false,
  variant_config JSONB NOT NULL DEFAULT '{"enabledOptions":[], "options":[]}'::jsonb,
  is_new_arrival BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view products" ON public.products;
DROP POLICY IF EXISTS "Admin can manage products" ON public.products;
CREATE POLICY "Anyone can view products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Admin can manage products" ON public.products FOR ALL USING (
  auth.role() = 'authenticated' OR public.is_admin() OR auth.uid() IS NOT NULL
) WITH CHECK (true);

-- PRODUCT VARIANTS
CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  sku TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  image_url TEXT,
  attributes JSONB NOT NULL DEFAULT '{}'::jsonb,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON public.product_variants(sku);
CREATE INDEX IF NOT EXISTS idx_product_variants_active ON public.product_variants(active);

ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view product_variants" ON public.product_variants;
DROP POLICY IF EXISTS "Admin can manage product_variants" ON public.product_variants;
CREATE POLICY "Anyone can view product_variants" ON public.product_variants FOR SELECT USING (true);
CREATE POLICY "Admin can manage product_variants" ON public.product_variants FOR ALL USING (
  auth.role() = 'authenticated' OR public.is_admin() OR auth.uid() IS NOT NULL
) WITH CHECK (true);

-- ORDERS
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'PENDING_VERIFICATION' CHECK (status IN ('PENDING_VERIFICATION','PAID','PROCESSING','SHIPPED','DELIVERED','CANCELLED')),
  payment_status TEXT NOT NULL DEFAULT 'PENDING_VERIFICATION' CHECK (payment_status IN ('PENDING_VERIFICATION','PAID','REJECTED')),
  shipping_address JSONB NOT NULL DEFAULT '{}',
  tracking_number TEXT,
  tracking_carrier TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
DROP POLICY IF EXISTS "Admin can manage orders" ON public.orders;
CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Anyone can create orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin can manage orders" ON public.orders FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ORDER ITEMS
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  selected_variant TEXT,
  selected_variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  selected_attributes JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can insert order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;
DROP POLICY IF EXISTS "Admin can manage order items" ON public.order_items;
CREATE POLICY "Anyone can insert order items" ON public.order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view own order items" ON public.order_items FOR SELECT USING (EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND user_id = auth.uid()));
CREATE POLICY "Admin can manage order items" ON public.order_items FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- PAYMENT PROOF
CREATE TABLE IF NOT EXISTS public.payment_proof (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  screenshot_url TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.payment_proof ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can insert payment proof" ON public.payment_proof;
DROP POLICY IF EXISTS "Admin can view payment proof" ON public.payment_proof;
CREATE POLICY "Anyone can insert payment proof" ON public.payment_proof FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin can view payment proof" ON public.payment_proof FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- WISHLIST ITEMS
CREATE TABLE IF NOT EXISTS public.wishlist_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own wishlist" ON public.wishlist_items;
CREATE POLICY "Users can manage own wishlist" ON public.wishlist_items FOR ALL USING (auth.uid() = user_id);

-- REVIEWS
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL DEFAULT 'Anonymous',
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text TEXT NOT NULL DEFAULT '',
  review_images JSONB NOT NULL DEFAULT '[]',
  verified_purchase BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('APPROVED','PENDING','REJECTED')),
  likes_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view approved reviews" ON public.reviews;
DROP POLICY IF EXISTS "Authenticated users can submit reviews" ON public.reviews;
DROP POLICY IF EXISTS "Admin can manage reviews" ON public.reviews;
CREATE POLICY "Anyone can view approved reviews" ON public.reviews FOR SELECT USING (status = 'APPROVED' OR auth.uid() = user_id);
CREATE POLICY "Authenticated users can submit reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin can manage reviews" ON public.reviews FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- PRODUCT QUESTIONS
CREATE TABLE IF NOT EXISTS public.product_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  question TEXT NOT NULL,
  answer TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.product_questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view questions" ON public.product_questions;
DROP POLICY IF EXISTS "Authenticated users can ask questions" ON public.product_questions;
DROP POLICY IF EXISTS "Admin can manage questions" ON public.product_questions;
CREATE POLICY "Anyone can view questions" ON public.product_questions FOR SELECT USING (true);
CREATE POLICY "Authenticated users can ask questions" ON public.product_questions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin can manage questions" ON public.product_questions FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- NEWSLETTER SUBSCRIBERS
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can subscribe" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Admin can view subscribers" ON public.newsletter_subscribers;
CREATE POLICY "Anyone can subscribe" ON public.newsletter_subscribers FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin can view subscribers" ON public.newsletter_subscribers FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- REPLACEMENT REQUESTS
CREATE TABLE IF NOT EXISTS public.replacement_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  photo_url TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','APPROVED','REJECTED','PROCESSING','RESOLVED')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.replacement_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view and create own replacements" ON public.replacement_requests;
DROP POLICY IF EXISTS "Admin can manage replacement requests" ON public.replacement_requests;
CREATE POLICY "Users can view and create own replacements" ON public.replacement_requests FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admin can manage replacement requests" ON public.replacement_requests FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- COUPONS
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL DEFAULT 'PERCENTAGE' CHECK (discount_type IN ('PERCENTAGE','FIXED')),
  discount_value NUMERIC(10,2) NOT NULL DEFAULT 0,
  min_order_amount NUMERIC(10,2),
  max_uses INTEGER,
  used_count INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view active coupons" ON public.coupons;
DROP POLICY IF EXISTS "Admin can manage coupons" ON public.coupons;
CREATE POLICY "Anyone can view active coupons" ON public.coupons FOR SELECT USING (active = true);
CREATE POLICY "Admin can manage coupons" ON public.coupons FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- SITE ANNOUNCEMENTS
CREATE TABLE IF NOT EXISTS public.site_announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.site_announcements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view announcements" ON public.site_announcements;
DROP POLICY IF EXISTS "Admin can manage announcements" ON public.site_announcements;
CREATE POLICY "Anyone can view announcements" ON public.site_announcements FOR SELECT USING (true);
CREATE POLICY "Admin can manage announcements" ON public.site_announcements FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- REVIEW LIKES
CREATE TABLE IF NOT EXISTS public.review_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(review_id, user_id)
);
ALTER TABLE public.review_likes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own likes" ON public.review_likes;
DROP POLICY IF EXISTS "Anyone can view likes" ON public.review_likes;
CREATE POLICY "Users can manage own likes" ON public.review_likes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view likes" ON public.review_likes FOR SELECT USING (true);

-- STORAGE BUCKETS AND OBJECTS POLICIES
-- 1. product-images bucket (for products, gallery, variants, categories)
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Allow public uploads to product-images" ON storage.objects;
CREATE POLICY "Allow public uploads to product-images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Allow public updates to product-images" ON storage.objects;
CREATE POLICY "Allow public updates to product-images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Allow public read from product-images" ON storage.objects;
CREATE POLICY "Allow public read from product-images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- 2. review-images bucket (for customer reviews)
INSERT INTO storage.buckets (id, name, public)
VALUES ('review-images', 'review-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Allow public uploads to review-images" ON storage.objects;
CREATE POLICY "Allow public uploads to review-images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'review-images');

DROP POLICY IF EXISTS "Allow public read from review-images" ON storage.objects;
CREATE POLICY "Allow public read from review-images"
ON storage.objects FOR SELECT
USING (bucket_id = 'review-images');

-- 3. replacement-photos bucket (for return/replacement requests)
INSERT INTO storage.buckets (id, name, public)
VALUES ('replacement-photos', 'replacement-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Allow public uploads to replacement-photos" ON storage.objects;
CREATE POLICY "Allow public uploads to replacement-photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'replacement-photos');

DROP POLICY IF EXISTS "Allow public read from replacement-photos" ON storage.objects;
CREATE POLICY "Allow public read from replacement-photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'replacement-photos');

-- 4. payment-proofs bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Allow public uploads to payment-proofs" ON storage.objects;
CREATE POLICY "Allow public uploads to payment-proofs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'payment-proofs');

DROP POLICY IF EXISTS "Allow public read from payment-proofs" ON storage.objects;
CREATE POLICY "Allow public read from payment-proofs"
ON storage.objects FOR SELECT
USING (bucket_id = 'payment-proofs');

-- ============================================================
-- DONE! After running:
-- 1. Go to Authentication > Users, create your admin account
-- 2. Run: UPDATE profiles SET role = 'admin' WHERE email = 'your-admin@email.com';
-- ============================================================