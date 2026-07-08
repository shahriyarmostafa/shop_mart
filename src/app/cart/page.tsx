'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import SafeImage from '@/components/SafeImage';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { useCartStore } from '@/lib/cart-store';
import { formatPrice } from '@/lib/utils';

export default function CartPage() {
  const { items, removeItem, updateQuantity, totalPrice } = useCartStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  if (items.length === 0) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-20 text-center">
        <ShoppingBag size={48} className="mx-auto text-ink-200 mb-4" />
        <h1 className="font-display text-2xl font-semibold text-ink mb-2">Your cart is empty</h1>
        <p className="text-ink-400 mb-6">Looks like you haven&apos;t added anything yet.</p>
        <Link href="/" className="bg-marigold-400 hover:bg-marigold-500 text-ink font-semibold px-6 py-3 rounded-full transition-colors">
          Continue Shopping
        </Link>
      </main>
    );
  }

  const subtotal = totalPrice();
  const shipping = subtotal >= 1500 ? 0 : 60;

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="font-display text-2xl font-semibold text-ink mb-6">Your Cart</h1>
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={item.productId} className="flex gap-4 bg-white rounded-xl p-3 shadow-card">
              <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-ink-50 shrink-0">
                <SafeImage src={item.image} alt={item.name} fill sizes="80px" className="object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-ink-700 line-clamp-2">{item.name}</h3>
                <p className="font-mono text-sm text-ink-500 mt-1">{formatPrice(item.price)}</p>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center border border-ink-100 rounded-full">
                    <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} className="p-1.5" aria-label="Decrease">
                      <Minus size={12} />
                    </button>
                    <span className="w-7 text-center text-xs font-medium">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} className="p-1.5" aria-label="Increase">
                      <Plus size={12} />
                    </button>
                  </div>
                  <button onClick={() => removeItem(item.productId)} className="text-ink-300 hover:text-spice transition-colors" aria-label="Remove item">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl p-5 shadow-card h-fit">
          <h2 className="font-display text-lg font-semibold text-ink mb-4">Order Summary</h2>
          <div className="flex justify-between text-sm text-ink-500 mb-2">
            <span>Subtotal</span>
            <span className="font-mono">{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm text-ink-500 mb-2">
            <span>Shipping</span>
            <span className="font-mono">{shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
          </div>
          <div className="border-t border-ink-50 my-3" />
          <div className="flex justify-between font-semibold text-ink mb-5">
            <span>Total</span>
            <span className="font-mono">{formatPrice(subtotal + shipping)}</span>
          </div>
          <Link
            href="/checkout"
            className="block text-center bg-marigold-400 hover:bg-marigold-500 text-ink font-semibold py-3 rounded-full transition-colors"
          >
            Proceed to Checkout
          </Link>
        </div>
      </div>
    </main>
  );
}
