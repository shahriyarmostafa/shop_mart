import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getProductById, updateProduct, deleteProduct, replaceVariantsForProduct, type VariantInput } from '@/lib/db';

/**
 * Validates the raw `variants` array from a request body. Returns either a
 * clean, typed array ready for the db layer, or an error string to send
 * back to the client. `undefined` (key absent) means "leave variants
 * untouched"; an explicit `[]` means "remove all variants".
 */
function parseVariants(raw: unknown): { variants?: VariantInput[]; error?: string; provided: boolean } {
  if (raw === undefined) return { provided: false };
  if (!Array.isArray(raw)) return { error: 'Variants must be a list.', provided: true };

  const variants: VariantInput[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') return { error: 'Each variant must be an object.', provided: true };
    const { attributeName, value, priceModifier, stock, image } = entry as any;

    if (typeof attributeName !== 'string' || !attributeName.trim()) {
      return { error: 'Each variant needs an attribute name (e.g. "Color").', provided: true };
    }
    if (typeof value !== 'string' || !value.trim()) {
      return { error: `Each "${attributeName}" variant needs a value (e.g. "Red").`, provided: true };
    }

    let parsedModifier = 0;
    if (priceModifier !== undefined && priceModifier !== null && priceModifier !== '') {
      parsedModifier = parseFloat(priceModifier);
      if (Number.isNaN(parsedModifier)) {
        return { error: `The price modifier for "${value}" must be a number.`, provided: true };
      }
    }

    let parsedStock = 0;
    if (stock !== undefined && stock !== null && stock !== '') {
      parsedStock = parseInt(stock, 10);
      if (Number.isNaN(parsedStock) || parsedStock < 0) {
        return { error: `Stock for "${value}" must be a valid, non-negative number.`, provided: true };
      }
    }

    if (image !== undefined && image !== null && typeof image !== 'string') {
      return { error: `The image for "${value}" must be a URL or file path.`, provided: true };
    }

    variants.push({
      attributeName: attributeName.trim(),
      value: value.trim(),
      priceModifier: parsedModifier,
      stock: parsedStock,
      image: image && typeof image === 'string' && image.trim() ? image.trim() : null,
    });
  }

  return { variants, provided: true };
}

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

    const { variants: parsedVariants, error: variantsError, provided: variantsProvided } = parseVariants(body.variants);
    if (variantsError) {
      return NextResponse.json({ error: variantsError }, { status: 400 });
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
          // If variants were also submitted, their combined stock is the
          // real source of truth and will overwrite this right after -
          // still validate the submitted value so a malformed request
          // fails loudly instead of silently.
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

    if (Object.keys(update).length === 0 && !variantsProvided) {
      return NextResponse.json({ error: 'No valid fields to update.' }, { status: 400 });
    }

    if (Object.keys(update).length > 0) {
      await updateProduct(params.id, update);
    }

    // Runs after the scalar field update above so its stock aggregate wins
    // whenever variants are present (see replaceVariantsForProduct).
    if (variantsProvided) {
      await replaceVariantsForProduct(params.id, parsedVariants!);
    }

    return NextResponse.json(await getProductById(params.id));
  } catch (err) {
    console.error('[PATCH /api/products/:id] failed:', err);
    return NextResponse.json({ error: 'Failed to update product.' }, { status: 500 });
  }
}

// Alias PATCH as PUT too - the semantics here are a full-form save from the
// admin UI either way, and some API consumers/conventions expect PUT for
// "replace this resource's editable fields".
export { PATCH as PUT };

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
