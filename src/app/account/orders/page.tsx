'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { formatPrice } from '@/lib/utils';
import { Package } from 'lucide-react';

type Order = {
  id: string;
  status: string;
  total: number;
  paymentMethod: string;
  createdAt: string;
  items: {
    id: string;
    quantity: number;
    price: number;
    variantLabel: string | null;
    product: { name: string; images: string };
  }[];
};

const statusColor: Record<string, string> = {
  PENDING: 'bg-marigold-100 text-marigold-600',
  CONFIRMED: 'bg-ink-100 text-ink-600',
  SHIPPED: 'bg-ink-100 text-ink-600',
  DELIVERED: 'bg-leaf/10 text-leaf',
  CANCELLED: 'bg-spice/10 text-spice',
};

export default function OrdersPage() {
  const { status } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/orders')
        .then((r) => r.json())
        .then((data) => setOrders(Array.isArray(data) ? data : []))
        .finally(() => setLoading(false));
    } else if (status === 'unauthenticated') {
      setLoading(false);
    }
  }, [status]);

  if (status === 'unauthenticated') {
    return (
      <main className="max-w-md mx-auto px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-semibold text-ink mb-3">Sign in to view your orders</h1>
        <Link href="/login" className="bg-marigold-400 hover:bg-marigold-500 text-ink font-semibold px-6 py-3 rounded-full transition-colors">
          Sign In
        </Link>
      </main>
    );
  }

  if (loading) return <main className="max-w-4xl mx-auto px-4 py-16 text-center text-ink-300">Loading orders...</main>;

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="font-display text-2xl font-semibold text-ink mb-6">My Orders</h1>

      {orders.length === 0 ? (
        <div className="text-center py-16">
          <Package size={48} className="mx-auto text-ink-200 mb-4" />
          <p className="text-ink-400 mb-6">You haven&apos;t placed any orders yet.</p>
          <Link href="/" className="bg-marigold-400 hover:bg-marigold-500 text-ink font-semibold px-6 py-3 rounded-full transition-colors">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-xl p-5 shadow-card">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div>
                  <p className="text-sm font-medium text-ink-700">Order #{order.id.slice(-8).toUpperCase()}</p>
                  <p className="text-xs text-ink-300">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusColor[order.status] || 'bg-ink-100 text-ink-600'}`}>
                  {order.status}
                </span>
              </div>
              <div className="border-t border-ink-50 pt-3 space-y-1.5">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm text-ink-500">
                    <span className="line-clamp-1 pr-2">
                      {item.product.name}
                      {item.variantLabel ? ` (${item.variantLabel})` : ''} × {item.quantity}
                    </span>
                    <span className="font-mono shrink-0">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-ink-50 mt-3 pt-3 flex justify-between text-sm font-semibold text-ink">
                <span>Total ({order.paymentMethod})</span>
                <span className="font-mono">{formatPrice(order.total)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
