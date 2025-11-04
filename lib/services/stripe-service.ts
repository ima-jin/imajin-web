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
    stripePriceId: string; // Stripe Price ID for this line item
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
      price: item.stripePriceId,
      quantity: item.quantity,
    })
  );

  // Create session
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    // Enable modern payment methods including Stripe Link
    // Link is automatically enabled when card payments are supported
    payment_method_types: ['card', 'link'],
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

/**
 * Fetches all active products from Stripe
 *
 * @returns List of active Stripe products
 */
export async function fetchStripeProducts(): Promise<Stripe.Product[]> {
  const stripe = getStripeInstance();

  const products: Stripe.Product[] = [];
  let hasMore = true;
  let startingAfter: string | undefined;

  while (hasMore) {
    const response = await stripe.products.list({
      active: true,
      limit: 100,
      ...(startingAfter && { starting_after: startingAfter }),
    });

    products.push(...response.data);
    hasMore = response.has_more;

    if (hasMore && response.data.length > 0) {
      startingAfter = response.data[response.data.length - 1].id;
    }
  }

  return products;
}

/**
 * Fetches a single product from Stripe by ID
 *
 * @param productId - Stripe Product ID
 * @returns Stripe product
 */
export async function fetchStripeProduct(productId: string): Promise<Stripe.Product> {
  const stripe = getStripeInstance();
  return stripe.products.retrieve(productId);
}

/**
 * Fetches all active prices from Stripe
 *
 * @returns List of active Stripe prices
 */
export async function fetchStripePrices(): Promise<Stripe.Price[]> {
  const stripe = getStripeInstance();

  const prices: Stripe.Price[] = [];
  let hasMore = true;
  let startingAfter: string | undefined;

  while (hasMore) {
    const response = await stripe.prices.list({
      active: true,
      limit: 100,
      ...(startingAfter && { starting_after: startingAfter }),
    });

    prices.push(...response.data);
    hasMore = response.has_more;

    if (hasMore && response.data.length > 0) {
      startingAfter = response.data[response.data.length - 1].id;
    }
  }

  return prices;
}

/**
 * Fetches prices for a specific product
 *
 * @param productId - Stripe Product ID
 * @returns List of prices for the product
 */
export async function fetchPricesForProduct(productId: string): Promise<Stripe.Price[]> {
  const stripe = getStripeInstance();

  const prices: Stripe.Price[] = [];
  let hasMore = true;
  let startingAfter: string | undefined;

  while (hasMore) {
    const response = await stripe.prices.list({
      product: productId,
      active: true,
      limit: 100,
      ...(startingAfter && { starting_after: startingAfter }),
    });

    prices.push(...response.data);
    hasMore = response.has_more;

    if (hasMore && response.data.length > 0) {
      startingAfter = response.data[response.data.length - 1].id;
    }
  }

  return prices;
}

/**
 * Fetches a single price from Stripe by ID
 *
 * @param priceId - Stripe Price ID
 * @returns Stripe price
 */
export async function fetchStripePrice(priceId: string): Promise<Stripe.Price> {
  const stripe = getStripeInstance();
  return stripe.prices.retrieve(priceId);
}
