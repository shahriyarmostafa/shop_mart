import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type CartItem = {
  productId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  stock: number;
};

type CartState = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>, qty?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, qty: number) => void;
  clear: () => void;
  totalItems: () => number;
  totalPrice: () => number;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item, qty = 1) => {
        const items = [...get().items];
        const existing = items.find((i) => i.productId === item.productId);
        if (existing) {
          existing.quantity = Math.min(existing.quantity + qty, existing.stock);
        } else {
          items.push({ ...item, quantity: Math.min(qty, item.stock) });
        }
        set({ items });
      },
      removeItem: (productId) => {
        set({ items: get().items.filter((i) => i.productId !== productId) });
      },
      updateQuantity: (productId, qty) => {
        const items = get().items.map((i) =>
          i.productId === productId ? { ...i, quantity: Math.max(1, Math.min(qty, i.stock)) } : i
        );
        set({ items });
      },
      clear: () => set({ items: [] }),
      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      totalPrice: () => get().items.reduce((sum, i) => sum + i.quantity * i.price, 0),
    }),
    { name: 'shopmart-cart' }
  )
);
