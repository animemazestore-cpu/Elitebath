import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Product } from '../types/database';
import { sanitizeSlug } from '../lib/persistence';

// We use localStorage as the single source of truth for wishlist items.
// This ensures locally-added products (with "local-prod-xxx" IDs) always
// work regardless of whether the user is logged in with Supabase or mock admin.
const WISHLIST_KEY = 'elitebath_wishlist';
const LEGACY_WISHLIST_KEY = 'animemaze_wishlist';

const loadFromStorage = (): Product[] => {
  try {
    const raw = localStorage.getItem(WISHLIST_KEY) || localStorage.getItem(LEGACY_WISHLIST_KEY);
    const parsed: Product[] = raw ? JSON.parse(raw) : [];
    return parsed.map(p => ({
      ...p,
      slug: sanitizeSlug(p.slug, p.name)
    }));
  } catch {
    return [];
  }
};

const saveToStorage = (items: Product[]): void => {
  try {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(items));
  } catch {
    // silently ignore storage quota errors
  }
};

interface WishlistState {
  items: Product[];
  loading: boolean;
  fetchWishlist: (userId: string) => Promise<void>;
  toggleWishlist: (userId: string, product: Product) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
  items: loadFromStorage(),
  loading: false,

  fetchWishlist: async (userId) => {
    set({ loading: true });

    const isMock = localStorage.getItem('animemaze_mock_session') === 'true';

    // Always load from localStorage first (handles guests and mock admin)
    const localItems = loadFromStorage();

    if (!userId || userId === 'guest' || isMock) {
      set({ items: localItems, loading: false });
      return;
    }

    try {
      // For real Supabase users: fetch from DB and merge with local
      const { data, error } = await supabase
        .from('wishlist')
        .select(`
          id,
          product_id,
          products (*)
        `)
        .eq('user_id', userId);

      if (error) throw error;

      const dbProducts: Product[] = (data || [])
        .map((item: any) => item.products)
        .filter((prod: any): prod is Product => prod !== null && prod !== undefined);

      // Merge: start with local items (covers locally-added products),
      // then add any DB products not already present locally
      const localItems = loadFromStorage();
      const merged = [...localItems];
      for (const dbProd of dbProducts) {
        if (!merged.some(lp => lp.id === dbProd.id)) {
          merged.push({
            ...dbProd,
            price: Number(dbProd.price),
            slug: sanitizeSlug(dbProd.slug, dbProd.name)
          });
        }
      }

      saveToStorage(merged);
      set({ items: merged, loading: false });
    } catch (err) {
      console.error('Error fetching wishlist from DB:', err);
      // Fall back to localStorage on DB error
      set({ items: loadFromStorage(), loading: false });
    }
  },

  toggleWishlist: async (userId, product) => {
    const currentItems = get().items;
    const exists = currentItems.some(item => item.id === product.id);

    // Optimistic update to localStorage immediately
    const newItems = exists
      ? currentItems.filter(item => item.id !== product.id)
      : [...currentItems, product];

    saveToStorage(newItems);
    set({ items: newItems });

    const isMock = localStorage.getItem('animemaze_mock_session') === 'true';
    if (isMock || !userId) return;

    // Sync to Supabase for real sessions (best-effort, no rollback needed)
    try {
      if (exists) {
        await supabase
          .from('wishlist')
          .delete()
          .eq('user_id', userId)
          .eq('product_id', product.id);
      } else {
        await supabase
          .from('wishlist')
          .insert({ user_id: userId, product_id: product.id });
      }
    } catch (err) {
      console.warn('Supabase wishlist sync failed (local state already updated):', err);
    }
  },

  isInWishlist: (productId) => {
    return get().items.some(item => item.id === productId);
  },

  clearWishlist: () => {
    saveToStorage([]);
    set({ items: [] });
  }
}));
