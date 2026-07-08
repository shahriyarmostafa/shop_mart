'use client';

import Link from 'next/link';
import SafeImage from '@/components/SafeImage';
<<<<<<< HEAD
import { Star, ShoppingCart, SlidersHorizontal } from 'lucide-react';
=======
import { Star, ShoppingCart } from 'lucide-react';
>>>>>>> 0aa5166dbf7e53befa6a172643afb9ad643cf5fd
import { formatPrice, discountPercent } from '@/lib/utils';
import { useCartStore } from '@/lib/cart-store';

type Product = {
  id: string;
  slug: string;
  name: string;
  price: number;
  compareAtPrice?: number | null;
  images: string;
  rating: number;
  reviewCount: number;
  stock: number;
  hasVariants?: boolean;
};

export default function ProductCard({ product }: { product: Product }) {
  const addItem = useCartStore((s) => s.addItem);
  const discount = discountPercent(product.price, product.compareAtPrice);
  const image = product.images.split(',')[0];

  return (
    <div className="group bg-white rounded-xl overflow-hidden shadow-card hover:shadow-lg transition-shadow border border-ink-50">
      <Link href={`/product/${product.slug}`} className="block relative aspect-square overflow-hidden bg-ink-50">
        <SafeImage
          src={image}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {discount && (
          <span className="absolute top-2 left-2 bg-spice text-white text-xs font-bold px-2 py-1 rounded">
            -{discount}%
          </span>
        )}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-ink-900/60 flex items-center justify-center">
            <span className="text-white text-sm font-semibold">Out of Stock</span>
          </div>
        )}
      </Link>

      <div className="p-3">
        <Link href={`/product/${product.slug}`}>
          <h3 className="text-sm text-ink-700 font-medium line-clamp-2 h-10 hover:text-marigold-600 transition-colors">
            {product.name}
          </h3>
        </Link>

        <div className="flex items-center gap-1 mt-1.5 text-xs text-ink-400">
          <Star size={12} className="fill-marigold-400 text-marigold-400" />
          <span>{product.rating.toFixed(1)}</span>
          <span>({product.reviewCount})</span>
        </div>

        <div className="flex items-center justify-between mt-2.5">
          <div className="flex flex-col">
            <span className="price-tag bg-ink text-white font-mono text-sm font-semibold">
              {formatPrice(product.price)}
            </span>
            {product.compareAtPrice && (
              <span className="text-xs text-ink-300 line-through font-mono mt-1 ml-1">
                {formatPrice(product.compareAtPrice)}
              </span>
            )}
          </div>
          {product.hasVariants ? (
            <Link
              href={`/product/${product.slug}`}
              className="p-2 rounded-full bg-marigold-400 hover:bg-marigold-500 text-ink transition-colors"
              aria-label="Select options"
              title="Select options"
            >
              <SlidersHorizontal size={16} />
            </Link>
          ) : (
            <button
              disabled={product.stock === 0}
              onClick={() =>
                addItem(
                  { productId: product.id, name: product.name, price: product.price, image, stock: product.stock },
                  1
                )
              }
              className="p-2 rounded-full bg-marigold-400 hover:bg-marigold-500 disabled:bg-ink-100 disabled:cursor-not-allowed text-ink transition-colors"
              aria-label="Add to cart"
            >
              <ShoppingCart size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
