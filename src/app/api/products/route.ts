import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getProducts, createProduct, getCategories } from '@/lib/db';

export async function GET(req: Request) {
  try {
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
  } catch (err) {
    console.error('[GET /api/products] failed:', err);
    return NextResponse.json({ error: 'Failed to load products.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Not authorized.' }, { status: 403 });
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
    }

    const { name, description, price, compareAtPrice, stock, images, categoryId, featured } = body || {};

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Product name is required.' }, { status: 400 });
    }
    if (!description || typeof description !== 'string' || !description.trim()) {
      return NextResponse.json({ error: 'Description is required.' }, { status: 400 });
    }
    if (!categoryId || typeof categoryId !== 'string') {
      return NextResponse.json({ error: 'A category is required.' }, { status: 400 });
    }
    if (!images || typeof images !== 'string' || !images.trim()) {
      return NextResponse.json({ error: 'At least one image is required.' }, { status: 400 });
    }

    const parsedPrice = parseFloat(price);
    if (price === undefined || price === null || price === '' || Number.isNaN(parsedPrice) || parsedPrice < 0) {
      return NextResponse.json({ error: 'A valid, non-negative price is required.' }, { status: 400 });
    }

    let parsedCompareAt: number | null = null;
    if (compareAtPrice !== undefined && compareAtPrice !== null && compareAtPrice !== '') {
      parsedCompareAt = parseFloat(compareAtPrice);
      if (Number.isNaN(parsedCompareAt) || parsedCompareAt < 0) {
        return NextResponse.json({ error: 'Compare-at price must be a valid, non-negative number.' }, { status: 400 });
      }
    }

    // Distinguish "missing" from "explicitly 0" so stock can't silently
    // fall back to a wrong default when the admin genuinely enters 0.
    const parsedStock = parseInt(stock, 10);
    if (stock === undefined || stock === null || stock === '' || Number.isNaN(parsedStock) || parsedStock < 0) {
      return NextResponse.json({ error: 'A valid, non-negative stock quantity is required.' }, { status: 400 });
    }

    const product = await createProduct({
      name: name.trim(),
      description: description.trim(),
      price: parsedPrice,
      compareAtPrice: parsedCompareAt,
      stock: parsedStock,
      images: images.trim(),
      categoryId,
      featured: !!featured,
    });

    return NextResponse.json(product, { status: 201 });
  } catch (err) {
    console.error('[POST /api/products] failed:', err);
    return NextResponse.json({ error: 'Failed to create product.' }, { status: 500 });
  }
}
