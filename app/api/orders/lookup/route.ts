import { NextRequest } from 'next/server';
import { lookupOrder } from '@/lib/services/order-service';
import { OrderLookupSchema } from '@/lib/validation/checkout-schemas';
import {
  successResponse,
  errorResponse,
  handleUnknownError,
} from '@/lib/utils/api-response';
import { ERROR_CODES, HTTP_STATUS } from '@/lib/config/api';

/**
 * POST /api/orders/lookup
 *
 * Customer self-service order tracking.
 * Looks up order by email and order ID.
 *
 * Security:
 * - Requires both email and order ID to match
 * - Returns 404 if either doesn't match (don't reveal which)
 *
 * Request body:
 * - email: Customer email address
 * - orderId: Order ID (Stripe Checkout Session ID)
 *
 * Returns:
 * - Order with items and shipping info
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request
    const validation = OrderLookupSchema.safeParse(body);
    if (!validation.success) {
      return errorResponse(
        ERROR_CODES.VALIDATION_ERROR,
        'Invalid lookup data',
        HTTP_STATUS.BAD_REQUEST,
        { issues: validation.error.issues }
      );
    }

    const { email, orderId } = validation.data;

    // Lookup order (returns null if email doesn't match)
    const order = await lookupOrder(email, orderId);

    if (!order) {
      return errorResponse(
        ERROR_CODES.NOT_FOUND,
        'Order not found',
        HTTP_STATUS.NOT_FOUND
      );
    }

    return successResponse(order, HTTP_STATUS.OK);
  } catch (error) {
    return handleUnknownError(error, 'Order lookup failed');
  }
}
