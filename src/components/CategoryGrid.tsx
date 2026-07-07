import Link from 'next/link';
import Image from 'next/image';
import { getCategoriesWithCounts } from '@/lib/db';

// 1. Mark the component as 'async'
export default async function CategoryGrid() {
  // 2. 'await' the database call
  const categories = await getCategoriesWithCounts();

  return (
    <section className="max-w-7xl mx-auto px-4 py-10">
      <h2 className="font-display text-2xl font-semibold text-ink mb-5">Shop by Category</h2>
      <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
        {categories.map((cat) => (
          <Link key={cat.id} href={`/category/${cat.slug}`} className="group text-center">
            <div className="relative aspect-square rounded-full overflow-hidden bg-ink-50 border-2 border-transparent group-hover:border-marigold-400 transition-colors">
              {cat.image && <Image src={cat.image} alt={cat.name} fill sizes="120px" className="object-cover" />}
            </div>
            <p className="mt-2 text-xs md:text-sm font-medium text-ink-700 group-hover:text-marigold-600 transition-colors">
              {cat.name}
            </p>
            <p className="text-[11px] text-ink-300">{cat.productCount} items</p>
          </Link>
        ))}
      </div>
    </section>
  );
}