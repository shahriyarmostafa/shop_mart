import { getProductBySlug, getRelatedProducts } from '@/lib/db';
import { notFound } from 'next/navigation';
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
