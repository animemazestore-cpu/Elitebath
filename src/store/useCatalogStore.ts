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

function isFresh(_fetchedAt: number | null): boolean {
  return false; // Always revalidate to guarantee live pricing across devices
}

async function fetchCategoriesFromNetwork(): Promise<Category[]> {
  const deletedCatIds: string[] =
    typeof window !== 'undefined'
      ? JSON.parse(localStorage.getItem('elitebath_deleted_category_ids') || '[]')
      : [];

  try {
    const { data, error } = await withTimeout(
      supabase.from('categories').select(CATEGORY_FIELDS).order('name')
    );
    if (error) throw error;
    const localCustomCats: Category[] =
      typeof window !== 'undefined'
        ? JSON.parse(localStorage.getItem('elitebath_custom_categories') || '[]')
        : [];

    const dbCats = data && data.length > 0 ? (data as Category[])
      .filter((c) => !deletedCatIds.includes(c.id))
      .map((c) => {
        const customOverride = localCustomCats.find(
          (lc) => lc.id === c.id || lc.name.toLowerCase() === c.name.toLowerCase()
        );
        if (customOverride) {
          return {
            ...c,
            ...customOverride,
            image_url: customOverride.image_url || c.image_url || '',
          };
        }
        if (!c.image_url) {
          const fb = FALLBACK_CATEGORIES.find(
            (f) => f.id === c.id || f.name.toLowerCase() === c.name.toLowerCase()
          );
          return { ...c, image_url: fb?.image_url || '' };
        }
        return c;
      }) : [];

    // Database + custom override merged
    const merged: Category[] = [...dbCats];
    for (const c of localCustomCats) {
      if (deletedCatIds.includes(c.id)) continue;
      const existingIdx = merged.findIndex((m) => m.id === c.id || m.name.toLowerCase() === c.name.toLowerCase());
      if (existingIdx >= 0) {
        merged[existingIdx] = { ...merged[existingIdx], ...c };
      } else {
        merged.push(c);
      }
    }
    for (const fb of FALLBACK_CATEGORIES) {
      if (deletedCatIds.includes(fb.id)) continue;
      const customOverride = localCustomCats.find(
        (lc) => lc.id === fb.id || lc.name.toLowerCase() === fb.name.toLowerCase()
      );
      if (!merged.some((m) => m.id === fb.id || m.name.toLowerCase() === fb.name.toLowerCase())) {
        merged.push(customOverride ? { ...fb, ...customOverride } : fb);
      }
    }
    return merged;
  } catch (err) {
    console.warn('Network category fetch error, returning local + fallback categories:', err);
    const localCustomCats: Category[] =
      typeof window !== 'undefined'
        ? JSON.parse(localStorage.getItem('elitebath_custom_categories') || '[]')
        : [];
    const merged = [...localCustomCats.filter((c) => !deletedCatIds.includes(c.id))];
    for (const fb of FALLBACK_CATEGORIES) {
      if (deletedCatIds.includes(fb.id)) continue;
      const customOverride = localCustomCats.find(
        (lc) => lc.id === fb.id || lc.name.toLowerCase() === fb.name.toLowerCase()
      );
      if (!merged.some((m) => m.id === fb.id || m.name.toLowerCase() === fb.name.toLowerCase())) {
        merged.push(customOverride ? { ...fb, ...customOverride } : fb);
      }
    }
    return merged;
  }
}

async function fetchProductsFromNetwork(): Promise<Product[]> {
  const deletedIds: string[] =
    typeof window !== 'undefined'
      ? JSON.parse(localStorage.getItem('elitebath_deleted_product_ids') || '[]')
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

    // Database products are 100% AUTHORITATIVE (instant sync across all devices)
    const merged: Product[] = [];
    for (const p of parsed) {
      if (!deletedIds.includes(p.id)) {
        merged.push(p);
      }
    }

    // Append any purely offline custom products that haven't synced to DB yet
    if (typeof window !== 'undefined') {
      const localCustomProds: Product[] = JSON.parse(
        localStorage.getItem('elitebath_custom_products') || '[]'
      );
      for (const cp of localCustomProds) {
        if (
          !deletedIds.includes(cp.id) &&
          !merged.some((m) => m.id === cp.id || m.slug.toLowerCase() === cp.slug.toLowerCase())
        ) {
          merged.push(cp);
        }
      }
    }

    return merged;
  } catch (err) {
    console.warn('Network product fetch error, falling back to local storage:', err);
    const localCustomProds: Product[] =
      typeof window !== 'undefined'
        ? JSON.parse(localStorage.getItem('elitebath_custom_products') || '[]')
        : [];
    const merged = [...localCustomProds.filter((p) => !deletedIds.includes(p.id))];
    return merged;
  }
}

