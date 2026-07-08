'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Minus, Plus, ShoppingCart, Zap } from 'lucide-react';
import { useCartStore } from '@/lib/cart-store';

type Props = {
  productId: string;
  name: string;
  price: number;
  image: string;
  stock: number;
  /** Ids of the currently selected variant(s), if this product has them. */
  variantIds?: string[];
  /** Human-readable snapshot of the current selection, e.g. "Color: Red". */
  variantLabel?: string;
};

export default function AddToCartPanel({ productId, name, price, image, stock, variantIds, variantLabel }: Props) {
  const [qty, setQty] = useState(1);
  const addItem = useCartStore((s) => s.addItem);
  const router = useRouter();

  // If the shopper switches to a variant with less stock than their current
  // quantity selection (or that just sold out), bring quantity back in line.
  useEffect(() => {
    setQty((q) => Math.min(Math.max(q, 1), Math.max(stock, 1)));
  }, [stock]);

  function handleAdd() {
    addItem({ productId, name, price, image, stock, variantIds, variantLabel }, qty);
  }

  function handleBuyNow() {
    addItem({ productId, name, price, image, stock, variantIds, variantLabel }, qty);
    router.push('/checkout');
  }

  if (stock === 0) {
    return (
      <div className="mt-6 bg-ink-50 text-ink-400 rounded-lg px-4 py-3 text-sm font-medium">
        This product is currently out of stock.
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="flex items-center gap-4 mb-4">
        <span className="text-sm text-ink-500">Quantity</span>
        <div className="flex items-center border border-ink-100 rounded-full">
          <button
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="p-2 hover:text-marigold-500"
            aria-label="Decrease quantity"
          >
            <Minus size={14} />
          </button>
          <span className="w-8 text-center text-sm font-medium">{qty}</span>
          <button
            onClick={() => setQty((q) => Math.min(stock, q + 1))}
            className="p-2 hover:text-marigold-500"
            aria-label="Increase quantity"
          >
            <Plus size={14} />
          </button>
        </div>
        <span className="text-xs text-ink-300">{stock} available</span>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleAdd}
          className="flex-1 flex items-center justify-center gap-2 border-2 border-ink text-ink font-semibold py-3 rounded-full hover:bg-ink-50 transition-colors"
        >
          <ShoppingCart size={18} /> Add to Cart
        </button>
        <button
          onClick={handleBuyNow}
          className="flex-1 flex items-center justify-center gap-2 bg-marigold-400 hover:bg-marigold-500 text-ink font-semibold py-3 rounded-full transition-colors"
        >
          <Zap size={18} /> Buy Now
        </button>
      </div>
    </div>
  );
}
