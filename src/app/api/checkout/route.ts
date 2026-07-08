import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createOrder } from '@/lib/db';
import nodemailer from 'nodemailer';

// 1. Setup our mail transporter using your .env credentials
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
});

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

    // 2. The order successfully saves to your SQLite/Turso database
    const order = await createOrder({
      userId: (session.user as any).id,
      items,
      shippingName,
      shippingPhone,
      shippingAddress,
      paymentMethod: paymentMethod || 'COD',
    });

    // 3. Send the automated email confirmation out in the background
    try {
      const userEmail = session.user.email;
      
      if (userEmail) {
        await transporter.sendMail({
          from: `"Shopmart" <${process.env.EMAIL_FROM}>`,
          to: userEmail,
          subject: `Order Confirmed! 🎉 (Order #${(order as any).id || 'Success'})`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px;">
              <h2 style="color: #10b981;">Thank you for your order, ${shippingName}!</h2>
              <p>We've successfully received your order and our team is getting it ready for delivery.</p>
              <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
              <h3>Delivery Details:</h3>
              <p><strong>Phone:</strong> ${shippingPhone}</p>
              <p><strong>Address:</strong> ${shippingAddress}</p>
              <p><strong>Payment Method:</strong> ${paymentMethod || 'COD'}</p>
              <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
              <p style="font-size: 0.875rem; color: #64748b;">If you have any questions, please reply directly to this email.</p>
            </div>
          `,
        });
      }
    } catch (emailErr) {
      // We catch email errors here so that even if Google blocks a temporary login,
      // the customer's purchase screen doesn't crash!
      console.error('Email failed to send:', emailErr);
    }

    return NextResponse.json(order, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Checkout failed.' }, { status: 400 });
  }
}