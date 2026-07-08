import { getProductBySlug, getRelatedProducts } from '@/lib/db';
import { notFound } from 'next/navigation';
<<<<<<< HEAD
=======
import SafeImage from '@/components/SafeImage';
>>>>>>> 0aa5166dbf7e53befa6a172643afb9ad643cf5fd
import Link from 'next/link';
import CategoryNav from '@/components/CategoryNav';
import ProductDetail from '@/components/ProductDetail';
import ProductCard from '@/components/ProductCard';

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await getProductBySlug(params.slug);
  if (!product) notFound();

  const related = await getRelatedProducts(product.categoryId, product.id, 5);
  const images = product.images.split(',');

  return (
    <>
      <CategoryNav />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-xs text-ink-300 mb-4 flex gap-1.5">
          <Link href="/">Home</Link> /
          <Link href={`/category/${product.category.slug}`}>{product.category.name}</Link> /
          <span className="text-ink-500">{product.name}</span>
        </div>

<<<<<<< HEAD
        <ProductDetail
          id={product.id}
          name={product.name}
          description={product.description}
          images={images}
          variants={product.variants}
          price={product.price}
          compareAtPrice={product.compareAtPrice}
          stock={product.stock}
          rating={product.rating}
          reviewCount={product.reviewCount}
        />
=======
        <div className="grid md:grid-cols-2 gap-10">
          <div className="grid grid-cols-2 gap-3">
            {images.map((img, i) => (
              <div key={i} className={`relative aspect-square rounded-xl overflow-hidden bg-ink-50 ${i === 0 ? 'col-span-2' : ''}`}>
                <SafeImage src={img} alt={`${product.name} ${i + 1}`} fill sizes="500px" className="object-cover" />
              </div>
            ))}
          </div>

          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">{product.name}</h1>

            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-1 text-sm text-ink-500">
                <Star size={14} className="fill-marigold-400 text-marigold-400" />
                {product.rating.toFixed(1)}
              </div>
              <span className="text-ink-300 text-sm">({product.reviewCount} reviews)</span>
              <span className="text-ink-300">•</span>
              <span className="text-sm text-leaf font-medium">{product.stock} in stock</span>
            </div>

            <div className="flex items-center gap-3 mt-5">
              <span className="price-tag bg-ink text-white font-mono text-xl font-semibold">
                {formatPrice(product.price)}
              </span>
              {product.compareAtPrice && (
                <>
                  <span className="text-ink-300 line-through font-mono">{formatPrice(product.compareAtPrice)}</span>
                  <span className="bg-spice/10 text-spice text-xs font-bold px-2 py-1 rounded">-{discount}%</span>
                </>
              )}
            </div>

            <p className="text-ink-500 mt-5 leading-relaxed">{product.description}</p>

            <AddToCartPanel
              productId={product.id}
              name={product.name}
              price={product.price}
              image={images[0]}
              stock={product.stock}
            />

            <div className="mt-6 border-t border-ink-50 pt-5 text-sm text-ink-400 space-y-1.5">
              <p>✓ Cash on Delivery available</p>
              <p>✓ 7-day easy return policy</p>
              <p>✓ Genuine product guarantee</p>
            </div>
          </div>
        </div>
>>>>>>> 0aa5166dbf7e53befa6a172643afb9ad643cf5fd

        {related.length > 0 && (
          <section className="mt-14">
            <h2 className="font-display text-2xl font-semibold text-ink mb-5">You may also like</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  );
}
