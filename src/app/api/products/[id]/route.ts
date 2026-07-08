import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getProductById, updateProduct, deleteProduct } from '@/lib/db';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const product = await getProductById(params.id);
    if (!product) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
    return NextResponse.json(product);
  } catch (err) {
    console.error('[GET /api/products/:id] failed:', err);
    return NextResponse.json({ error: 'Failed to load product.' }, { status: 500 });
  }
}

// Only these fields may be updated from the admin form. Whitelisting keeps
// arbitrary/unexpected keys in the request body from ever reaching the
// dynamic UPDATE statement in lib/db.ts.
const EDITABLE_FIELDS = ['name', 'description', 'price', 'compareAtPrice', 'stock', 'images', 'categoryId', 'featured'] as const;

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Not authorized.' }, { status: 403 });
    }

    const existing = await getProductById(params.id);
    if (!existing) {
      return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
    }

    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
    }

    const update: Record<string, any> = {};

    for (const field of EDITABLE_FIELDS) {
      if (!(field in body)) continue;
      const value = body[field];

      switch (field) {
        case 'name':
        case 'description':
          if (typeof value !== 'string' || !value.trim()) {
            return NextResponse.json({ error: `A valid ${field} is required.` }, { status: 400 });
          }
          update[field] = value.trim();
          break;
        case 'images':
          if (typeof value !== 'string' || !value.trim()) {
            return NextResponse.json({ error: 'At least one image is required.' }, { status: 400 });
          }
          update[field] = value.trim();
          break;
        case 'categoryId':
          if (typeof value !== 'string' || !value) {
            return NextResponse.json({ error: 'A category is required.' }, { status: 400 });
          }
          update[field] = value;
          break;
        case 'price': {
          const parsed = parseFloat(value);
          if (value === '' || value === null || value === undefined || Number.isNaN(parsed) || parsed < 0) {
            return NextResponse.json({ error: 'A valid, non-negative price is required.' }, { status: 400 });
          }
          update[field] = parsed;
          break;
        }
        case 'compareAtPrice': {
          if (value === '' || value === null || value === undefined) {
            update[field] = null;
          } else {
            const parsed = parseFloat(value);
            if (Number.isNaN(parsed) || parsed < 0) {
              return NextResponse.json(
                { error: 'Compare-at price must be a valid, non-negative number.' },
                { status: 400 }
              );
            }
            update[field] = parsed;
          }
          break;
        }
        case 'stock': {
          const parsed = parseInt(value, 10);
          if (value === '' || value === null || value === undefined || Number.isNaN(parsed) || parsed < 0) {
            return NextResponse.json({ error: 'A valid, non-negative stock quantity is required.' }, { status: 400 });
          }
          update[field] = parsed;
          break;
        }
        case 'featured':
          update[field] = !!value;
          break;
      }
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update.' }, { status: 400 });
    }

    await updateProduct(params.id, update);
    return NextResponse.json(await getProductById(params.id));
  } catch (err) {
    console.error('[PATCH /api/products/:id] failed:', err);
    return NextResponse.json({ error: 'Failed to update product.' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Not authorized.' }, { status: 403 });
    }

    const existing = await getProductById(params.id);
    if (!existing) {
      return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
    }

    await deleteProduct(params.id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/products/:id] failed:', err);
    return NextResponse.json({ error: 'Failed to delete product.' }, { status: 500 });
  }
}
