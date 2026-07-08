'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import ProductForm, { ProductFormValues } from '@/components/admin/ProductForm';
import { toast } from '@/lib/toast-store';

export default function EditProductPage() {
  const { status, data: session } = useSession();
  const params = useParams<{ id: string }>();
  const productId = params?.id;

  const [initialValues, setInitialValues] = useState<Partial<ProductFormValues> | null>(null);
  const [fetchError, setFetchError] = useState('');
  const [loading, setLoading] = useState(true);

  const isAdmin = status === 'authenticated' && (session?.user as any)?.role === 'ADMIN';

  useEffect(() => {
    if (!isAdmin || !productId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/products/${productId}`);
        let data: any = null;
        try {
          data = await res.json();
        } catch {
          data = null;
        }

        if (cancelled) return;

        if (!res.ok || !data) {
          setFetchError(data?.error || 'Could not load this product.');
          return;
        }

        setInitialValues({
          name: data.name ?? '',
          description: data.description ?? '',
          price: data.price != null ? String(data.price) : '',
          compareAtPrice: data.compareAtPrice != null ? String(data.compareAtPrice) : '',
          stock: data.stock != null ? String(data.stock) : '',
          images: typeof data.images === 'string' && data.images.length ? data.images.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
          categoryId: data.categoryId ?? '',
          featured: !!data.featured,
          variants: Array.isArray(data.variants)
            ? data.variants.map((v: any) => ({
                key: v.id ?? Math.random().toString(36).slice(2),
                attributeName: v.attributeName ?? '',
                value: v.value ?? '',
                priceModifier: v.priceModifier != null ? String(v.priceModifier) : '0',
                stock: v.stock != null ? String(v.stock) : '0',
                image: v.image ?? '',
              }))
            : [],
        });
      } catch {
        if (!cancelled) {
          setFetchError('Network error while loading this product.');
          toast.error('Network error while loading this product.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAdmin, productId]);

  if (status !== 'loading' && !isAdmin) {
    return (
      <main className="max-w-md mx-auto px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-semibold text-ink mb-2">Admin access only</h1>
      </main>
    );
  }

  if (status === 'loading' || loading) {
    return <main className="max-w-2xl mx-auto px-4 py-16 text-center text-ink-300">Loading...</main>;
  }

  if (fetchError || !initialValues) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="font-display text-xl font-semibold text-ink mb-2">Couldn&apos;t load product</h1>
        <p className="text-ink-400 text-sm">{fetchError || 'This product may not exist anymore.'}</p>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="font-display text-2xl font-semibold text-ink mb-6">Edit Product</h1>
      <ProductForm mode="edit" productId={productId} initialValues={initialValues} />
    </main>
  );
}
