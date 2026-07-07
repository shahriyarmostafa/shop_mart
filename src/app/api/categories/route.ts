import { NextResponse } from 'next/server';
import { getCategoriesWithCounts, createCategory } from '@/lib/db';

export async function GET() {
  const categories = await getCategoriesWithCounts();
  return NextResponse.json(categories);
}

export async function POST(req: Request) {
  try {
    const { name, icon } = await req.json();
    if (!name) return NextResponse.json({ error: 'Name is required.' }, { status: 400 });

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const category = await createCategory({ name, slug, icon, image: `https://picsum.photos/seed/${slug}/600/600` });
    return NextResponse.json(category, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to create category.' }, { status: 500 });
  }
}