async function fetchProductDetailFromNetwork(id: string): Promise<Product | null> {
  // Query Supabase database FIRST for authoritative current price and stock
  try {
    const { data, error } = await withTimeout(
      supabase.from('products').select(PRODUCT_DETAIL_SELECT).eq('id', id).maybeSingle()
    );
    if (!error && data) return parseProduct(data as Record<string, unknown>);
  } catch (err) {
    console.warn('Product detail by ID fetch error:', err);
  }

  // Fallback to local custom products if DB is unreachable
  if (typeof window !== 'undefined') {
    const localCustom: Product[] = JSON.parse(
      localStorage.getItem('elitebath_custom_products') || '[]'
    );
    const matched = localCustom.find((p) => p.id === id);
    if (matched) return matched;
  }

  return FALLBACK_PRODUCTS.find((p) => p.id === id) ?? null;
}

async function fetchProductDetailBySlugFromNetwork(slug: string): Promise<Product | null> {
  const cleanSlug = slug.toLowerCase().trim();

  // Query Supabase database FIRST for live authoritative price and stock
  try {
    const { data, error } = await withTimeout(
      supabase.from('products').select(PRODUCT_DETAIL_SELECT).eq('slug', cleanSlug).maybeSingle()
    );
    if (!error && data) return parseProduct(data as Record<string, unknown>);
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

  // Fallback to local custom products if DB is unreachable
  if (typeof window !== 'undefined') {
    const localCustom: Product[] = JSON.parse(
      localStorage.getItem('elitebath_custom_products') || '[]'
    );
    const matched = localCustom.find(
      (p) =>
        p.slug.toLowerCase() === cleanSlug ||
        sanitizeSlug(p.slug, p.name).toLowerCase() === cleanSlug ||
        p.id.toLowerCase() === cleanSlug
    );
    if (matched) return matched;
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
      products: [],
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

      fetchProducts: async (_force = false) => {
        const state = get();
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

      getProductBySlug: async (slug, _force = false) => {
        const cacheKey = slug.toLowerCase().trim();

        // 1. Immediately query live database for authoritative price & variants
        const liveProduct = await fetchProductDetailBySlugFromNetwork(cacheKey);
        if (liveProduct) {
          set((state) => ({
            products: state.products.some((p) => p.id === liveProduct.id)
              ? state.products.map((p) => (p.id === liveProduct.id ? liveProduct : p))
              : [liveProduct, ...state.products],
            productDetailsBySlug: {
              ...state.productDetailsBySlug,
              [cacheKey]: { product: liveProduct, fetchedAt: Date.now() },
            },
          }));
          return liveProduct;
        }

        // 2. Check in-memory store products
        let product: Product | null = findProductBySlug(get().products, cacheKey) || null;

        // 3. If still not found, fetch all products and check again
        if (!product) {
          const products = await get().fetchProducts(true);
          product = findProductBySlug(products, cacheKey) || null;
        }

        // 4. Enrich variants if missing
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

          const deletedIds: string[] = JSON.parse(localStorage.getItem('elitebath_deleted_product_ids') || '[]');
          const cleanDeleted = deletedIds.filter((id) => id !== newProd.id);
          localStorage.setItem('elitebath_deleted_product_ids', JSON.stringify(cleanDeleted));
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

          const deletedIds: string[] = JSON.parse(localStorage.getItem('elitebath_deleted_product_ids') || '[]');
          if (!deletedIds.includes(id)) {
            deletedIds.push(id);
            localStorage.setItem('elitebath_deleted_product_ids', JSON.stringify(deletedIds));
          }
        }
        set((state) => ({
          products: state.products.filter((p) => p.id !== id),
          productsFetchedAt: Date.now(),
        }));
      },

      addCategory: (newCat: Category) => {
        if (typeof window !== 'undefined') {
          const deletedCatIds: string[] = JSON.parse(localStorage.getItem('elitebath_deleted_category_ids') || '[]');
          if (deletedCatIds.includes(newCat.id)) {
            localStorage.setItem(
              'elitebath_deleted_category_ids',
              JSON.stringify(deletedCatIds.filter((id) => id !== newCat.id))
            );
          }

          const custom: Category[] = JSON.parse(localStorage.getItem('elitebath_custom_categories') || '[]');
          const updated = [
            newCat,
            ...custom.filter((c: any) => c.id !== newCat.id && c.name.toLowerCase() !== newCat.name.toLowerCase())
          ];
          localStorage.setItem('elitebath_custom_categories', JSON.stringify(updated));
        }
        set((state) => ({
          categories: [
            newCat,
            ...state.categories.filter((c) => c.id !== newCat.id && c.name.toLowerCase() !== newCat.name.toLowerCase())
          ],
          categoriesFetchedAt: Date.now(),
        }));
      },

      updateCategory: (updatedCat: Category) => {
        if (typeof window !== 'undefined') {
          const deletedCatIds: string[] = JSON.parse(localStorage.getItem('elitebath_deleted_category_ids') || '[]');
          if (deletedCatIds.includes(updatedCat.id)) {
            localStorage.setItem(
              'elitebath_deleted_category_ids',
              JSON.stringify(deletedCatIds.filter((id) => id !== updatedCat.id))
            );
          }

          const custom: Category[] = JSON.parse(localStorage.getItem('elitebath_custom_categories') || '[]');
          const idx = custom.findIndex((c: any) => c.id === updatedCat.id || c.name.toLowerCase() === updatedCat.name.toLowerCase());
          if (idx >= 0) {
            custom[idx] = { ...custom[idx], ...updatedCat };
          } else {
            custom.push(updatedCat);
          }
          localStorage.setItem('elitebath_custom_categories', JSON.stringify(custom));
        }
        set((state) => ({
          categories: state.categories.map((c) => (c.id === updatedCat.id || c.name.toLowerCase() === updatedCat.name.toLowerCase() ? { ...c, ...updatedCat } : c)),
          categoriesFetchedAt: Date.now(),
        }));
      },

      deleteCategory: (id: string) => {
        if (typeof window !== 'undefined') {
          const custom: Category[] = JSON.parse(localStorage.getItem('elitebath_custom_categories') || '[]');
          const updated = custom.filter((c: any) => c.id !== id);
          localStorage.setItem('elitebath_custom_categories', JSON.stringify(updated));

          const deletedCatIds: string[] = JSON.parse(localStorage.getItem('elitebath_deleted_category_ids') || '[]');
          if (!deletedCatIds.includes(id)) {
            deletedCatIds.push(id);
            localStorage.setItem('elitebath_deleted_category_ids', JSON.stringify(deletedCatIds));
          }
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
        categoriesFetchedAt: state.categoriesFetchedAt,
        // DO NOT persist products or productDetailsBySlug so prices are always fresh from DB!
      }),
    }
  )
);

