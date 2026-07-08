import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type CartItem = {
  /** Stable identity for this line item: productId plus its selected variant ids (if any). Computed internally by addItem - never pass this in yourself. */
  key: string;
  productId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  stock: number;
  /** Ids of the specific product_variants rows selected (e.g. one for Color, one for Size), if this product has variants. */
  variantIds?: string[];
  /** Human-readable snapshot for display in the cart/checkout, e.g. "Color: Red, Size: XL". */
  variantLabel?: string;
};

function keyFor(productId: string, variantIds?: string[]) {
  const sorted = (variantIds && variantIds.length ? [...variantIds].sort() : []).join(',');
  return sorted ? `${productId}::${sorted}` : productId;
}

type CartState = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity' | 'key'>, qty?: number) => void;
  removeItem: (key: string) => void;
  updateQuantity: (key: string, qty: number) => void;
  clear: () => void;
  totalItems: () => number;
  totalPrice: () => number;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item, qty = 1) => {
        const key = keyFor(item.productId, item.variantIds);
        const items = [...get().items];
        const existing = items.find((i) => i.key === key);
        if (existing) {
          existing.quantity = Math.min(existing.quantity + qty, existing.stock);
        } else {
          items.push({ ...item, key, quantity: Math.min(qty, item.stock) });
        }
        set({ items });
      },
      removeItem: (key) => {
        set({ items: get().items.filter((i) => i.key !== key) });
      },
      updateQuantity: (key, qty) => {
        const items = get().items.map((i) => (i.key === key ? { ...i, quantity: Math.max(1, Math.min(qty, i.stock)) } : i));
        set({ items });
      },
      clear: () => set({ items: [] }),
      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      totalPrice: () => get().items.reduce((sum, i) => sum + i.quantity * i.price, 0),
    }),
    {
      name: 'shopmart-cart',
      version: 1,
      // Carts saved before variant support won't have a `key` field yet -
      // backfill it on load instead of losing whatever's in the cart.
      migrate: (persistedState: any, version) => {
        if (version < 1 && persistedState?.items) {
          persistedState.items = persistedState.items.map((i: any) => ({
            ...i,
            key: i.key || keyFor(i.productId, i.variantIds),
          }));
        }
        return persistedState;
      },
    }
  )
);
