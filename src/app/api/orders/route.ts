import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getOrdersForUser, getAllOrders } from '@/lib/db';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const all = searchParams.get('all');
  const isAdmin = (session.user as any).role === 'ADMIN';

  const orders = all === 'true' && isAdmin ? getAllOrders() : getOrdersForUser((session.user as any).id);

  return NextResponse.json(orders);
}
