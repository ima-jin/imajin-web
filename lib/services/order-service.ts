import { db } from '@/db';
import { orders, orderItems, products, variants } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

export interface CreateOrderParams {
  sessionId: string;
  paymentIntentId: string;
  customerEmail: string;
  customerName?: string;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  items: Array<{
    productId: string;
    variantId?: string;
    stripePriceId: string; // Stripe Price ID
    quantity: number;
    unitPrice: number;
    productName: string;
    variantName?: string;
  }>;
  shippingAddress?: {
    name?: string;
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
}

/**
 * Creates order from successful checkout session
 *
 * This function runs in a transaction to ensure:
 * 1. Order is created
 * 2. Order items are created
 * 3. Limited edition quantities are decremented atomically
 *
 * @param params - Order creation parameters
 * @returns Created order with items
 */
export async function createOrder(params: CreateOrderParams) {
  const {
    sessionId,
    paymentIntentId,
    customerEmail,
    customerName,
    subtotal,
    tax,
    shipping,
    total,
    items,
    shippingAddress,
  } = params;

  return db.transaction(async (tx) => {
    // Create order record
    const [order] = await tx
      .insert(orders)
      .values({
        id: sessionId,
        stripePaymentIntentId: paymentIntentId,
        customerEmail,
        customerName,
        status: 'paid',
        subtotal,
        tax,
        shipping,
        total,
        currency: 'usd',
        shippingName: shippingAddress?.name,
        shippingAddressLine1: shippingAddress?.line1,
        shippingAddressLine2: shippingAddress?.line2,
        shippingCity: shippingAddress?.city,
        shippingState: shippingAddress?.state,
        shippingPostalCode: shippingAddress?.postalCode,
        shippingCountry: shippingAddress?.country,
      })
      .returning();

    // Create order items and increment quantities
    for (const item of items) {
      await tx.insert(orderItems).values({
        orderId: order.id,
        productId: item.productId,
        variantId: item.variantId,
        stripePriceId: item.stripePriceId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.unitPrice * item.quantity,
        productName: item.productName,
        variantName: item.variantName,
      });

      // Always increment product soldQuantity
      await tx
        .update(products)
        .set({
          soldQuantity: sql`${products.soldQuantity} + ${item.quantity}`,
        })
        .where(eq(products.id, item.productId));

      // Also increment variant soldQuantity if variant exists
      if (item.variantId) {
        await tx
          .update(variants)
          .set({
            soldQuantity: sql`${variants.soldQuantity} + ${item.quantity}`,
          })
          .where(eq(variants.id, item.variantId));
      }
    }

    return order;
  });
}

/**
 * Retrieves order by ID with its items
 *
 * @param orderId - Order ID (Stripe Checkout Session ID)
 * @returns Order with items, or null if not found
 */
export async function getOrder(orderId: string) {
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId));

  if (!order) return null;

  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId));

  return { ...order, items };
}

/**
 * Looks up order by email and order ID
 *
 * Used for customer self-service order tracking.
 * Only returns order if email matches.
 *
 * @param email - Customer email
 * @param orderId - Order ID
 * @returns Order with items, or null if not found or email doesn't match
 */
export async function lookupOrder(email: string, orderId: string) {
  const order = await getOrder(orderId);

  if (!order || order.customerEmail !== email) {
    return null;
  }

  return order;
}

/**
 * Updates order status
 *
 * @param orderId - Order ID
 * @param status - New status
 * @param trackingNumber - Optional tracking number (for shipped status)
 * @returns Updated order
 */
export async function updateOrderStatus(
  orderId: string,
  status: string,
  trackingNumber?: string
) {
  return db
    .update(orders)
    .set({
      status,
      ...(trackingNumber && { trackingNumber }),
      ...(status === 'shipped' && { shippedAt: new Date() }),
      updatedAt: new Date(),
    })
    .where(eq(orders.id, orderId))
    .returning();
}
