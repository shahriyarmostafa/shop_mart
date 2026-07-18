import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { updateOrderStatus } from '@/lib/db';

const VALID_STATUSES = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as const;

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const { status } = body || {};
  if (typeof status !== 'string' || !VALID_STATUSES.includes(status as any)) {
    return NextResponse.json(
      { error: `Status must be one of: ${VALID_STATUSES.join(', ')}` },
      { status: 400 }
    );
  }

  await updateOrderStatus(params.id, status);

  return NextResponse.json({ success: true });
}
