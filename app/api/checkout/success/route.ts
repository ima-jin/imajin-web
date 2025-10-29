import { NextRequest } from 'next/server';
import { redirect } from 'next/navigation';
import { getCheckoutSession } from '@/lib/services/stripe-service';
import { logger } from '@/lib/utils/logger';

/**
 * GET /api/checkout/success?session_id={CHECKOUT_SESSION_ID}
 *
 * Handles redirect after successful Stripe Checkout.
 * Validates the session and redirects to order confirmation page.
 *
 * Query params:
 * - session_id: Stripe Checkout Session ID
 *
 * Redirects to:
 * - /checkout/success?order_id={session_id} if payment successful
 * - /checkout?error={error_code} if validation fails
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return redirect('/checkout?error=missing_session');
    }

    // Retrieve session to verify it's valid
    const session = await getCheckoutSession(sessionId);

    if (session.payment_status !== 'paid') {
      return redirect('/checkout?error=payment_incomplete');
    }

    // Redirect to order confirmation page
    return redirect(`/checkout/success?order_id=${session.id}`);
  } catch (error) {
    logger.error('Checkout success validation failed', error as Error);
    return redirect('/checkout?error=unknown');
  }
}
