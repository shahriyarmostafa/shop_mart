'use client';

import { useSession } from 'next-auth/react';
import ProductForm from '@/components/admin/ProductForm';

export default function NewProductPage() {
  const { status, data: session } = useSession();
  const isAdmin = status === 'authenticated' && (session?.user as any)?.role === 'ADMIN';

  if (status !== 'loading' && !isAdmin) {
    return (
      <main className="max-w-md mx-auto px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-semibold text-ink mb-2">Admin access only</h1>
      </main>
    );
  }

  if (status === 'loading') {
    return <main className="max-w-2xl mx-auto px-4 py-16 text-center text-ink-300">Loading...</main>;
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="font-display text-2xl font-semibold text-ink mb-6">Add New Product</h1>
      <ProductForm mode="create" />
    </main>
  );
}
