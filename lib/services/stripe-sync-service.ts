import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
});

export interface StripeSyncResult {
  productId: string;
  action: 'created' | 'updated' | 'archived' | 'skipped';
  stripeProductId?: string;
  stripePriceId?: string;
  error?: string;
}

interface ProductSyncInput {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  isLive: boolean;
  sellStatus: string;
  stripeProductId?: string;
}

/**
 * Sync a product to Stripe
 * - Creates product if it doesn't exist
 * - Updates product if it exists
 * - Archives product if sell_status is 'internal'
 * - Handles price changes (Stripe prices are immutable)
 *
 * @param product - Product data to sync
 * @returns Sync result with action taken
 */
export async function syncProductToStripe(
  product: ProductSyncInput
): Promise<StripeSyncResult> {
  try {
    // INTERNAL products → Archive in Stripe
    if (product.sellStatus === 'internal') {
      if (product.stripeProductId) {
        await stripe.products.update(product.stripeProductId, { active: false });
        return {
          productId: product.id,
          action: 'archived',
        };
      }
      return { productId: product.id, action: 'skipped' };
    }

    // Non-internal products → Create or Update
    if (product.stripeProductId) {
      // UPDATE existing product
      await stripe.products.update(product.stripeProductId, {
        name: product.name,
        description: product.description,
        active: product.isLive,
        metadata: {
          local_id: product.id,
          sell_status: product.sellStatus,
        },
      });

      // Check if price changed (create new price if needed)
      const existingPrices = await stripe.prices.list({
        product: product.stripeProductId,
        active: true,
      });

      const currentPrice = existingPrices.data[0];
      if (!currentPrice || currentPrice.unit_amount !== product.basePrice) {
        // Archive old prices
        for (const price of existingPrices.data) {
          await stripe.prices.update(price.id, { active: false });
        }

        // Create new price
        const newPrice = await stripe.prices.create({
          product: product.stripeProductId,
          unit_amount: product.basePrice,
          currency: 'usd',
        });

        // Set as default
        await stripe.products.update(product.stripeProductId, {
          default_price: newPrice.id,
        });
      }

      return {
        productId: product.id,
        action: 'updated',
        stripeProductId: product.stripeProductId,
      };
    } else {
      // CREATE new product
      const stripeProduct = await stripe.products.create({
        name: product.name,
        description: product.description,
        active: product.isLive,
        metadata: {
          local_id: product.id,
          sell_status: product.sellStatus,
        },
      });

      // Create price
      const stripePrice = await stripe.prices.create({
        product: stripeProduct.id,
        unit_amount: product.basePrice,
        currency: 'usd',
      });

      // Set as default
      await stripe.products.update(stripeProduct.id, {
        default_price: stripePrice.id,
      });

      return {
        productId: product.id,
        action: 'created',
        stripeProductId: stripeProduct.id,
        stripePriceId: stripePrice.id,
      };
    }
  } catch (error) {
    return {
      productId: product.id,
      action: 'skipped',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
