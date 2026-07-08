'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { formatPrice } from '@/lib/utils';
import { toast } from '@/lib/toast-store';
import SafeImage from '@/components/SafeImage';
import { Plus, Trash2, Pencil, Package, ShoppingBag, DollarSign } from 'lucide-react';

type Product = {
  id: string;
  name: string;
  price: number;
  stock: number;
  images: string;
  category?: { name: string };
};

type Order = { id: string; total: number; status: string };

async function safeJson(res: Response): Promise<any> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const isAdmin = status === 'authenticated' && (session?.user as any)?.role === 'ADMIN';

  useEffect(() => {
    if (!isAdmin) {
      if (status !== 'loading') setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const [productsRes, ordersRes] = await Promise.all([
          fetch('/api/products'),
          fetch('/api/orders?all=true'),
        ]);
        const [p, o] = await Promise.all([safeJson(productsRes), safeJson(ordersRes)]);
        if (cancelled) return;

        if (!productsRes.ok) {
          setLoadError(p?.error || 'Failed to load products.');
        }
        setProducts(Array.isArray(p) ? p : []);
        setOrders(Array.isArray(o) ? o : []);
      } catch {
        if (!cancelled) {
          setLoadError('Network error while loading the dashboard.');
          toast.error('Network error while loading the dashboard.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAdmin, status]);

  async function handleDelete(id: string) {
    if (!confirm('Delete this product?')) return;
    const previous = products;
    setProducts((p) => p.filter((x) => x.id !== id));
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      const data = await safeJson(res);
      if (!res.ok) {
        setProducts(previous);
        toast.error(data?.error || 'Failed to delete product.');
        return;
      }
      toast.success('Product deleted.');
    } catch {
      setProducts(previous);
      toast.error('Network error. Product was not deleted.');
    }
  }

  if (status === 'loading' || loading) {
    return <main className="max-w-6xl mx-auto px-4 py-16 text-center text-ink-300">Loading...</main>;
  }

  if (!isAdmin) {
    return (
      <main className="max-w-md mx-auto px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-semibold text-ink mb-2">Admin access only</h1>
        <p className="text-ink-400">Sign in with an admin account to manage the store.</p>
      </main>
    );
  }

  const revenue = orders.reduce((sum, o) => sum + o.total, 0);

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-semibold text-ink">Admin Dashboard</h1>
        <Link
          href="/admin/products/new"
          className="flex items-center gap-2 bg-marigold-400 hover:bg-marigold-500 text-ink font-semibold px-4 py-2.5 rounded-full transition-colors"
        >
          <Plus size={18} /> Add Product
        </Link>
      </div>

      {loadError && (
        <div className="bg-spice/10 text-spice text-sm rounded-lg px-4 py-2.5 mb-6">{loadError}</div>
      )}

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl p-5 shadow-card flex items-center gap-4">
          <div className="bg-ink-50 p-3 rounded-full"><Package size={22} className="text-ink" /></div>
          <div>
            <p className="text-xs text-ink-300">Products</p>
            <p className="text-xl font-semibold text-ink">{products.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-card flex items-center gap-4">
          <div className="bg-ink-50 p-3 rounded-full"><ShoppingBag size={22} className="text-ink" /></div>
          <div>
            <p className="text-xs text-ink-300">Orders</p>
            <p className="text-xl font-semibold text-ink">{orders.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-card flex items-center gap-4">
          <div className="bg-ink-50 p-3 rounded-full"><DollarSign size={22} className="text-ink" /></div>
          <div>
            <p className="text-xs text-ink-300">Total Revenue</p>
            <p className="text-xl font-semibold text-ink font-mono">{formatPrice(revenue)}</p>
          </div>
        </div>
      </div>

      <h2 className="font-display text-lg font-semibold text-ink mb-3">Products</h2>
      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-ink-50 text-ink-500 text-left">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-t border-ink-50">
                <td className="px-4 py-3 flex items-center gap-3">
                  <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-ink-50 shrink-0">
                    <SafeImage src={p.images?.split(',')[0]} alt={p.name} fill sizes="40px" className="object-cover" />
                  </div>
                  <span className="line-clamp-1">{p.name}</span>
                </td>
                <td className="px-4 py-3 text-ink-400">{p.category?.name ?? '—'}</td>
                <td className="px-4 py-3 font-mono">{formatPrice(p.price)}</td>
                <td className="px-4 py-3">{p.stock}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <Link
                      href={`/admin/products/${p.id}/edit`}
                      className="text-ink-300 hover:text-ink transition-colors"
                      aria-label="Edit"
                    >
                      <Pencil size={16} />
                    </Link>
                    <button onClick={() => handleDelete(p.id)} className="text-ink-300 hover:text-spice transition-colors" aria-label="Delete">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-ink-300">
                  No products yet. Add your first one to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
