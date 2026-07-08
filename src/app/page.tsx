import { getProducts } from '@/lib/db';
import CategoryNav from '@/components/CategoryNav';
import HeroBanner from '@/components/HeroBanner';
import CategoryGrid from '@/components/CategoryGrid';
import ProductCard from '@/components/ProductCard';

export default async function HomePage({ searchParams }: { searchParams: { q?: string } }) {
  const query = searchParams.q;

  if (query) {
    const results = await getProducts({ search: query });

    return (
      <>
        <CategoryNav />
        <main className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="font-display text-2xl font-semibold text-ink mb-1">
            Search results for &ldquo;{query}&rdquo;
          </h1>
          <p className="text-ink-300 text-sm mb-6">{results.length} products found</p>
          {results.length === 0 ? (
            <p className="text-ink-400">No products matched your search. Try a different keyword.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {results.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </main>
      </>
    );
  }

  const featured = await getProducts({ featured: true, limit: 10 });
  const latest = await getProducts({ limit: 10 });

  return (
    <>
      <CategoryNav />
      <HeroBanner />
      <CategoryGrid />

      <section id="featured" className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-2xl font-semibold text-ink">Today&apos;s Deals</h2>
          <span className="price-tag bg-spice text-white text-xs font-mono font-semibold">Limited Time</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-6">
        <h2 className="font-display text-2xl font-semibold text-ink mb-5">Just Added</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {latest.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </>
  );
}