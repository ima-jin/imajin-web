import { NextRequest } from 'next/server';
import { createDepositCheckoutSession } from '@/lib/services/stripe-service';
import { getProductById, getVariantById } from '@/lib/services/product-service';
import { DepositCheckoutSchema } from '@/lib/validation/deposit-schemas';
import {
  successResponse,
  errorResponse,
  handleUnknownError,
} from '@/lib/utils/api-response';
import { ERROR_CODES, HTTP_STATUS } from '@/lib/config/api';
import { getDepositAmount } from '@/lib/utils/product-display';

/**
 * POST /api/checkout/deposit
 *
 * Creates a Stripe Checkout Session for pre-sale deposit payment.
 *
 * Request body:
 * - productId: Product ID for the deposit
 * - variantId: Optional variant ID
 * - email: Customer email address
 *
 * Returns:
 * - url: Redirect URL for Stripe Checkout
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validation = DepositCheckoutSchema.safeParse(body);
    if (!validation.success) {
      return errorResponse(
        ERROR_CODES.VALIDATION_ERROR,
        'Invalid deposit checkout data',
        HTTP_STATUS.BAD_REQUEST,
        { issues: validation.error.issues }
      );
    }

    const { productId, variantId, email, quantity } = validation.data;

    // Fetch product to get deposit amount
    const product = await getProductById(productId);
    if (!product) {
      return errorResponse(
        ERROR_CODES.NOT_FOUND,
        'Product not found',
        HTTP_STATUS.NOT_FOUND
      );
    }

    // Fetch variant if provided
    let variant = undefined;
    if (variantId) {
      variant = await getVariantById(variantId);
      if (!variant) {
        return errorResponse(
          ERROR_CODES.NOT_FOUND,
          'Variant not found',
          HTTP_STATUS.NOT_FOUND
        );
      }
    }

    // Get deposit amount per unit (handles variants and edge cases)
    const depositAmountPerUnit = getDepositAmount(product, variant);

    if (!depositAmountPerUnit) {
      return errorResponse(
        ERROR_CODES.VALIDATION_ERROR,
        'Product does not have a deposit price configured',
        HTTP_STATUS.BAD_REQUEST
      );
    }

    // Calculate total deposit amount
    const totalDepositAmount = depositAmountPerUnit * quantity;

    // Create Stripe checkout session for deposit
    const session = await createDepositCheckoutSession({
      productId,
      variantId,
      depositAmount: totalDepositAmount,
      customerEmail: email,
    });

    return successResponse(
      {
        url: session.url,
      },
      HTTP_STATUS.OK
    );
  } catch (error) {
    return handleUnknownError(error, 'Failed to create deposit checkout session');
  }
}
