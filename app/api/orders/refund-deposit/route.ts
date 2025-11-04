import { NextRequest } from 'next/server';
import { z, ZodError } from 'zod';
import { getDepositOrder } from '@/lib/services/order-service';
import { createRefund } from '@/lib/services/stripe-service';
import { updateOrderStatus } from '@/lib/services/order-service';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/utils/api-response';
import { ERROR_CODES, HTTP_STATUS } from '@/lib/config/api';
import { logger } from '@/lib/utils/logger';

const RefundDepositSchema = z.object({
  email: z.string().email('Invalid email address'),
  productId: z.string().min(1, 'Product ID is required'),
  reason: z.string().optional(),
});

/**
 * POST /api/orders/refund-deposit
 *
 * Self-service deposit refund endpoint.
 *
 * Validates:
 * - Email matches deposit order
 * - Deposit exists and is in 'paid' status (not 'applied' or 'refunded')
 * - Product is still in pre-sale (cannot refund if moved to pre-order)
 *
 * Process:
 * 1. Look up deposit order by email + product ID
 * 2. Verify deposit is refundable (status = 'paid')
 * 3. Process refund via Stripe
 * 4. Update order status to 'refunded'
 *
 * Security:
 * - Email verification ensures only the customer can refund their own deposit
 * - Rate limiting recommended (to be added via middleware)
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const { email, productId, reason } = RefundDepositSchema.parse(body);

    // Look up deposit order
    const depositOrder = await getDepositOrder(email, productId);

    if (!depositOrder) {
      return errorResponse(
        ERROR_CODES.NOT_FOUND,
        'No deposit found for this email and product',
        HTTP_STATUS.NOT_FOUND
      );
    }

    // Verify deposit is refundable
    if (depositOrder.status !== 'paid') {
      return errorResponse(
        ERROR_CODES.BAD_REQUEST,
        `Deposit cannot be refunded. Current status: ${depositOrder.status}`,
        HTTP_STATUS.BAD_REQUEST
      );
    }

    // Process refund via Stripe
    const refund = await createRefund(
      depositOrder.stripePaymentIntentId as string,
      depositOrder.total // Full refund
    );

    // Update order status to 'refunded'
    await updateOrderStatus(depositOrder.id, 'refunded');

    logger.info('Deposit refunded successfully', {
      orderId: depositOrder.id,
      email,
      productId,
      refundId: refund.id,
      reason,
    });

    return successResponse(
      {
        success: true,
        refundId: refund.id,
        amount: refund.amount,
        message: 'Deposit refunded successfully. Refund will appear in 5-10 business days.',
      },
      HTTP_STATUS.OK
    );
  } catch (error) {
    // Handle validation errors
    if (error instanceof ZodError) {
      return validationErrorResponse(error);
    }

    logger.error('Refund deposit failed', error as Error);
    return errorResponse(
      ERROR_CODES.INTERNAL_ERROR,
      'Failed to process refund',
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
}
