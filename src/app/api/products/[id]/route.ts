import { NextResponse } from 'next/server';
import { getProductById, updateProduct, deleteProduct } from '@/lib/db';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const product = getProductById(params.id);
  if (!product) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  return NextResponse.json(product);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    updateProduct(params.id, body);
    return NextResponse.json(getProductById(params.id));
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update product.' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    deleteProduct(params.id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to delete product.' }, { status: 500 });
  }
}
