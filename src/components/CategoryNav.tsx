import Link from 'next/link';
import { getCategories } from '@/lib/db';
import * as Icons from 'lucide-react';

// 1. Mark the component as 'async'
export default async function CategoryNav() {
  // 2. 'await' the database call
  const categories = await getCategories();

  return (
    <nav className="bg-white border-b border-ink-100">
      <div className="max-w-7xl mx-auto px-4 flex gap-6 overflow-x-auto scrollbar-none py-2.5">
        {categories.map((cat) => {
          const Icon = (Icons as any)[cat.icon] || Icons.Package;
          return (
            <Link
              key={cat.id}
              href={`/category/${cat.slug}`}
              className="flex items-center gap-1.5 text-sm font-medium text-ink-700 hover:text-marigold-500 whitespace-nowrap transition-colors"
            >
              <Icon size={16} />
              {cat.name}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}