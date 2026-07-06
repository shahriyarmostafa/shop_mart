import { getCategoryBySlug, getProducts } from '@/lib/db';
import CategoryNav from '@/components/CategoryNav';
import ProductCard from '@/components/ProductCard';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export default function CategoryPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { sort?: string };
}) {
  const category = getCategoryBySlug(params.slug);
  if (!category) notFound();

  const products = getProducts({ categorySlug: params.slug, sort: searchParams.sort });

  const sortOptions = [
    { value: '', label: 'Newest' },
    { value: 'price-asc', label: 'Price: Low to High' },
    { value: 'price-desc', label: 'Price: High to Low' },
    { value: 'rating', label: 'Top Rated' },
  ];

  return (
    <>
      <CategoryNav />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink">{category.name}</h1>
            <p className="text-ink-300 text-sm">{products.length} products</p>
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-none">
            {sortOptions.map((opt) => (
              <Link
                key={opt.value}
                href={`/category/${params.slug}${opt.value ? `?sort=${opt.value}` : ''}`}
                className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap border transition-colors ${
                  (searchParams.sort || '') === opt.value
                    ? 'bg-ink text-white border-ink'
                    : 'border-ink-100 text-ink-500 hover:border-marigold-400'
                }`}
              >
                {opt.label}
              </Link>
            ))}
          </div>
        </div>

        {products.length === 0 ? (
          <p className="text-ink-400">No products in this category yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
