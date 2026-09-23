import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  X,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  Tag,
  Box,
  ShieldCheck,
} from 'lucide-react';
import type { Product } from '../types/database';
import { useAuthStore } from '../store/useAuthStore';
import { useWishlistStore } from '../store/useWishlistStore';
import { useCatalogStore } from '../store/useCatalogStore';
import { Button } from '../components/common/Button';
import { ProductCard } from '../components/product/ProductCard';
import { ProductCardSkeleton } from '../components/product/ProductCardSkeleton';

// Curated Apparel Facets
const FINISH_FACETS = [
  'All',
  'Onyx Black',
  'Off-White',
  'Slate Grey',
  'Sapphire Navy',
  'Vintage Washed',
  'Desert Sand',
  'French Blue',
];

const MATERIAL_FACETS = [
  'All',
  '100% Combed Cotton',
  'SUS304 French Blue',
  'Pure French Linen',
  'Canvas & Leather',
];

const PRICE_BRACKETS = [
  { label: 'All Prices', min: 0, max: 60000 },
  { label: 'Under ₹3,000', min: 0, max: 3000 },
  { label: '₹3,000 - ₹8,000', min: 3000, max: 8000 },
  { label: '₹8,000 - ₹15,000', min: 8000, max: 15000 },
  { label: 'Above ₹15,000', min: 15000, max: 60000 },
];

