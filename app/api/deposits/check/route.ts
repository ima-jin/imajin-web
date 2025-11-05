import { NextRequest } from 'next/server';
import { userHasPaidDeposit, getDepositOrder } from '@/lib/services/order-service';
import { DepositCheckSchema } from '@/lib/validation/deposit-schemas';
import {
  successResponse,
  errorResponse,
  handleUnknownError,
} from '@/lib/utils/api-response';
import { ERROR_CODES, HTTP_STATUS } from '@/lib/config/api';

/**
 * POST /api/deposits/check
 *
 * Checks if a customer has paid a deposit for a specific product.
 * This endpoint is used to determine if wholesale pricing should be displayed.
 *
 * Request body:
 * - email: Customer email address
 * - productId: Product ID to check deposit for
 *
 * Returns:
 * - hasDeposit: Boolean indicating if user has paid deposit
 * - depositAmount: Amount of deposit in cents (null if no deposit)
 * - orderId: Order ID of deposit payment (null if no deposit)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validation = DepositCheckSchema.safeParse(body);
    if (!validation.success) {
      return errorResponse(
        ERROR_CODES.VALIDATION_ERROR,
        'Invalid deposit check request',
        HTTP_STATUS.BAD_REQUEST,
        { issues: validation.error.issues }
      );
    }

    const { email, productId } = validation.data;

    // Check if user has paid deposit
    const hasDeposit = await userHasPaidDeposit(email, productId);

    // Get deposit details if exists
    const depositOrder = hasDeposit ? await getDepositOrder(email, productId) : null;

    return successResponse(
      {
        hasDeposit,
        depositAmount: depositOrder?.total || null,
        orderId: depositOrder?.id || null,
      },
      HTTP_STATUS.OK
    );
  } catch (error) {
    return handleUnknownError(error, 'Failed to check deposit status');
  }
}
