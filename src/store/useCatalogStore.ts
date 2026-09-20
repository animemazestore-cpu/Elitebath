import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import { withTimeout } from '../lib/withTimeout';
import { sanitizeSlug } from '../lib/persistence';
import {
  CATEGORY_FIELDS,
  PRODUCT_DETAIL_SELECT,
  PRODUCT_LIST_SELECT,
  PRODUCT_RELATED_FIELDS,
  FALLBACK_CATEGORIES,
  FALLBACK_PRODUCTS,
  findProductBySlug,
  parseProduct,
  parseProducts,
} from '../lib/catalogQueries';
import type { Category, Product } from '../types/database';

const CACHE_TTL_MS = 5 * 60 * 1000;

interface CachedProductDetail {
  product: Product;
  fetchedAt: number;
}

interface CatalogState {
  categories: Category[];
  products: Product[];
  categoriesFetchedAt: number | null;
  productsFetchedAt: number | null;
  categoriesLoading: boolean;
  productsLoading: boolean;
  productDetailsBySlug: Record<string, CachedProductDetail>;
  categoriesPromise: Promise<Category[]> | null;
  productsPromise: Promise<Product[]> | null;

  fetchCategories: (force?: boolean) => Promise<Category[]>;
  fetchProducts: (force?: boolean) => Promise<Product[]>;
  initializeCatalog: (force?: boolean) => Promise<void>;
  getProductBySlug: (slug: string, force?: boolean) => Promise<Product | null>;
  getRelatedProducts: (
    productId: string,
    categoryId: string | null,
    limit?: number
  ) => Promise<Product[]>;
  getFeaturedProducts: () => Product[];
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  addCategory: (category: Category) => void;
  updateCategory: (category: Category) => void;
  deleteCategory: (id: string) => void;
}

function isFresh(fetchedAt: number | null): boolean {
  return fetchedAt !== null && Date.now() - fetchedAt < CACHE_TTL_MS;
}

async function fetchCategoriesFromNetwork(): Promise<Category[]> {
  const localCustomCats: Category[] = typeof window !== 'undefined'
    ? JSON.parse(localStorage.getItem('elitebath_custom_categories') || '[]')
    : [];

  try {
    const { data, error } = await withTimeout(
      supabase.from('categories').select(CATEGORY_FIELDS).order('name')
    );
    if (error) throw error;
    const dbCats = (data && data.length > 0) ? (data as Category[]) : [];
    
    // Merge: custom categories first, then DB categories, then fallback categories
    const merged = [...localCustomCats];
    for (const c of dbCats) {
      if (!merged.some((m) => m.id === c.id || m.name.toLowerCase() === c.name.toLowerCase())) {
        merged.push(c);
      }
    }
    for (const fb of FALLBACK_CATEGORIES) {
      if (!merged.some((m) => m.id === fb.id || m.name.toLowerCase() === fb.name.toLowerCase())) {
        merged.push(fb);
      }
    }
    return merged;
  } catch (err) {
    console.warn('Network category fetch error, returning local + fallback categories:', err);
    const merged = [...localCustomCats];
    for (const fb of FALLBACK_CATEGORIES) {
      if (!merged.some((m) => m.id === fb.id || m.name.toLowerCase() === fb.name.toLowerCase())) {
        merged.push(fb);
      }
    }
    return merged;
  }
}

async function fetchProductsFromNetwork(): Promise<Product[]> {
  const localCustomProds: Product[] = typeof window !== 'undefined'
    ? JSON.parse(localStorage.getItem('elitebath_custom_products') || '[]')
    : [];

  try {
    const { data, error } = await withTimeout(
      supabase
        .from('products')
        .select(PRODUCT_LIST_SELECT)
        .order('created_at', { ascending: false })
    );
    if (error) throw error;
    const parsed = parseProducts(data as Record<string, unknown>[] | null);

    // Merge: custom local products first, then DB products, then fallback products
    const merged = [...localCustomProds];
    for (const p of parsed) {
      if (!merged.some((m) => m.id === p.id || m.slug === p.slug)) {
        merged.push(p);
      }
    }
    for (const fb of FALLBACK_PRODUCTS) {
      if (!merged.some((m) => m.id === fb.id || m.slug === fb.slug)) {
        merged.push(fb);
      }
    }
    return merged;
  } catch (err) {
    console.warn('Network product fetch error, returning local + fallback products:', err);
    const merged = [...localCustomProds];
    for (const fb of FALLBACK_PRODUCTS) {
      if (!merged.some((m) => m.id === fb.id || m.slug === fb.slug)) {
        merged.push(fb);
      }
    }
    return merged;
  }
}

async function fetchProductDetailFromNetwork(id: string): Promise<Product | null> {
  // First check local custom products
  if (typeof window !== 'undefined') {
    const localCustom: Product[] = JSON.parse(localStorage.getItem('elitebath_custom_products') || '[]');
    const matched = localCustom.find((p) => p.id === id);
    if (matched) return matched;
  }

  try {
    const { data, error } = await withTimeout(
      supabase.from('products').select(PRODUCT_DETAIL_SELECT).eq('id', id).maybeSingle()
    );
    if (error) throw error;
    if (data) return parseProduct(data as Record<string, unknown>);
  } catch (err) {
    console.warn('Product detail by ID fetch error:', err);
  }
  return FALLBACK_PRODUCTS.find((p) => p.id === id) ?? null;
}