export const Shop: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuthStore();
  const { toggleWishlist, isInWishlist } = useWishlistStore();

  const categories = useCatalogStore((s) => s.categories);
  const products = useCatalogStore((s) => s.products);
  const productsLoading = useCatalogStore((s) => s.productsLoading);
  const initializeCatalog = useCatalogStore((s) => s.initializeCatalog);

  // Horizontal category chips scroll ref
  const categoryScrollRef = useRef<HTMLDivElement>(null);

  // Filters State (initialized from URL params for shareability)
  const [search, setSearch] = useState<string>(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState<string>(
    searchParams.get('category') || 'All'
  );
  const [selectedFinish, setSelectedFinish] = useState<string>(
    searchParams.get('finish') || 'All'
  );
  const [selectedMaterial, setSelectedMaterial] = useState<string>(
    searchParams.get('material') || 'All'
  );
  const [inStockOnly, setInStockOnly] = useState<boolean>(
    searchParams.get('in_stock') === 'true'
  );
  const [featuredOnly, setFeaturedOnly] = useState<boolean>(
    searchParams.get('featured') === 'true'
  );
  const [newArrivalOnly, setNewArrivalOnly] = useState<boolean>(
    searchParams.get('new_arrival') === 'true'
  );
  const [variantsOnly, setVariantsOnly] = useState<boolean>(
    searchParams.get('has_variants') === 'true'
  );

  // Price filter: default min 0, max 60000
  const [maxPrice, setMaxPrice] = useState<number>(() => {
    const urlMax = searchParams.get('max_price');
    return urlMax ? Math.max(100, Number(urlMax)) : 60000;
  });
  const [minPrice, setMinPrice] = useState<number>(() => {
    const urlMin = searchParams.get('min_price');
    return urlMin ? Math.max(0, Number(urlMin)) : 0;
  });

  const [sortBy, setSortBy] = useState<string>(
    searchParams.get('sort') || 'newest'
  );
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  const isInitialLoad = productsLoading && products.length === 0;

  useEffect(() => {
    void initializeCatalog();
  }, [initializeCatalog]);

  // Sync state from URL changes (e.g. back/forward navigation or navbar search)
  useEffect(() => {
    const urlSearch = searchParams.get('search') || '';
    setSearch(urlSearch);

    const urlCat = searchParams.get('category') || 'All';
    setSelectedCategory(urlCat);

    const urlFinish = searchParams.get('finish') || 'All';
    setSelectedFinish(urlFinish);

    const urlMaterial = searchParams.get('material') || 'All';
    setSelectedMaterial(urlMaterial);

    setInStockOnly(searchParams.get('in_stock') === 'true');
    setFeaturedOnly(searchParams.get('featured') === 'true');
    setNewArrivalOnly(searchParams.get('new_arrival') === 'true');
    setVariantsOnly(searchParams.get('has_variants') === 'true');

    const urlMax = searchParams.get('max_price');
    if (urlMax) setMaxPrice(Number(urlMax));

    const urlMin = searchParams.get('min_price');
    if (urlMin) setMinPrice(Number(urlMin));

    const urlSort = searchParams.get('sort');
    if (urlSort) setSortBy(urlSort);
  }, [searchParams]);

  // Sync state back to URL query parameters
  const updateUrlParam = useCallback(
    (key: string, value: string | null) => {
      const nextParams = new URLSearchParams(searchParams);
      if (
        value === null ||
        value === '' ||
        value === 'All' ||
        value === 'false' ||
        (key === 'max_price' && Number(value) >= 60000) ||
        (key === 'min_price' && Number(value) <= 0) ||
        (key === 'sort' && value === 'newest')
      ) {
        nextParams.delete(key);
      } else {
        nextParams.set(key, value);
      }
      setSearchParams(nextParams, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  // Category product counts
  const categoryCountMap = useMemo(() => {
    const map: Record<string, number> = { All: products.length };
    categories.forEach((cat) => {
      map[cat.name] = products.filter(
        (p) => p.category_id === cat.id || p.category?.name === cat.name
      ).length;
    });
    return map;
  }, [categories, products]);

  // Filter & Sort Logic
  const filteredProducts = useMemo(() => {
    return products
      .filter((prod) => {
        // Active filter
        if (prod.is_active === false) return false;

        // In Stock filter
        if (inStockOnly && prod.stock <= 0) return false;

        // Featured filter
        if (featuredOnly && !prod.featured) return false;

        // New Arrival filter
        if (newArrivalOnly && !prod.is_new_arrival) return false;

        // Has Variants filter
        if (variantsOnly && !prod.has_variants) return false;

        // Search text matching across all relevant apparel fields
        if (search.trim()) {
          const q = search.toLowerCase().trim();
          const matchesName = prod.name.toLowerCase().includes(q);
          const matchesDesc = prod.description?.toLowerCase().includes(q) || false;
          const matchesBrand = prod.brand?.toLowerCase().includes(q) || false;
          const matchesSku = prod.sku?.toLowerCase().includes(q) || false;
          const matchesMaterial = prod.material?.toLowerCase().includes(q) || false;
          const matchesFinish = prod.finish?.toLowerCase().includes(q) || false;
          const matchesCategory =
            prod.category?.name?.toLowerCase().includes(q) || false;
          const matchesVariants =
            prod.variants?.some(
              (v) =>
                Object.values(v.attributes).some((val) =>
                  val.toLowerCase().includes(q)
                ) || (v.sku && v.sku.toLowerCase().includes(q))
            ) || false;

          if (
            !matchesName &&
            !matchesDesc &&
            !matchesBrand &&
            !matchesSku &&
            !matchesMaterial &&
            !matchesFinish &&
            !matchesCategory &&
            !matchesVariants
          ) {
            return false;
          }
        }

        // Category matching
        if (selectedCategory !== 'All') {
          const categoryObj = categories.find(
            (c) =>
              c.name.toLowerCase() === selectedCategory.toLowerCase() ||
              c.id === selectedCategory
          );
          const catId = categoryObj?.id || selectedCategory;
          const catName =
            categoryObj?.name.toLowerCase() || selectedCategory.toLowerCase();
          const prodCatName = prod.category?.name?.toLowerCase();

          if (prod.category_id !== catId && prodCatName !== catName) {
            return false;
          }
        }

        // Price range
        if (prod.price < minPrice || prod.price > maxPrice) {
          return false;
        }

        // Finish matching (checking product.finish and variant attributes)
        if (selectedFinish !== 'All') {
          const targetFinish = selectedFinish.toLowerCase();
          const matchesDirect =
            prod.finish?.toLowerCase().includes(targetFinish) || false;
          const matchesVariant =
            prod.variants?.some((v) =>
              Object.entries(v.attributes).some(
                ([k, val]) =>
                  (k.toLowerCase() === 'finish' || k.toLowerCase() === 'color') &&
                  val.toLowerCase().includes(targetFinish)
              )
            ) || false;
          const matchesOptionValues =
            prod.variant_config?.options?.some(
              (opt) =>
                (opt.id === 'finish' || opt.id === 'color') &&
                opt.values.some((v) =>
                  (typeof v === 'string' ? v : v.label)
                    .toLowerCase()
                    .includes(targetFinish)
                )
            ) || false;

          if (!matchesDirect && !matchesVariant && !matchesOptionValues) {
            return false;
          }
        }

        // Material matching
        if (selectedMaterial !== 'All') {
          const targetMat = selectedMaterial.toLowerCase();
          const matchesDirect =
            prod.material?.toLowerCase().includes(targetMat) || false;
          const matchesVariant =
            prod.variants?.some((v) =>
              Object.entries(v.attributes).some(
                ([k, val]) =>
                  k.toLowerCase() === 'material' &&
                  val.toLowerCase().includes(targetMat)
              )
            ) || false;

          if (!matchesDirect && !matchesVariant) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price-low') return a.price - b.price;
        if (sortBy === 'price-high') return b.price - a.price;
        if (sortBy === 'popular') return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        // 'newest' default
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [
    products,
    search,
    selectedCategory,
    selectedFinish,
    selectedMaterial,
    inStockOnly,
    featuredOnly,
    newArrivalOnly,
    variantsOnly,
    minPrice,
    maxPrice,
    sortBy,
    categories,
  ]);

  // Handler for category select
  const handleCategorySelect = (catName: string) => {
    setSelectedCategory(catName);
    updateUrlParam('category', catName === 'All' ? null : catName);
  };

  // Handler for search
  const handleSearchChange = (val: string) => {
    setSearch(val);
    updateUrlParam('search', val.trim() || null);
  };

  // Clear all filters
  const handleClearAllFilters = () => {
    setSearch('');
    setSelectedCategory('All');
    setSelectedFinish('All');
    setSelectedMaterial('All');
    setInStockOnly(false);
    setFeaturedOnly(false);
    setNewArrivalOnly(false);
    setVariantsOnly(false);
    setMinPrice(0);
    setMaxPrice(60000);
    setSortBy('newest');
    setSearchParams({}, { replace: true });
  };

  // Count active filters (for badge)
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (search.trim()) count++;
    if (selectedCategory !== 'All') count++;
    if (selectedFinish !== 'All') count++;
    if (selectedMaterial !== 'All') count++;
    if (inStockOnly) count++;
    if (featuredOnly) count++;
    if (newArrivalOnly) count++;
    if (variantsOnly) count++;
    if (maxPrice < 60000 || minPrice > 0) count++;
    return count;
  }, [
    search,
    selectedCategory,
    selectedFinish,
    selectedMaterial,
    inStockOnly,
    featuredOnly,
    newArrivalOnly,
    variantsOnly,
    maxPrice,
    minPrice,
  ]);

  const handleProductNavigate = useCallback(
    (slug: string) => navigate(`/product/${slug}`),
    [navigate]
  );

  const handleToggleWishlist = useCallback(
    (product: Product) => {
      if (user) toggleWishlist(user.id, product);
    },
    [user, toggleWishlist]
  );

  const scrollCategories = (direction: 'left' | 'right') => {
    if (categoryScrollRef.current) {
      const offset = direction === 'left' ? -260 : 260;
      categoryScrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb Navigation */}
      <div className="border-b border-gray-100 bg-gray-50/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center space-x-2 text-xs text-gray-500 font-medium">
            <Link to="/" className="hover:text-primary transition-colors">
              Home
            </Link>
            <ChevronRight className="h-3 w-3 text-gray-400" />
            <span
              className={
                selectedCategory === 'All'
                  ? 'text-gray-900 font-semibold'
                  : 'hover:text-primary transition-colors cursor-pointer'
              }
              onClick={() => handleCategorySelect('All')}
            >
              Shop Collections
            </span>
            {selectedCategory !== 'All' && (
              <>
                <ChevronRight className="h-3 w-3 text-gray-400" />
                <span className="text-gray-900 font-semibold truncate">
                  {selectedCategory}
                </span>
              </>
            )}
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title & Luxury Subtitle */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 tracking-tight">
              {selectedCategory === 'All'
                ? 'TRYVOAL Apparel Collections'
                : selectedCategory}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-2xl">
              Heavyweight combed cotton t-shirts, tailored linen shirts, and handcrafted accessories engineered for effortless luxury.
            </p>
          </div>
          <div className="text-xs sm:text-sm text-gray-500 font-medium whitespace-nowrap">
            Showing <strong className="text-gray-900">{filteredProducts.length}</strong> of{' '}
            <strong className="text-gray-900">{products.length}</strong> collections
          </div>
        </div>

        {/* Horizontal Category Scrolling Chips */}
        <div className="relative mb-8 pb-2 border-b border-gray-100">
          <div className="flex items-center gap-2">
            {/* Scroll Left Button */}
            <button
              onClick={() => scrollCategories('left')}
              className="hidden md:flex items-center justify-center p-2 rounded-full border border-gray-200 bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-50 shadow-sm flex-shrink-0 transition-colors"
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {/* Chips Container */}
            <div
              ref={categoryScrollRef}
              className="flex items-center gap-2.5 overflow-x-auto py-2 no-scrollbar scroll-smooth w-full"
            >
              <button
                onClick={() => handleCategorySelect('All')}
                className={`flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all ${
                  selectedCategory === 'All'
                    ? 'bg-primary text-white border-primary shadow-sm ring-2 ring-primary/20'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <span>All Collections</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    selectedCategory === 'All'
                      ? 'bg-white/20 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {categoryCountMap['All'] || 0}
                </span>
              </button>

              {categories.map((cat) => {
                const isSelected = selectedCategory === cat.name;
                const count = categoryCountMap[cat.name] || 0;
                return (
                  <button
                    key={cat.id}
                    onClick={() => handleCategorySelect(cat.name)}
                    className={`flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all ${
                      isSelected
                        ? 'bg-primary text-white border-primary shadow-sm ring-2 ring-primary/20'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <span>{cat.name}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Scroll Right Button */}
            <button
              onClick={() => scrollCategories('right')}
              className="hidden md:flex items-center justify-center p-2 rounded-full border border-gray-200 bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-50 shadow-sm flex-shrink-0 transition-colors"
              aria-label="Scroll right"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-gray-50/80 p-3.5 sm:p-4 rounded-2xl border border-gray-200 mb-6">
          {/* Live Search Input */}
          <div className="relative flex-grow max-w-md">
            <input
              type="text"
              placeholder="Search by finish, material, SKU, name..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-xl py-2 pl-9 pr-8 text-xs sm:text-sm focus:outline-none focus:border-primary text-gray-900 shadow-sm"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            {search && (
              <button
                onClick={() => handleSearchChange('')}
                className="absolute right-2.5 top-2.5 p-0.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Action Buttons: Mobile Filter Drawer Toggle & Sort Dropdown */}
          <div className="flex items-center justify-between sm:justify-end gap-2.5">
            {/* Mobile Filter Button */}
            <button
              onClick={() => setIsFilterDrawerOpen(true)}
              className="flex items-center space-x-2 px-3.5 py-2 bg-white border border-gray-300 text-xs sm:text-sm font-semibold rounded-xl hover:bg-gray-50 text-gray-700 transition-all lg:hidden shadow-sm"
            >
              <SlidersHorizontal className="h-4 w-4 text-gray-600" />
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className="w-5 h-5 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* Sort Select */}
            <div className="flex items-center space-x-2 relative flex-grow sm:flex-grow-0">
              <ArrowUpDown className="h-3.5 w-3.5 text-gray-500 absolute left-3 pointer-events-none" />
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  updateUrlParam('sort', e.target.value);
                }}
                className="bg-white border border-gray-300 text-xs sm:text-sm text-gray-900 rounded-xl py-2 pl-8 pr-8 focus:outline-none focus:border-primary cursor-pointer w-full sm:w-auto shadow-sm font-medium"
              >
                <option value="newest">Newest Arrivals</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="popular">Most Popular & Featured</option>
                <option value="name">Product Name (A-Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Active Filter Chips Bar (Visible when any filters active) */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-6 p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs">
            <span className="text-gray-500 font-semibold flex items-center gap-1 mr-1">
              <Tag className="h-3 w-3 text-primary" /> Active Filters:
            </span>

            {search && (
              <span className="inline-flex items-center gap-1 bg-white border border-gray-200 px-2.5 py-1 rounded-lg text-gray-800 font-medium shadow-2xs">
                Search: &ldquo;{search}&rdquo;
                <button onClick={() => handleSearchChange('')} className="hover:text-danger">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {selectedCategory !== 'All' && (
              <span className="inline-flex items-center gap-1 bg-white border border-gray-200 px-2.5 py-1 rounded-lg text-gray-800 font-medium shadow-2xs">
                Category: {selectedCategory}
                <button onClick={() => handleCategorySelect('All')} className="hover:text-danger">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {selectedFinish !== 'All' && (
              <span className="inline-flex items-center gap-1 bg-white border border-gray-200 px-2.5 py-1 rounded-lg text-gray-800 font-medium shadow-2xs">
                Finish: {selectedFinish}
                <button
                  onClick={() => {
                    setSelectedFinish('All');
                    updateUrlParam('finish', null);
                  }}
                  className="hover:text-danger"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {selectedMaterial !== 'All' && (
              <span className="inline-flex items-center gap-1 bg-white border border-gray-200 px-2.5 py-1 rounded-lg text-gray-800 font-medium shadow-2xs">
                Material: {selectedMaterial}
                <button
                  onClick={() => {
                    setSelectedMaterial('All');
                    updateUrlParam('material', null);
                  }}
                  className="hover:text-danger"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {(maxPrice < 60000 || minPrice > 0) && (
              <span className="inline-flex items-center gap-1 bg-white border border-gray-200 px-2.5 py-1 rounded-lg text-gray-800 font-medium shadow-2xs">
                Price: ₹{minPrice.toLocaleString('en-IN')} - ₹{maxPrice.toLocaleString('en-IN')}
                <button
                  onClick={() => {
                    setMinPrice(0);
                    setMaxPrice(60000);
                    updateUrlParam('min_price', null);
                    updateUrlParam('max_price', null);
                  }}
                  className="hover:text-danger"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {inStockOnly && (
              <span className="inline-flex items-center gap-1 bg-white border border-gray-200 px-2.5 py-1 rounded-lg text-gray-800 font-medium shadow-2xs">
                In Stock Only
                <button
                  onClick={() => {
                    setInStockOnly(false);
                    updateUrlParam('in_stock', null);
                  }}
                  className="hover:text-danger"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {featuredOnly && (
              <span className="inline-flex items-center gap-1 bg-white border border-gray-200 px-2.5 py-1 rounded-lg text-gray-800 font-medium shadow-2xs">
                Featured
                <button
                  onClick={() => {
                    setFeaturedOnly(false);
                    updateUrlParam('featured', null);
                  }}
                  className="hover:text-danger"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {newArrivalOnly && (
              <span className="inline-flex items-center gap-1 bg-white border border-gray-200 px-2.5 py-1 rounded-lg text-gray-800 font-medium shadow-2xs">
                New Arrivals
                <button
                  onClick={() => {
                    setNewArrivalOnly(false);
                    updateUrlParam('new_arrival', null);
                  }}
                  className="hover:text-danger"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {variantsOnly && (
              <span className="inline-flex items-center gap-1 bg-white border border-gray-200 px-2.5 py-1 rounded-lg text-gray-800 font-medium shadow-2xs">
                Multi-Option Only
                <button
                  onClick={() => {
                    setVariantsOnly(false);
                    updateUrlParam('has_variants', null);
                  }}
                  className="hover:text-danger"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            <button
              onClick={handleClearAllFilters}
              className="ml-auto text-primary font-bold hover:underline inline-flex items-center gap-1 text-xs"
            >
              <RotateCcw className="h-3 w-3" /> Clear All
            </button>
          </div>
        )}

        {/* Main Content Layout: Sidebar + Product Grid */}
        <div className="flex gap-8 relative">
          {/* Desktop Filter Sidebar */}
          <aside className="hidden lg:block w-72 flex-shrink-0 space-y-6 bg-white border border-gray-200 p-6 rounded-2xl h-fit sticky top-24 shadow-card">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <h3 className="font-extrabold text-gray-900 text-base tracking-tight flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-primary" />
                Filters
              </h3>
              {activeFiltersCount > 0 && (
                <button
                  onClick={handleClearAllFilters}
                  className="text-xs text-primary font-semibold hover:underline"
                >
                  Reset All
                </button>
              )}
            </div>

            {/* In-Stock & Highlight Toggles */}
            <div className="space-y-3 pb-4 border-b border-gray-100">
              <label className="flex items-center justify-between cursor-pointer group">
                <span className="text-xs font-semibold text-gray-800 group-hover:text-primary transition-colors">
                  In Stock Only
                </span>
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => {
                    setInStockOnly(e.target.checked);
                    updateUrlParam('in_stock', e.target.checked ? 'true' : null);
                  }}
                  className="rounded text-primary focus:ring-primary h-4 w-4"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer group">
                <span className="text-xs font-semibold text-gray-800 group-hover:text-primary transition-colors">
                  Featured Collections
                </span>
                <input
                  type="checkbox"
                  checked={featuredOnly}
                  onChange={(e) => {
                    setFeaturedOnly(e.target.checked);
                    updateUrlParam('featured', e.target.checked ? 'true' : null);
                  }}
                  className="rounded text-primary focus:ring-primary h-4 w-4"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer group">
                <span className="text-xs font-semibold text-gray-800 group-hover:text-primary transition-colors">
                  New Arrivals
                </span>
                <input
                  type="checkbox"
                  checked={newArrivalOnly}
                  onChange={(e) => {
                    setNewArrivalOnly(e.target.checked);
                    updateUrlParam('new_arrival', e.target.checked ? 'true' : null);
                  }}
                  className="rounded text-primary focus:ring-primary h-4 w-4"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer group">
                <span className="text-xs font-semibold text-gray-800 group-hover:text-primary transition-colors">
                  Multi-Option Variants
                </span>
                <input
                  type="checkbox"
                  checked={variantsOnly}
                  onChange={(e) => {
                    setVariantsOnly(e.target.checked);
                    updateUrlParam('has_variants', e.target.checked ? 'true' : null);
                  }}
                  className="rounded text-primary focus:ring-primary h-4 w-4"
                />
              </label>
            </div>

            {/* Price Range & Quick Brackets */}
            <div className="space-y-3 pb-4 border-b border-gray-100">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Price Range
                </h4>
                <span className="text-xs font-extrabold text-primary">
                  Up to ₹{maxPrice.toLocaleString('en-IN')}
                </span>
              </div>
              <input
                type="range"
                min="500"
                max="60000"
                step="500"
                value={maxPrice}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setMaxPrice(val);
                  updateUrlParam('max_price', String(val));
                }}
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-[10px] text-gray-400">
                <span>₹500</span>
                <span>₹60,000+</span>
              </div>

              {/* Quick Brackets */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {PRICE_BRACKETS.map((bracket) => {
                  const isActive =
                    minPrice === bracket.min && maxPrice === bracket.max;
                  return (
                    <button
                      key={bracket.label}
                      type="button"
                      onClick={() => {
                        setMinPrice(bracket.min);
                        setMaxPrice(bracket.max);
                        updateUrlParam('min_price', bracket.min > 0 ? String(bracket.min) : null);
                        updateUrlParam('max_price', bracket.max < 60000 ? String(bracket.max) : null);
                      }}
                      className={`text-[11px] px-2 py-1 rounded-md border font-medium transition-all ${
                        isActive
                          ? 'bg-primary/10 border-primary text-primary font-bold'
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {bracket.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Finish Facets */}
            <div className="space-y-3 pb-4 border-b border-gray-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Surface Finish
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {FINISH_FACETS.map((finish) => {
                  const isSelected = selectedFinish === finish;
                  return (
                    <button
                      key={finish}
                      type="button"
                      onClick={() => {
                        setSelectedFinish(finish);
                        updateUrlParam('finish', finish === 'All' ? null : finish);
                      }}
                      className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all ${
                        isSelected
                          ? 'bg-primary text-white border-primary shadow-xs font-bold'
                          : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {finish}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Material Facets */}
            <div className="space-y-3 pb-4 border-b border-gray-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Material Composition
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {MATERIAL_FACETS.map((material) => {
                  const isSelected = selectedMaterial === material;
                  return (
                    <button
                      key={material}
                      type="button"
                      onClick={() => {
                        setSelectedMaterial(material);
                        updateUrlParam(
                          'material',
                          material === 'All' ? null : material
                        );
                      }}
                      className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all ${
                        isSelected
                          ? 'bg-primary text-white border-primary shadow-xs font-bold'
                          : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {material}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quality & Trust Note */}
            <div className="pt-2">
              <div className="p-3 bg-primary/5 rounded-xl border border-primary/15 flex items-start gap-2.5">
                <ShieldCheck className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-gray-600 leading-relaxed">
                  Every product undergoes rigorous hydraulic pressure testing and anti-tarnish plating checks before dispatch.
                </p>
              </div>
            </div>
          </aside>

          {/* Mobile Filter Slide-over Drawer */}
          {isFilterDrawerOpen && (
            <div className="fixed inset-0 z-50 lg:hidden flex justify-end">
              <div
                className="absolute inset-0 bg-black/50 backdrop-blur-xs"
                onClick={() => setIsFilterDrawerOpen(false)}
              />
              <div className="relative w-84 max-w-full bg-white h-full p-6 shadow-2xl flex flex-col justify-between overflow-y-auto border-l border-gray-200 z-10">
                <div className="space-y-6">
                  <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                    <h3 className="font-extrabold text-gray-900 text-lg flex items-center gap-2">
                      <SlidersHorizontal className="h-5 w-5 text-primary" />
                      Filter Collections
                    </h3>
                    <button
                      onClick={() => setIsFilterDrawerOpen(false)}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Categories */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                      Category
                    </h4>
                    <div className="grid grid-cols-1 gap-1 max-h-44 overflow-y-auto pr-1">
                      <button
                        onClick={() => handleCategorySelect('All')}
                        className={`text-left text-xs py-2 px-3 rounded-lg flex items-center justify-between ${
                          selectedCategory === 'All'
                            ? 'bg-primary text-white font-bold'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span>All Collections</span>
                        <span>{categoryCountMap['All'] || 0}</span>
                      </button>
                      {categories.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => handleCategorySelect(cat.name)}
                          className={`text-left text-xs py-2 px-3 rounded-lg flex items-center justify-between ${
                            selectedCategory === cat.name
                              ? 'bg-primary text-white font-bold'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <span className="truncate">{cat.name}</span>
                          <span>{categoryCountMap[cat.name] || 0}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Availability & Highlighting */}
                  <div className="space-y-2.5 pt-2 border-t border-gray-100">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                      Availability
                    </h4>
                    <label className="flex items-center justify-between text-xs text-gray-700">
                      <span>In Stock Only</span>
                      <input
                        type="checkbox"
                        checked={inStockOnly}
                        onChange={(e) => {
                          setInStockOnly(e.target.checked);
                          updateUrlParam('in_stock', e.target.checked ? 'true' : null);
                        }}
                        className="rounded text-primary h-4 w-4"
                      />
                    </label>
                    <label className="flex items-center justify-between text-xs text-gray-700">
                      <span>Featured Collections</span>
                      <input
                        type="checkbox"
                        checked={featuredOnly}
                        onChange={(e) => {
                          setFeaturedOnly(e.target.checked);
                          updateUrlParam('featured', e.target.checked ? 'true' : null);
                        }}
                        className="rounded text-primary h-4 w-4"
                      />
                    </label>
                  </div>

                  {/* Max Price Slider */}
                  <div className="space-y-2 pt-2 border-t border-gray-100">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold uppercase tracking-wider text-gray-400">
                        Max Price
                      </span>
                      <span className="font-bold text-primary">
                        ₹{maxPrice.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="500"
                      max="60000"
                      step="500"
                      value={maxPrice}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setMaxPrice(val);
                        updateUrlParam('max_price', String(val));
                      }}
                      className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                  </div>

                  {/* Finishes */}
                  <div className="space-y-2 pt-2 border-t border-gray-100">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                      Finish
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {FINISH_FACETS.map((finish) => (
                        <button
                          key={finish}
                          type="button"
                          onClick={() => {
                            setSelectedFinish(finish);
                            updateUrlParam('finish', finish === 'All' ? null : finish);
                          }}
                          className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${
                            selectedFinish === finish
                              ? 'bg-primary text-white border-primary font-bold'
                              : 'bg-white border-gray-200 text-gray-700'
                          }`}
                        >
                          {finish}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-100 flex gap-3">
                  <Button
                    variant="outline"
                    fullWidth
                    onClick={() => {
                      handleClearAllFilters();
                      setIsFilterDrawerOpen(false);
                    }}
                  >
                    Reset
                  </Button>
                  <Button fullWidth onClick={() => setIsFilterDrawerOpen(false)}>
                    View ({filteredProducts.length}) Results
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Product Grid Area */}
          <div className="flex-grow">
            {isInitialLoad ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-3 sm:gap-6">
                <ProductCardSkeleton count={6} />
              </div>
            ) : filteredProducts.length === 0 ? (
              /* Luxury Empty State */
              <div className="text-center py-16 px-4 bg-gray-50/70 rounded-3xl border border-gray-200 border-dashed max-w-2xl mx-auto">
                <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                  <Box className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg sm:text-xl font-extrabold text-gray-900 mb-2">
                  No luxury collections match your criteria
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 mb-6 max-w-md mx-auto leading-relaxed">
                  We couldn&apos;t find any apparel matching your active filters. Try broadening your price range, selecting another shade, or clearing filters.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Button onClick={handleClearAllFilters} className="px-6">
                    <RotateCcw className="mr-2 h-4 w-4" /> Reset All Filters
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleCategorySelect('All')}
                    className="px-6"
                  >
                    View All Collections
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-3 sm:gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onNavigate={handleProductNavigate}
                    showWishlist={Boolean(user)}
                    isWishlisted={user ? isInWishlist(product.id) : false}
                    onToggleWishlist={user ? handleToggleWishlist : undefined}
                    descriptionClassName="text-[10px] sm:text-xs"
                    showFeaturedBadge={product.featured}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
