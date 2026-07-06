import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createOrder } from '@/lib/db';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Please log in to place an order.' }, { status: 401 });
  }

  try {
    const { items, shippingName, shippingPhone, shippingAddress, paymentMethod } = await req.json();

    if (!items?.length) {
      return NextResponse.json({ error: 'Your cart is empty.' }, { status: 400 });
    }
    if (!shippingName || !shippingPhone || !shippingAddress) {
      return NextResponse.json({ error: 'Shipping details are required.' }, { status: 400 });
    }

    const order = createOrder({
      userId: (session.user as any).id,
      items,
      shippingName,
      shippingPhone,
      shippingAddress,
      paymentMethod: paymentMethod || 'COD',
    });

    return NextResponse.json(order, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Checkout failed.' }, { status: 400 });
  }
}
