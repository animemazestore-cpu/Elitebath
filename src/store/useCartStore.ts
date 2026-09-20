import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product } from '../types/database';

export interface CartItem {
  product: Product;
  quantity: number;
  selectedVariant?: string; // Human-readable string e.g. "Matte Black / 10 Inch"
  selectedVariantId?: string; // Exact ProductVariant UUID
  selectedAttributes?: Record<string, string>; // Attributes map e.g. { color: "Matte Black" }
  variantPrice?: number; // Exact variant price if different from base product
  variantSku?: string;
  variantImage?: string;
  variantStock?: number;
}

export interface AddItemOptions {
  selectedVariant?: string;
  selectedVariantId?: string;
  selectedAttributes?: Record<string, string>;
  variantPrice?: number;
  variantSku?: string;
  variantImage?: string;
  variantStock?: number;
}

interface CartState {
  items: CartItem[];
  addItem: (
    product: Product,
    quantity?: number,
    selectedVariantOrOptions?: string | AddItemOptions,
    variantId?: string,
    attributes?: Record<string, string>,
    variantPrice?: number,
    variantSku?: string,
    variantImage?: string,
    variantStock?: number
  ) => void;
  removeItem: (productId: string, variantIdentifier?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantIdentifier?: string) => void;
  clearCart: () => void;
  getTotalAmount: () => number;
  getTotalItems: () => number;
}

function getVariantKey(item: { selectedVariantId?: string; selectedVariant?: string }): string {
  return item.selectedVariantId || item.selectedVariant || '';
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (
        product,
        quantity = 1,
        selectedVariantOrOptions,
        variantId,
        attributes,
        variantPrice,
        variantSku,
        variantImage,
        variantStock
      ) => {
        let opts: AddItemOptions = {};
        if (typeof selectedVariantOrOptions === 'string') {
          opts = {
            selectedVariant: selectedVariantOrOptions,
            selectedVariantId: variantId,
            selectedAttributes: attributes,
            variantPrice,
            variantSku,
            variantImage,
            variantStock,
          };
        } else if (typeof selectedVariantOrOptions === 'object' && selectedVariantOrOptions !== null) {
          opts = selectedVariantOrOptions;
        }

        const variantKey = opts.selectedVariantId || opts.selectedVariant || '';
        const currentItems = get().items;
        const existingItemIndex = currentItems.findIndex(
          (item) => item.product.id === product.id && getVariantKey(item) === variantKey
        );

        const availableStock = opts.variantStock ?? product.stock ?? 999;

        if (existingItemIndex > -1) {
          const newItems = [...currentItems];
          const newQuantity = newItems[existingItemIndex].quantity + quantity;
          newItems[existingItemIndex].quantity = Math.min(newQuantity, availableStock);
          set({ items: newItems });
        } else {
          const initialQuantity = Math.min(quantity, availableStock);
          if (initialQuantity > 0) {
            set({
              items: [
                ...currentItems,
                {
                  product,
                  quantity: initialQuantity,
                  selectedVariant: opts.selectedVariant,
                  selectedVariantId: opts.selectedVariantId,
                  selectedAttributes: opts.selectedAttributes,
                  variantPrice: opts.variantPrice,
                  variantSku: opts.variantSku,
                  variantImage: opts.variantImage,
                  variantStock: opts.variantStock,
                },
              ],
            });
          }
        }
      },

      removeItem: (productId, variantIdentifier) => {
        set({
          items: get().items.filter((item) => {
            if (item.product.id !== productId) return true;
            if (variantIdentifier === undefined) return false;
            return getVariantKey(item) !== variantIdentifier;
          }),
        });
      },

      updateQuantity: (productId, quantity, variantIdentifier) => {
        const currentItems = get().items;
        const itemIndex = currentItems.findIndex((item) => {
          if (item.product.id !== productId) return false;
          if (variantIdentifier === undefined) return true;
          return getVariantKey(item) === variantIdentifier;
        });

        if (itemIndex > -1) {
          const newItems = [...currentItems];
          const maxStock = newItems[itemIndex].variantStock ?? newItems[itemIndex].product.stock ?? 999;
          newItems[itemIndex].quantity = Math.max(1, Math.min(quantity, maxStock));
          set({ items: newItems });
        }
      },

      clearCart: () => {
        set({ items: [] });
      },

      getTotalAmount: () => {
        return get().items.reduce((total, item) => {
          const price = item.variantPrice ?? item.product.price;
          return total + price * item.quantity;
        }, 0);
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },
    }),
    {
      name: 'elite-bath-cart',
    }
  )
);
