'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useCartStore } from '@/lib/cart-store';
import { formatPrice } from '@/lib/utils';
import { CheckCircle2 } from 'lucide-react';

export default function CheckoutPage() {
  const { data: session, status } = useSession();
  const { items, totalPrice, clear } = useCartStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);
  const [form, setForm] = useState({ shippingName: '', shippingPhone: '', shippingAddress: '', paymentMethod: 'COD' });

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (mounted && session?.user) {
      setForm((f) => ({ ...f, shippingName: session.user?.name || '' }));
    }
  }, [mounted, session]);

  if (!mounted) return null;

  if (status === 'unauthenticated') {
    return (
      <main className="max-w-md mx-auto px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-semibold text-ink mb-3">Please sign in to check out</h1>
        <p className="text-ink-400 mb-6">You need an account to place an order and track it later.</p>
        <Link href="/login" className="bg-marigold-400 hover:bg-marigold-500 text-ink font-semibold px-6 py-3 rounded-full transition-colors">
          Sign In
        </Link>
      </main>
    );
  }

  if (items.length === 0 && !placedOrderId) {
    return (
      <main className="max-w-md mx-auto px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-semibold text-ink mb-3">Your cart is empty</h1>
        <Link href="/" className="bg-marigold-400 hover:bg-marigold-500 text-ink font-semibold px-6 py-3 rounded-full transition-colors">
          Continue Shopping
        </Link>
      </main>
    );
  }

  if (placedOrderId) {
    return (
      <main className="max-w-md mx-auto px-4 py-20 text-center">
        <CheckCircle2 size={56} className="mx-auto text-leaf mb-4" />
        <h1 className="font-display text-2xl font-semibold text-ink mb-2">Order placed!</h1>
        <p className="text-ink-400 mb-6">Order #{placedOrderId.slice(-8).toUpperCase()} has been confirmed. You&apos;ll pay on delivery.</p>
        <Link href="/account/orders" className="bg-marigold-400 hover:bg-marigold-500 text-ink font-semibold px-6 py-3 rounded-full transition-colors">
          View My Orders
        </Link>
      </main>
    );
  }

  const subtotal = totalPrice();
  const shipping = subtotal >= 1500 ? 0 : 60;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity, variantIds: i.variantIds })),
          ...form,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong.');
        return;
      }
      clear();
      setPlacedOrderId(data.id);
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="font-display text-2xl font-semibold text-ink mb-6">Checkout</h1>
      <div className="grid md:grid-cols-3 gap-8">
        <form onSubmit={handleSubmit} className="md:col-span-2 bg-white rounded-xl p-6 shadow-card space-y-4">
          <h2 className="font-display text-lg font-semibold text-ink mb-2">Shipping Details</h2>

          {error && <div className="bg-spice/10 text-spice text-sm rounded-lg px-4 py-2.5">{error}</div>}

          <div>
            <label className="text-sm text-ink-500 mb-1 block">Full Name</label>
            <input
              required
              value={form.shippingName}
              onChange={(e) => setForm({ ...form, shippingName: e.target.value })}
              className="w-full border border-ink-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-marigold-400"
            />
          </div>
          <div>
            <label className="text-sm text-ink-500 mb-1 block">Phone Number</label>
            <input
              required
              value={form.shippingPhone}
              onChange={(e) => setForm({ ...form, shippingPhone: e.target.value })}
              placeholder="01XXXXXXXXX"
              className="w-full border border-ink-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-marigold-400"
            />
          </div>
          <div>
            <label className="text-sm text-ink-500 mb-1 block">Delivery Address</label>
            <textarea
              required
              value={form.shippingAddress}
              onChange={(e) => setForm({ ...form, shippingAddress: e.target.value })}
              rows={3}
              placeholder="House, road, area, city"
              className="w-full border border-ink-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-marigold-400"
            />
          </div>

          <div>
            <label className="text-sm text-ink-500 mb-2 block">Payment Method</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'COD', label: 'Cash on Delivery' },
                { id: 'CARD', label: 'Card (demo)' },
              ].map((opt) => (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => setForm({ ...form, paymentMethod: opt.id })}
                  className={`text-sm font-medium rounded-lg border-2 py-2.5 transition-colors ${
                    form.paymentMethod === opt.id ? 'border-marigold-400 bg-marigold-50 text-ink' : 'border-ink-100 text-ink-500'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-marigold-400 hover:bg-marigold-500 disabled:opacity-60 text-ink font-semibold py-3 rounded-full transition-colors mt-4"
          >
            {loading ? 'Placing Order...' : `Place Order — ${formatPrice(subtotal + shipping)}`}
          </button>
        </form>

        <div className="bg-white rounded-xl p-5 shadow-card h-fit">
          <h2 className="font-display text-lg font-semibold text-ink mb-4">Order Summary</h2>
          {items.map((item) => (
            <div key={item.key} className="flex justify-between text-sm text-ink-500 mb-2">
              <span className="line-clamp-1 pr-2">
                {item.name}
                {item.variantLabel ? ` (${item.variantLabel})` : ''} × {item.quantity}
              </span>
              <span className="font-mono shrink-0">{formatPrice(item.price * item.quantity)}</span>
            </div>
          ))}
          <div className="border-t border-ink-50 my-3" />
          <div className="flex justify-between text-sm text-ink-500 mb-2">
            <span>Shipping</span>
            <span className="font-mono">{shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
          </div>
          <div className="flex justify-between font-semibold text-ink">
            <span>Total</span>
            <span className="font-mono">{formatPrice(subtotal + shipping)}</span>
          </div>
        </div>
      </div>
    </main>
  );
}
