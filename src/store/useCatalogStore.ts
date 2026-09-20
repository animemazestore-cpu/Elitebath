import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import { withTimeout } from '../lib/withTimeout';
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
}

function isFresh(fetchedAt: number | null): boolean {
  return fetchedAt !== null && Date.now() - fetchedAt < CACHE_TTL_MS;
}

async function fetchCategoriesFromNetwork(): Promise<Category[]> {
  try {
    const { data, error } = await withTimeout(
      supabase.from('categories').select(CATEGORY_FIELDS).order('name')
    );
    if (error) throw error;
    if (data && data.length > 0) return data as Category[];
    return FALLBACK_CATEGORIES;
  } catch (err) {
    console.warn('Network category fetch failed, using default sanitaryware categories:', err);
    return FALLBACK_CATEGORIES;
  }
}

async function fetchProductsFromNetwork(): Promise<Product[]> {
  try {
    const { data, error } = await withTimeout(
      supabase
        .from('products')
        .select(PRODUCT_LIST_SELECT)
        .order('created_at', { ascending: false })
    );
    if (error) throw error;
    const parsed = parseProducts(data as Record<string, unknown>[] | null);
    if (parsed.length > 0) return parsed;
    return FALLBACK_PRODUCTS;
  } catch (err) {
    console.warn('Network product fetch failed, using luxury sanitaryware catalog:', err);
    return FALLBACK_PRODUCTS;
  }
}

async function fetchProductDetailFromNetwork(id: string): Promise<Product | null> {
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
  try {
    const { data, error } = await withTimeout(
      supabase.from('products').select(PRODUCT_DETAIL_SELECT).eq('slug', slug).maybeSingle()
    );
    if (error) throw error;
    if (data) return parseProduct(data as Record<string, unknown>);
  } catch (err) {
    console.warn('Product detail by slug fetch error:', err);
  }
  return FALLBACK_PRODUCTS.find((p) => p.slug === slug) ?? null;
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
        const cacheKey = slug.toLowerCase();
        const cached = get().productDetailsBySlug[cacheKey];
        if (!force && cached && isFresh(cached.fetchedAt)) {
          return cached.product;
        }

        let product = await fetchProductDetailBySlugFromNetwork(slug);

        if (!product) {
          const listMatch = findProductBySlug(get().products, slug);
          if (listMatch) {
            product = await fetchProductDetailFromNetwork(listMatch.id);
          }
        }

        if (!product) {
          const products = await get().fetchProducts();
          const listMatch = findProductBySlug(products, slug);
          if (listMatch) {
            product = await fetchProductDetailFromNetwork(listMatch.id);
          }
        }

        if (product) {
          set((state) => ({
            productDetailsBySlug: {
              ...state.productDetailsBySlug,
              [cacheKey]: { product, fetchedAt: Date.now() },
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