async function fetchProductDetailBySlugFromNetwork(slug: string): Promise<Product | null> {
  const cleanSlug = slug.toLowerCase().trim();

  // First check local custom products
  if (typeof window !== 'undefined') {
    const localCustom: Product[] = JSON.parse(localStorage.getItem('elitebath_custom_products') || '[]');
    const matched = localCustom.find(
      (p) =>
        p.slug.toLowerCase() === cleanSlug ||
        sanitizeSlug(p.slug, p.name).toLowerCase() === cleanSlug ||
        p.id.toLowerCase() === cleanSlug
    );
    if (matched) return matched;
  }

  try {
    const { data, error } = await withTimeout(
      supabase.from('products').select(PRODUCT_DETAIL_SELECT).eq('slug', cleanSlug).maybeSingle()
    );
    if (error) throw error;
    if (data) return parseProduct(data as Record<string, unknown>);
  } catch (err) {
    console.warn('Product detail by slug fetch error:', err);
  }

  // Also check if slug is a valid UUID in Supabase
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanSlug)) {
    try {
      const { data, error } = await withTimeout(
        supabase.from('products').select(PRODUCT_DETAIL_SELECT).eq('id', cleanSlug).maybeSingle()
      );
      if (!error && data) return parseProduct(data as Record<string, unknown>);
    } catch (_) {}
  }

  return (
    FALLBACK_PRODUCTS.find(
      (p) =>
        p.slug.toLowerCase() === cleanSlug ||
        sanitizeSlug(p.slug, p.name).toLowerCase() === cleanSlug ||
        p.id.toLowerCase() === cleanSlug
    ) ?? null
  );
}