// Realtime synchronizer: instantly sync live prices & stock across all connected devices
if (typeof window !== 'undefined') {
  // Purge any legacy stale catalog and mock products from localStorage
  try {
    const rawCatalog = localStorage.getItem('elite-bath-catalog');
    if (rawCatalog) {
      const parsed = JSON.parse(rawCatalog);
      if (parsed?.state?.products) {
        delete parsed.state.products;
        delete parsed.state.productDetailsBySlug;
        localStorage.setItem('elite-bath-catalog', JSON.stringify(parsed));
      }
    }

    const rawCustom = localStorage.getItem('elitebath_custom_products');
    if (rawCustom) {
      const parsedCustom: any[] = JSON.parse(rawCustom);
      const filteredCustom = parsedCustom.filter((p) => !p.id?.startsWith('prod-'));
      localStorage.setItem('elitebath_custom_products', JSON.stringify(filteredCustom));
    }
  } catch (_) {}

  // Subscribe to real-time changes in products or product_variants
  try {
    supabase
      .channel('catalog-realtime-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        () => {
          useCatalogStore.getState().fetchProducts(true);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'product_variants' },
        () => {
          useCatalogStore.getState().fetchProducts(true);
        }
      )
      .subscribe();
  } catch (e) {
    console.warn('Realtime catalog subscription warning:', e);
  }
}
