'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ImageUploader from '@/components/admin/ImageUploader';
import { toast } from '@/lib/toast-store';

type Category = { id: string; name: string };

export type ProductFormValues = {
  name: string;
  description: string;
  price: string;
  compareAtPrice: string;
  stock: string;
  images: string[];
  categoryId: string;
  featured: boolean;
};

const EMPTY_FORM: ProductFormValues = {
  name: '',
  description: '',
  price: '',
  compareAtPrice: '',
  stock: '',
  images: [],
  categoryId: '',
  featured: false,
};

type Props = {
  mode: 'create' | 'edit';
  productId?: string;
  initialValues?: Partial<ProductFormValues>;
};

/** Safely reads a JSON body from a fetch Response, never throwing. */
async function safeJson(res: Response): Promise<any> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export default function ProductForm({ mode, productId, initialValues }: Props) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [form, setForm] = useState<ProductFormValues>({ ...EMPTY_FORM, ...initialValues });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/categories');
        const data = await safeJson(res);
        if (cancelled) return;
        if (!res.ok || !Array.isArray(data)) {
          setLoadError('Could not load categories.');
          return;
        }
        setCategories(data);
        setForm((f) => (f.categoryId ? f : { ...f, categoryId: data[0]?.id || '' }));
      } catch {
        if (!cancelled) setLoadError('Network error loading categories.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function update<K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validate(): string | null {
    if (!form.name.trim()) return 'Product name is required.';
    if (!form.description.trim()) return 'Description is required.';

    const price = Number(form.price);
    if (form.price === '' || Number.isNaN(price) || price < 0) return 'Enter a valid, non-negative price.';

    if (form.compareAtPrice !== '') {
      const compareAt = Number(form.compareAtPrice);
      if (Number.isNaN(compareAt) || compareAt < 0) return 'Compare-at price must be a valid, non-negative number.';
    }

    const stock = Number(form.stock);
    if (form.stock === '' || Number.isNaN(stock) || stock < 0 || !Number.isInteger(stock)) {
      return 'Enter a valid, non-negative whole number for stock.';
    }

    if (!form.categoryId) return 'Please select a category.';
    if (!form.images.length) return 'Add at least one product photo or image URL.';

    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const validationError = validate();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        price: form.price,
        compareAtPrice: form.compareAtPrice,
        stock: form.stock,
        images: form.images.join(','),
        categoryId: form.categoryId,
        featured: form.featured,
      };

      const url = mode === 'create' ? '/api/products' : `/api/products/${productId}`;
      const method = mode === 'create' ? 'POST' : 'PATCH';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await safeJson(res);

      if (!res.ok) {
        toast.error(data?.error || `Failed to ${mode === 'create' ? 'create' : 'update'} product.`);
        return;
      }

      toast.success(mode === 'create' ? 'Product created.' : 'Product updated.');
      router.push('/admin');
      router.refresh();
    } catch {
      toast.error('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-card space-y-4">
      {loadError && <div className="bg-spice/10 text-spice text-sm rounded-lg px-4 py-2.5">{loadError}</div>}

      <div>
        <label className="text-sm text-ink-500 mb-1 block">Product Name</label>
        <input
          required
          value={form.name}
          onChange={(e) => update('name', e.target.value)}
          className="w-full border border-ink-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-marigold-400"
        />
      </div>

      <div>
        <label className="text-sm text-ink-500 mb-1 block">Description</label>
        <textarea
          required
          rows={3}
          value={form.description}
          onChange={(e) => update('description', e.target.value)}
          className="w-full border border-ink-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-marigold-400"
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-sm text-ink-500 mb-1 block">Price (৳)</label>
          <input
            required
            type="number"
            min="0"
            step="0.01"
            value={form.price}
            onChange={(e) => update('price', e.target.value)}
            className="w-full border border-ink-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-marigold-400"
          />
        </div>
        <div>
          <label className="text-sm text-ink-500 mb-1 block">Compare-at (৳)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.compareAtPrice}
            onChange={(e) => update('compareAtPrice', e.target.value)}
            className="w-full border border-ink-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-marigold-400"
          />
        </div>
        <div>
          <label className="text-sm text-ink-500 mb-1 block">Stock</label>
          <input
            required
            type="number"
            min="0"
            step="1"
            value={form.stock}
            onChange={(e) => update('stock', e.target.value)}
            className="w-full border border-ink-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-marigold-400"
          />
        </div>
      </div>

      <div>
        <label className="text-sm text-ink-500 mb-1 block">Category</label>
        <select
          value={form.categoryId}
          onChange={(e) => update('categoryId', e.target.value)}
          className="w-full border border-ink-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-marigold-400"
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-sm text-ink-500 mb-1 block">Product Photos</label>
        <ImageUploader images={form.images} onChange={(images) => update('images', images)} />
      </div>

      <label className="flex items-center gap-2 text-sm text-ink-500">
        <input type="checkbox" checked={form.featured} onChange={(e) => update('featured', e.target.checked)} />
        Feature on homepage deals section
      </label>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-marigold-400 hover:bg-marigold-500 disabled:opacity-60 text-ink font-semibold py-3 rounded-full transition-colors"
      >
        {loading ? 'Saving...' : mode === 'create' ? 'Create Product' : 'Save Changes'}
      </button>
    </form>
  );
}
