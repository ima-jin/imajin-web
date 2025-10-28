import Stripe from 'stripe';

// Initialize Stripe - will be configured with actual keys from environment
export function getStripeInstance(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY environment variable is not set');
  }

  return new Stripe(secretKey, {
    apiVersion: '2025-09-30.clover',
  });
}

export interface CreateCheckoutSessionParams {
  items: Array<{
    stripeProductId: string; // Stripe Price ID
    quantity: number;
  }>;
  customerEmail: string;
  metadata?: Record<string, string>;
  successUrl?: string;
  cancelUrl?: string;
}

/**
 * Creates a Stripe Checkout Session
 *
 * @param params - Checkout session parameters
 * @returns Stripe Checkout Session
 */
export async function createCheckoutSession(
  params: CreateCheckoutSessionParams
): Promise<Stripe.Checkout.Session> {
  const stripe = getStripeInstance();

  const {
    items,
    customerEmail,
    metadata = {},
    successUrl,
    cancelUrl,
  } = params;

  // Build line items for Stripe
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map(
    (item) => ({
      price: item.stripeProductId,
      quantity: item.quantity,
    })
  );

  // Create session
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: lineItems,
    customer_email: customerEmail,
    success_url: successUrl || `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/checkout`,
    metadata,
    expires_at: Math.floor(Date.now() / 1000) + 3600 * 24, // 24 hours
    shipping_address_collection: {
      allowed_countries: ['US', 'CA'],
    },
    billing_address_collection: 'required',
  });

  return session;
}

/**
 * Retrieves a checkout session
 *
 * @param sessionId - Stripe Checkout Session ID
 * @returns Stripe Checkout Session with expanded line items and payment intent
 */
export async function getCheckoutSession(
  sessionId: string
): Promise<Stripe.Checkout.Session> {
  const stripe = getStripeInstance();

  return stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['line_items', 'payment_intent'],
  });
}

/**
 * Verifies Stripe webhook signature
 *
 * @param payload - Raw request body
 * @param signature - Stripe signature header
 * @param secret - Webhook secret
 * @returns Verified Stripe event
 * @throws Error if signature verification fails
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string,
  secret: string
): Stripe.Event {
  const stripe = getStripeInstance();

  return stripe.webhooks.constructEvent(payload, signature, secret);
}

/**
 * Processes a refund
 *
 * @param paymentIntentId - Stripe Payment Intent ID
 * @param amount - Optional amount to refund (in cents). If not provided, full refund.
 * @returns Stripe Refund
 */
export async function createRefund(
  paymentIntentId: string,
  amount?: number
): Promise<Stripe.Refund> {
  const stripe = getStripeInstance();

  return stripe.refunds.create({
    payment_intent: paymentIntentId,
    ...(amount && { amount }),
  });
}
