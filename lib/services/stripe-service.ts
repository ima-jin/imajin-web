import Stripe from 'stripe';
import { paginateStripeList } from '@/lib/utils/stripe-pagination';

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

export interface CreateDepositCheckoutParams {
  productId: string; // Target product ID for deposit
  variantId?: string; // Optional variant ID
  depositAmount: number; // Deposit amount in cents
  customerEmail: string;
  successUrl?: string;
  cancelUrl?: string;
}

export interface CreatePreOrderCheckoutParams {
  items: Array<{
    stripePriceId: string;
    quantity: number;
  }>;
  customerEmail: string;
  depositOrderId?: string; // ID of deposit order to apply
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
 * Creates a Stripe Checkout Session for pre-sale deposit
 *
 * This creates a payment session for a refundable deposit that:
 * - Secures wholesale pricing for the customer
 * - Gets stored with metadata linking to the target product
 * - Can be refunded if customer changes mind
 * - Gets applied to final payment when product moves to pre-order
 *
 * @param params - Deposit checkout parameters
 * @returns Stripe Checkout Session
 */
export async function createDepositCheckoutSession(
  params: CreateDepositCheckoutParams
): Promise<Stripe.Checkout.Session> {
  const stripe = getStripeInstance();

  const {
    productId,
    variantId,
    depositAmount,
    customerEmail,
    successUrl,
    cancelUrl,
  } = params;

  // Create a payment link for the deposit amount
  // We'll use Stripe's payment_intent_data to create a one-time payment
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card', 'link'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Pre-Sale Deposit',
            description: 'Refundable deposit to secure wholesale pricing',
          },
          unit_amount: depositAmount,
        },
        quantity: 1,
      },
    ],
    customer_email: customerEmail,
    success_url: successUrl || `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/products/${productId}`,
    metadata: {
      order_type: 'pre-sale-deposit',
      target_product_id: productId,
      ...(variantId && { target_variant_id: variantId }),
    },
    expires_at: Math.floor(Date.now() / 1000) + 3600 * 24, // 24 hours
  });

  return session;
}

/**
 * Creates a Stripe Checkout Session for pre-order with deposit application
 *
 * This creates a payment session for the final payment that:
 * - Charges the remaining balance after deposit
 * - Links to the original deposit order
 * - Marks deposit as 'applied' after successful payment
 *
 * @param params - Pre-order checkout parameters
 * @returns Stripe Checkout Session
 */
export async function createPreOrderCheckoutSession(
  params: CreatePreOrderCheckoutParams
): Promise<Stripe.Checkout.Session> {
  const stripe = getStripeInstance();

  const {
    items,
    customerEmail,
    depositOrderId,
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

  // Create session with deposit metadata
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card', 'link'],
    line_items: lineItems,
    customer_email: customerEmail,
    success_url: successUrl || `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/checkout`,
    metadata: {
      order_type: 'pre-order-with-deposit',
      ...(depositOrderId && { deposit_order_id: depositOrderId }),
    },
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

  return paginateStripeList(
    (params) => stripe.products.list(params),
    { active: true, limit: 100 }
  );
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

  return paginateStripeList(
    (params) => stripe.prices.list(params),
    { active: true, limit: 100 }
  );
}

/**
 * Fetches prices for a specific product
 *
 * @param productId - Stripe Product ID
 * @returns List of prices for the product
 */
export async function fetchPricesForProduct(productId: string): Promise<Stripe.Price[]> {
  const stripe = getStripeInstance();

  return paginateStripeList(
    (params) => stripe.prices.list(params),
    { product: productId, active: true, limit: 100 }
  );
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
