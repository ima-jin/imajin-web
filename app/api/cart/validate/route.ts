import { NextRequest } from 'next/server';
import { validateCart } from '@/lib/services/cart-validator';
import type { CartItem } from '@/types/cart';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const items: CartItem[] = body.items || [];

    const validation = await validateCart(items);

    return Response.json(validation);
  } catch (error) {
    console.error('Cart validation error:', error);
    return Response.json(
      { error: 'Failed to validate cart' },
      { status: 500 }
    );
  }
}