export const useCatalogStore = create<CatalogState>()(
  persist(
    (set, get) => ({
      categories: FALLBACK_CATEGORIES,
      products: FALLBACK_PRODUCTS,
      categoriesFetchedAt: null,
      productsFetchedAt: null,
      categoriesLoading: false,
      productsLoading: false,
      productDetailsBySlug: {},
      categoriesPromise: null,
      productsPromise: null,

      getFeaturedProducts: () => get().products.filter((p) => p.featured),

      initializeCatalog: async (force = false) => {
        await Promise.all([get().fetchCategories(force), get().fetchProducts(force)]);
      },

      fetchCategories: async (force = false) => {
        const state = get();
        if (!force && state.categories.length > 0 && isFresh(state.categoriesFetchedAt)) {
          return state.categories;
        }

        if (!force && state.categories.length > 0 && !state.categoriesLoading) {
          void (async () => {
            try {
              const categories = await fetchCategoriesFromNetwork();
              set({ categories, categoriesFetchedAt: Date.now() });
            } catch (err) {
              console.error('Background category refresh failed:', err);
            }
          })();
          return state.categories;
        }

        if (state.categoriesPromise) return state.categoriesPromise;

        set({ categoriesLoading: true });
        const promise = fetchCategoriesFromNetwork()
          .then((categories) => {
            set({ categories, categoriesFetchedAt: Date.now(), categoriesLoading: false });
            return categories;
          })
          .catch((err) => {
            console.error('Error fetching categories:', err);
            set({ categoriesLoading: false });
            return get().categories;
          })
          .finally(() => {
            set({ categoriesPromise: null });
          });

        set({ categoriesPromise: promise });
        return promise;
      },

      fetchProducts: async (force = false) => {
        const state = get();
        if (!force && state.products.length > 0 && isFresh(state.productsFetchedAt)) {
          return state.products;
        }

        if (!force && state.products.length > 0 && !state.productsLoading) {
          void (async () => {
            try {
              const products = await fetchProductsFromNetwork();
              set({ products, productsFetchedAt: Date.now() });
            } catch (err) {
              console.error('Background product refresh failed:', err);
            }
          })();
          return state.products;
        }

        if (state.productsPromise) return state.productsPromise;

        set({ productsLoading: true });
        const promise = fetchProductsFromNetwork()
          .then((products) => {
            set({ products, productsFetchedAt: Date.now(), productsLoading: false });
            return products;
          })
          .catch((err) => {
            console.error('Error fetching products:', err);
            set({ productsLoading: false });
            return get().products;
          })
          .finally(() => {
            set({ productsPromise: null });
          });

        set({ productsPromise: promise });
        return promise;
      },

      getProductBySlug: async (slug, force = false) => {
        const cacheKey = slug.toLowerCase().trim();
        const cached = get().productDetailsBySlug[cacheKey];
        if (!force && cached && isFresh(cached.fetchedAt)) {
          return cached.product;
        }

        // 1. First check in-memory store products
        let product: Product | null = findProductBySlug(get().products, cacheKey) || null;

        // 2. If not found in memory, query by slug
        if (!product) {
          product = await fetchProductDetailBySlugFromNetwork(cacheKey);
        }

        // 3. If still not found, fetch all products and check again
        if (!product) {
          const products = await get().fetchProducts(true);
          product = findProductBySlug(products, cacheKey) || null;
        }

        // 4. If we have a product from memory or list, try to fetch enriched variants/images if missing
        if (product && (!product.variants || product.variants.length === 0)) {
          const enriched = await fetchProductDetailFromNetwork(product.id);
          if (enriched) {
            product = enriched;
          }
        }

        if (product) {
          set((state) => ({
            productDetailsBySlug: {
              ...state.productDetailsBySlug,
              [cacheKey]: { product: product!, fetchedAt: Date.now() },
            },
          }));
        }

        return product;
      },

      getRelatedProducts: async (productId, categoryId, limit = 4) => {
        if (!categoryId) return [];

        const fromCache = get()
          .products.filter((p) => p.category_id === categoryId && p.id !== productId)
          .slice(0, limit);

        if (fromCache.length >= limit) return fromCache;

        try {
          const { data, error } = await withTimeout(
            supabase
              .from('products')
              .select(PRODUCT_RELATED_FIELDS)
              .eq('category_id', categoryId)
              .neq('id', productId)
              .limit(limit)
          );
          if (error) throw error;
          const fetched = parseProducts(data as Record<string, unknown>[] | null);
          return fetched.length > 0 ? fetched : fromCache;
        } catch (err) {
          console.warn('Could not fetch related products:', err);
          return fromCache;
        }
      },

      addProduct: (newProd: Product) => {
        if (typeof window !== 'undefined') {
          const custom = JSON.parse(localStorage.getItem('elitebath_custom_products') || '[]');
          const updated = [newProd, ...custom.filter((p: any) => p.id !== newProd.id)];
          localStorage.setItem('elitebath_custom_products', JSON.stringify(updated));
        }
        set((state) => ({
          products: [newProd, ...state.products.filter((p) => p.id !== newProd.id)],
          productsFetchedAt: Date.now(),
        }));
      },

      updateProduct: (updatedProd: Product) => {
        if (typeof window !== 'undefined') {
          const custom = JSON.parse(localStorage.getItem('elitebath_custom_products') || '[]');
          const updated = custom.map((p: any) => (p.id === updatedProd.id ? updatedProd : p));
          localStorage.setItem('elitebath_custom_products', JSON.stringify(updated));
        }
        set((state) => ({
          products: state.products.map((p) => (p.id === updatedProd.id ? updatedProd : p)),
          productsFetchedAt: Date.now(),
        }));
      },

      deleteProduct: (id: string) => {
        if (typeof window !== 'undefined') {
          const custom = JSON.parse(localStorage.getItem('elitebath_custom_products') || '[]');
          const updated = custom.filter((p: any) => p.id !== id);
          localStorage.setItem('elitebath_custom_products', JSON.stringify(updated));
        }
        set((state) => ({
          products: state.products.filter((p) => p.id !== id),
          productsFetchedAt: Date.now(),
        }));
      },

      addCategory: (newCat: Category) => {
        if (typeof window !== 'undefined') {
          const custom = JSON.parse(localStorage.getItem('elitebath_custom_categories') || '[]');
          const updated = [newCat, ...custom.filter((c: any) => c.id !== newCat.id)];
          localStorage.setItem('elitebath_custom_categories', JSON.stringify(updated));
        }
        set((state) => ({
          categories: [newCat, ...state.categories.filter((c) => c.id !== newCat.id)],
          categoriesFetchedAt: Date.now(),
        }));
      },

      updateCategory: (updatedCat: Category) => {
        if (typeof window !== 'undefined') {
          const custom = JSON.parse(localStorage.getItem('elitebath_custom_categories') || '[]');
          const updated = custom.map((c: any) => (c.id === updatedCat.id ? updatedCat : c));
          localStorage.setItem('elitebath_custom_categories', JSON.stringify(updated));
        }
        set((state) => ({
          categories: state.categories.map((c) => (c.id === updatedCat.id ? updatedCat : c)),
          categoriesFetchedAt: Date.now(),
        }));
      },

      deleteCategory: (id: string) => {
        if (typeof window !== 'undefined') {
          const custom = JSON.parse(localStorage.getItem('elitebath_custom_categories') || '[]');
          const updated = custom.filter((c: any) => c.id !== id);
          localStorage.setItem('elitebath_custom_categories', JSON.stringify(updated));
        }
        set((state) => ({
          categories: state.categories.filter((c) => c.id !== id),
          categoriesFetchedAt: Date.now(),
        }));
      },
    }),
    {
      name: 'elite-bath-catalog',
      partialize: (state) => ({
        categories: state.categories,
        products: state.products,
        categoriesFetchedAt: state.categoriesFetchedAt,
        productsFetchedAt: state.productsFetchedAt,
        productDetailsBySlug: state.productDetailsBySlug,
      }),
    }
  )
);
