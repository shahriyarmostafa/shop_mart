import { NextResponse } from 'next/server';
import { getProducts, createProduct, getCategories } from '@/lib/db';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category') || undefined;
  const search = searchParams.get('q') || undefined;
  const featured = searchParams.get('featured') === 'true';
  const sort = searchParams.get('sort') || undefined;

  const products = await getProducts({ categorySlug: category, search, featured, sort });

  // Attach category info for consumers like the admin dashboard table.
  const categories = await getCategories();
  const categoryById = new Map(categories.map((c) => [c.id, c]));
  const withCategory = products.map((p) => ({
    ...p,
    category: categoryById.get(p.categoryId) || { name: 'Uncategorized', slug: '' },
  }));

  return NextResponse.json(withCategory);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, description, price, compareAtPrice, stock, images, categoryId, featured } = body;

    if (!name || !description || !price || !categoryId || !images) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    const product = await createProduct({
      name,
      description,
      price: parseFloat(price),
      compareAtPrice: compareAtPrice ? parseFloat(compareAtPrice) : null,
      stock: parseInt(stock, 10) || 0,
      images,
      categoryId,
      featured: !!featured,
    });

    return NextResponse.json(product, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to create product.' }, { status: 500 });
  }
}
