import { NextRequest } from 'next/server';
import { z } from 'zod';
import { validateCart } from '@/lib/services/cart-validator';
import {
  successResponse,
  handleUnknownError,
  badRequestResponse,
} from '@/lib/utils/api-response';
import { HTTP_STATUS } from '@/lib/config/api';

// Request body schema
const CartValidationRequestSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string(),
      name: z.string(),
      price: z.number(),
      quantity: z.number().int().positive(),
      image: z.string().optional(),
      variantId: z.string().optional(),
      voltage: z.union([z.literal('5v'), z.literal('24v')]).optional(),
    })
  ),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validation = CartValidationRequestSchema.safeParse(body);
    if (!validation.success) {
      return badRequestResponse('Invalid cart data format');
    }

    const { items } = validation.data;

    if (items.length === 0) {
      return badRequestResponse('Cart is empty');
    }

    // Validate cart
    // @ts-expect-error - Schema validation ensures correct shape
    const validationResult = await validateCart(items);

    return successResponse(validationResult, HTTP_STATUS.OK);
  } catch (error) {
    return handleUnknownError(error, 'Cart validation failed');
  }
}
