'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

type Category = { id: string; name: string };

export default function NewProductPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    compareAtPrice: '',
    stock: '',
    images: '',
    categoryId: '',
    featured: false,
  });

  const isAdmin = status === 'authenticated' && (session?.user as any)?.role === 'ADMIN';

  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((data) => {
        setCategories(data);
        if (data[0]) setForm((f) => ({ ...f, categoryId: data[0].id }));
      });
  }, []);

  if (status !== 'loading' && !isAdmin) {
    return (
      <main className="max-w-md mx-auto px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-semibold text-ink mb-2">Admin access only</h1>
      </main>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to create product.');
        return;
      }
      router.push('/admin');
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="font-display text-2xl font-semibold text-ink mb-6">Add New Product</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-card space-y-4">
        {error && <div className="bg-spice/10 text-spice text-sm rounded-lg px-4 py-2.5">{error}</div>}

        <div>
          <label className="text-sm text-ink-500 mb-1 block">Product Name</label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full border border-ink-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-marigold-400"
          />
        </div>

        <div>
          <label className="text-sm text-ink-500 mb-1 block">Description</label>
          <textarea
            required
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full border border-ink-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-marigold-400"
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-sm text-ink-500 mb-1 block">Price (৳)</label>
            <input
              required
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className="w-full border border-ink-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-marigold-400"
            />
          </div>
          <div>
            <label className="text-sm text-ink-500 mb-1 block">Compare-at (৳)</label>
            <input
              type="number"
              value={form.compareAtPrice}
              onChange={(e) => setForm({ ...form, compareAtPrice: e.target.value })}
              className="w-full border border-ink-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-marigold-400"
            />
          </div>
          <div>
            <label className="text-sm text-ink-500 mb-1 block">Stock</label>
            <input
              required
              type="number"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
              className="w-full border border-ink-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-marigold-400"
            />
          </div>
        </div>

        <div>
          <label className="text-sm text-ink-500 mb-1 block">Category</label>
          <select
            value={form.categoryId}
            onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            className="w-full border border-ink-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-marigold-400"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm text-ink-500 mb-1 block">Image URLs (comma-separated)</label>
          <input
            required
            value={form.images}
            onChange={(e) => setForm({ ...form, images: e.target.value })}
            placeholder="https://example.com/img1.jpg, https://example.com/img2.jpg"
            className="w-full border border-ink-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-marigold-400"
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-ink-500">
          <input
            type="checkbox"
            checked={form.featured}
            onChange={(e) => setForm({ ...form, featured: e.target.checked })}
          />
          Feature on homepage deals section
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-marigold-400 hover:bg-marigold-500 disabled:opacity-60 text-ink font-semibold py-3 rounded-full transition-colors"
        >
          {loading ? 'Saving...' : 'Create Product'}
        </button>
      </form>
    </main>
  );
}
