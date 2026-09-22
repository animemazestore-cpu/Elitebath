import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, ShoppingBag, ArrowRight, ShieldCheck, Check, Send, Gift, Truck, Package } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useCatalogStore } from '../store/useCatalogStore';
import { Button } from '../components/common/Button';
import { ProductCard } from '../components/product/ProductCard';
import { ProductCardSkeleton } from '../components/product/ProductCardSkeleton';
import { CategoryCardSkeleton } from '../components/product/CategoryCardSkeleton';
import { HeroSkeleton } from '../components/skeleton/HeroSkeleton';
import { ProductImage } from '../components/product/ProductImage';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const categories = useCatalogStore((s) => s.categories);
  const products = useCatalogStore((s) => s.products);
  const categoriesLoading = useCatalogStore((s) => s.categoriesLoading);
  const productsLoading = useCatalogStore((s) => s.productsLoading);
  const initializeCatalog = useCatalogStore((s) => s.initializeCatalog);

  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);
  const [heroImageLoaded, setHeroImageLoaded] = useState(false);
  const [heroLoading, setHeroLoading] = useState(true);

  useEffect(() => {
    void initializeCatalog();
  }, [initializeCatalog]);

  useEffect(() => {
    // Simulate hero loading
    const timer = setTimeout(() => setHeroLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const featuredProducts = useMemo(
    () => products.filter((p) => p.featured),
    [products]
  );

  const isInitialLoad = (categoriesLoading || productsLoading) && products.length === 0;
  const showCategorySkeleton = categoriesLoading && categories.length === 0;

  const handleProductNavigate = useCallback(
    (slug: string) => navigate(`/product/${slug}`),
    [navigate]
  );

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;

    try {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .insert({ email: newsletterEmail.trim() });

      if (error) throw error;
      setNewsletterSubscribed(true);
      setNewsletterEmail('');
    } catch (err) {
      console.error('Error subscribing to newsletter:', err);
      setNewsletterSubscribed(true);
    }
  };

  const trustPoints = [
    { icon: ShieldCheck, label: '100% Genuine, tested sanitary fittings & valves' },
    { icon: Truck, label: 'Fast & tracked delivery across India' },
    { icon: Package, label: 'Heavy-duty protective transit packaging' },
  ];

  return (
    <div className="pb-20">
      {/* Hero */}
      {heroLoading ? (
        <HeroSkeleton />
      ) : (
        <section className="relative bg-gradient-to-b from-gray-50/60 via-white to-white border-b border-gray-200 overflow-hidden">
          {/* Mobile Enhanced Hero Background (Increased opacity for vivid visibility while preserving text contrast) */}
          <div className="block lg:hidden absolute inset-0 z-0 pointer-events-none overflow-hidden">
            <img
              src="/hero_sanitary.jpg"
              alt=""
              className="w-full h-full object-cover object-[center_35%] opacity-45 sm:opacity-50 filter contrast-110 saturate-105"
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-white/45 to-white/95" />
          </div>

          {/* Desktop Subtle Background Layer */}
          <div className="hidden lg:block absolute inset-0 z-0 opacity-15 pointer-events-none">
            <img
              src="/hero_sanitary.jpg"
              alt=""
              className="w-full h-full object-cover filter blur-sm"
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-gray-50/90" />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24">
            <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
              <div className="text-center lg:text-left space-y-6 sm:space-y-8">
                {/* Natural, unboxed typography with high readability */}
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Bathrooms For A Better Tomorrow</span>
                  </div>
                  <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900 leading-tight">
                    Elevate Your Bathroom with Premium Sanitary Collections
                  </h1>
                  <p className="text-gray-600 text-sm sm:text-base lg:text-lg max-w-xl mx-auto lg:mx-0 leading-relaxed">
                    Precision brass faucets, rainfall showers, designer basins, and luxury accessories engineered for enduring performance and timeless elegance.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                  <button
                    onClick={() => navigate('/shop')}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-bold text-white bg-primary hover:bg-primary-dark shadow-sm hover:shadow-md transition-all active:scale-[0.99]"
                  >
                    <ShoppingBag className="h-5 w-5" />
                    Shop Collections
                  </button>
                  <button
                    onClick={() => navigate('/shop')}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-bold text-gray-700 border border-gray-300 bg-white hover:border-primary hover:text-primary shadow-xs hover:shadow-sm transition-all active:scale-[0.99]"
                  >
                    <Sparkles className="h-5 w-5 text-primary" />
                    Browse Categories
                  </button>
                </div>

                <ul className="space-y-3 pt-3 sm:pt-4 border-t border-gray-200">
                  {trustPoints.map(({ icon: Icon, label }) => (
                    <li key={label} className="flex items-center gap-3 text-xs sm:text-sm text-gray-600 font-medium justify-center lg:justify-start">
                      <Icon className="h-4 w-4 text-primary flex-shrink-0" />
                      <span>{label}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="hidden lg:flex items-center justify-center">
                <div className="relative w-full max-w-lg aspect-[16/10] rounded-3xl overflow-hidden shadow-2xl border-4 border-white group">
                  <img
                    src="/hero_sanitary.jpg"
                    alt="Elite Bath Collections luxury bathroom setting"
                    className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-105 ${heroImageLoaded ? 'opacity-100' : 'opacity-0'}`}
                    loading="eager"
                    onLoad={() => setHeroImageLoaded(true)}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <span className="text-xs font-semibold uppercase tracking-wider text-emerald-300">Modern Architecture</span>
                    <p className="text-sm font-bold">Curated Sanitaryware & Fittings</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Categories */}
      {(categories.length > 0 || showCategorySkeleton) && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-1">Shop by category</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Popular Categories</h2>
            </div>
            <Link
              to="/shop"
              className="text-primary hover:text-primary-dark text-sm font-semibold inline-flex items-center gap-1.5 transition-colors"
            >
              View all
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
            {showCategorySkeleton ? (
              <CategoryCardSkeleton count={6} />
            ) : (
              categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => navigate(`/shop?category=${encodeURIComponent(cat.name)}`)}
                  className="bg-white rounded-xl overflow-hidden border border-gray-200 text-left group shadow-sm hover:shadow-md hover:border-primary/40 transition-all"
                >
                  <div className="aspect-square w-full overflow-hidden bg-gray-100">
                    <ProductImage
                      src={cat.image_url}
                      alt={cat.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-3 sm:p-4">
                    <h3 className="font-semibold text-sm text-gray-900 line-clamp-2">{cat.name}</h3>
                  </div>
                </button>
              ))
            )}
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-1">Handpicked for you</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Featured Products</h2>
          </div>
          <Link
            to="/shop?featured=true"
            className="text-primary hover:text-primary-dark text-sm font-semibold inline-flex items-center gap-1.5 transition-colors"
          >
            View all featured
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {isInitialLoad ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5 lg:gap-6">
            <ProductCardSkeleton count={5} />
          </div>
        ) : featuredProducts.length === 0 ? (
          <div className="text-center py-16 px-6 bg-gray-50 rounded-xl border border-gray-200">
            <p className="text-gray-600 text-sm mb-4">No featured products at the moment.</p>
            <Button size="sm" onClick={() => navigate('/shop')}>Browse the full shop</Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5 lg:gap-6">
            {featuredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onNavigate={handleProductNavigate}
                showFeaturedBadge
                stockVariant="text"
                descriptionClassName="text-xs"
                priceClassName="font-bold text-sm sm:text-base text-gray-900"
              />
            ))}
          </div>
        )}
      </section>

      {/* Trust */}
      <section className="bg-gray-50 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg flex-shrink-0">
                <ShieldCheck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Solid Core Craftsmanship</h3>
                <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                  Crafted with heavy-grade brass, SUS304 stainless steel, and vitreous china for durability.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg flex-shrink-0">
                <Gift className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Multi-Layer Protective Finish</h3>
                <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                  Corrosion-resistant plating engineered to withstand water spots, humidity, and daily wear.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg flex-shrink-0">
                <Check className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Verified Customer Reviews</h3>
                <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                  Read genuine feedback and installation photos from verified buyers across India.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="bg-white p-8 sm:p-10 rounded-2xl border border-gray-200 shadow-sm text-center">
          <div className="space-y-5">
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Stay updated</h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                Get notified about new arrivals, restocks, and store announcements.
              </p>
            </div>

            {newsletterSubscribed ? (
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="inline-flex items-center gap-2 text-success bg-success/10 border border-success/20 px-5 py-2.5 rounded-lg text-sm font-medium"
              >
                <Check className="h-4 w-4" />
                <span>You're subscribed. We'll be in touch.</span>
              </motion.div>
            ) : (
              <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg text-sm bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                <Button type="submit" className="sm:flex-shrink-0">
                  <Send className="mr-2 h-4 w-4" />
                  Subscribe
                </Button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
