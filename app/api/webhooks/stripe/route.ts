import { NextRequest } from 'next/server';
import { headers } from 'next/headers';
import { verifyWebhookSignature } from '@/lib/services/stripe-service';
import { createOrder, updateOrderStatus } from '@/lib/services/order-service';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import { ERROR_CODES, HTTP_STATUS } from '@/lib/config/api';
import { logger } from '@/lib/utils/logger';
import { db } from '@/db';
import { orders } from '@/db/schema';
import type Stripe from 'stripe';

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;

if (!WEBHOOK_SECRET) {
  logger.error('STRIPE_WEBHOOK_SECRET environment variable is not set');
}

/**
 * POST /api/webhooks/stripe
 *
 * Handles Stripe webhook events.
 * Called by Stripe when payment events occur.
 *
 * Events handled:
 * - checkout.session.completed: Creates order in database
 * - payment_intent.payment_failed: Logs payment failure
 *
 * Security:
 * - Verifies webhook signature to ensure request is from Stripe
 * - Rejects requests without valid signature
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      return errorResponse(
        ERROR_CODES.BAD_REQUEST,
        'Missing Stripe signature',
        HTTP_STATUS.BAD_REQUEST
      );
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = verifyWebhookSignature(body, signature, WEBHOOK_SECRET);
    } catch (err) {
      logger.error('Webhook signature verification failed', err as Error);
      return errorResponse(
        ERROR_CODES.BAD_REQUEST,
        'Invalid webhook signature',
        HTTP_STATUS.BAD_REQUEST
      );
    }

    // Handle event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'payment_intent.payment_failed':
        // Log failure but don't create order
        logger.error('Payment failed', undefined, {
          paymentIntentId: (event.data.object as Stripe.PaymentIntent).id,
          error: (event.data.object as Stripe.PaymentIntent).last_payment_error,
        });
        break;

      // Add more event handlers as needed
      default:
        logger.info('Unhandled webhook event type', { eventType: event.type });
    }

    return successResponse({ received: true }, HTTP_STATUS.OK);
  } catch (error) {
    logger.error('Webhook processing error', error as Error);
    return errorResponse(
      ERROR_CODES.INTERNAL_ERROR,
      'Webhook processing failed',
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
}

/**
 * Handles completed checkout session
 *
 * Creates order in database with all items and shipping info.
 * Handles three order types:
 * 1. Regular order: Normal product purchase
 * 2. Pre-sale deposit: Stores deposit with target_product_id metadata
 * 3. Pre-order with deposit: Links to deposit order and marks it as applied
 *
 * Decrements limited edition quantities atomically (regular and pre-order only).
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  try {
    const orderType = session.metadata?.order_type;

    // Handle pre-sale deposit orders
    if (orderType === 'pre-sale-deposit') {
      await handleDepositOrder(session);
      return;
    }

    // Handle regular or pre-order with deposit
    const cartItemsJson = session.metadata?.cartItems;
    if (!cartItemsJson) {
      throw new Error('No cart items in session metadata');
    }

    const cartItems = JSON.parse(cartItemsJson);

    // Extract shipping address
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const shipping = (session as any).shipping_details;
    const shippingAddress = shipping
      ? {
          name: shipping.name || undefined,
          line1: shipping.address?.line1 || undefined,
          line2: shipping.address?.line2 || undefined,
          city: shipping.address?.city || undefined,
          state: shipping.address?.state || undefined,
          postalCode: shipping.address?.postal_code || undefined,
          country: shipping.address?.country || undefined,
        }
      : undefined;

    // Create order in database
    await createOrder({
      sessionId: session.id,
      paymentIntentId: session.payment_intent as string,
      customerEmail: session.customer_email || session.customer_details?.email || '',
      customerName: session.customer_details?.name || undefined,
      subtotal: session.amount_subtotal || 0,
      tax: session.total_details?.amount_tax || 0,
      shipping: session.total_details?.amount_shipping || 0,
      total: session.amount_total || 0,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      items: cartItems.map((item: any) => ({
        productId: item.productId,
        variantId: item.variantId,
        stripePriceId: item.stripePriceId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        productName: item.productName,
        variantName: item.variantName,
      })),
      shippingAddress,
    });

    logger.info('Order created successfully from webhook', { sessionId: session.id });

    // If this is a pre-order with deposit, mark the deposit as applied
    if (orderType === 'pre-order-with-deposit') {
      const depositOrderId = session.metadata?.deposit_order_id;
      if (depositOrderId) {
        await markDepositAsApplied(depositOrderId);
        logger.info('Deposit marked as applied', { depositOrderId, orderId: session.id });
      }
    }
  } catch (error) {
    logger.error('Failed to create order from webhook', error as Error, { sessionId: session.id });
    throw error;
  }
}

/**
 * Handles pre-sale deposit orders
 *
 * Creates an order record for the deposit with:
 * - Status: 'paid'
 * - Metadata: target_product_id (and optionally target_variant_id)
 * - No shipping info (deposit only, not physical product yet)
 */
async function handleDepositOrder(session: Stripe.Checkout.Session) {
  try {
    const targetProductId = session.metadata?.target_product_id;
    const targetVariantId = session.metadata?.target_variant_id;

    if (!targetProductId) {
      throw new Error('Missing target_product_id in deposit session metadata');
    }

    // Create order record for deposit
    await db.insert(orders).values({
      id: session.id,
      stripePaymentIntentId: session.payment_intent as string,
      customerEmail: session.customer_email || session.customer_details?.email || '',
      customerName: session.customer_details?.name || undefined,
      status: 'paid',
      subtotal: session.amount_subtotal || 0,
      tax: session.total_details?.amount_tax || 0,
      shipping: 0, // No shipping for deposit
      total: session.amount_total || 0,
      currency: 'usd',
      metadata: {
        order_type: 'pre-sale-deposit',
        target_product_id: targetProductId,
        ...(targetVariantId && { target_variant_id: targetVariantId }),
      },
    });

    logger.info('Deposit order created successfully', {
      sessionId: session.id,
      targetProductId,
      targetVariantId,
    });
  } catch (error) {
    logger.error('Failed to create deposit order', error as Error, { sessionId: session.id });
    throw error;
  }
}

/**
 * Marks a deposit order as applied
 *
 * Updates the deposit order status to 'applied' and sets appliedAt timestamp.
 * This prevents the deposit from being refunded or used again.
 */
async function markDepositAsApplied(depositOrderId: string) {
  try {
    await updateOrderStatus(depositOrderId, 'applied');
    logger.info('Deposit order marked as applied', { depositOrderId });
  } catch (error) {
    logger.error('Failed to mark deposit as applied', error as Error, { depositOrderId });
    throw error;
  }
}
