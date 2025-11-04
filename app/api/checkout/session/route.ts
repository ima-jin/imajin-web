import { NextRequest } from 'next/server';
import { createCheckoutSession } from '@/lib/services/stripe-service';
import { CheckoutSessionRequestSchema } from '@/lib/validation/checkout-schemas';
import {
  successResponse,
  errorResponse,
  handleUnknownError,
} from '@/lib/utils/api-response';
import { ERROR_CODES, HTTP_STATUS } from '@/lib/config/api';

/**
 * POST /api/checkout/session
 *
 * Creates a Stripe Checkout Session for payment processing.
 *
 * Request body:
 * - items: Array of cart items with Stripe product IDs
 * - customerEmail: Customer email address
 * - shippingAddress: Optional shipping address
 * - metadata: Optional metadata to store with session
 *
 * Returns:
 * - sessionId: Stripe Checkout Session ID
 * - url: Redirect URL for Stripe Checkout
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validation = CheckoutSessionRequestSchema.safeParse(body);
    if (!validation.success) {
      return errorResponse(
        ERROR_CODES.VALIDATION_ERROR,
        'Invalid checkout data',
        HTTP_STATUS.BAD_REQUEST,
        { issues: validation.error.issues }
      );
    }

    const { items, customerEmail, metadata } = validation.data;

    // Map items to Stripe format
    const stripeItems = items.map((item) => ({
      stripePriceId: item.stripePriceId,
      quantity: item.quantity,
    }));

    // Store cart data in metadata for webhook processing
    const sessionMetadata = {
      ...metadata,
      cartItems: JSON.stringify(
        items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          stripePriceId: item.stripePriceId,
          quantity: item.quantity,
          unitPrice: item.price,
          productName: item.productName,
          variantName: item.variantValue,
        }))
      ),
    };

    // Create Stripe checkout session
    const session = await createCheckoutSession({
      items: stripeItems,
      customerEmail,
      metadata: sessionMetadata,
    });

    return successResponse(
      {
        sessionId: session.id,
        url: session.url,
      },
      HTTP_STATUS.OK
    );
  } catch (error) {
    return handleUnknownError(error, 'Failed to create checkout session');
  }
}
