import Stripe from 'stripe';

// Lazy-load Stripe client to allow dotenv to load first
let stripe: Stripe | null = null;
function getStripeClient(): Stripe {
  if (!stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY environment variable is not set');
    }
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-09-30.clover',
    });
  }
  return stripe;
}

// Export for testing purposes
export function resetStripeClient() {
  stripe = null;
}

export interface StripeSyncResult {
  productId: string;
  action: 'created' | 'updated' | 'archived' | 'skipped';
  stripeProductId?: string;
  stripePriceId?: string;
  variantPrices?: Array<{
    variantId: string;
    stripePriceId: string;
  }>;
  error?: string;
}

interface ProductSyncInput {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  isLive: boolean;
  sellStatus: string;
  hasVariants?: boolean;
  stripeProductId?: string;
}

interface VariantSyncInput {
  id: string;
  productId: string;
  variantType: string;
  variantValue: string;
  priceModifier: number;
  stripePriceId?: string;
}

/**
 * Sync a product to Stripe
 * - Creates product if it doesn't exist
 * - Updates product if it exists
 * - Archives product if sell_status is 'internal'
 * - Handles variants (creates prices, not products)
 *
 * @param product - Product data to sync
 * @param variants - Optional variants (creates multiple prices under one product)
 * @returns Sync result with action taken
 */
export async function syncProductToStripe(
  product: ProductSyncInput,
  variants?: VariantSyncInput[]
): Promise<StripeSyncResult> {
  const stripe = getStripeClient();

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

    // PRODUCTS WITH VARIANTS → Create parent product + multiple prices
    if (product.hasVariants && variants && variants.length > 0) {
      let stripeProductId = product.stripeProductId;

      // Create or update parent product
      if (stripeProductId) {
        // UPDATE existing product
        await stripe.products.update(stripeProductId, {
          name: product.name,
          description: product.description,
          active: product.isLive,
          metadata: {
            local_id: product.id,
            sell_status: product.sellStatus,
          },
        });
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
        stripeProductId = stripeProduct.id;
      }

      // Create or update prices for each variant
      const variantPrices = [];
      for (const variant of variants) {
        const variantPrice = product.basePrice + variant.priceModifier;
        let priceId = variant.stripePriceId;

        // Check if we need to create a new price
        if (priceId) {
          // Verify the existing price is still valid (check if price amount matches)
          const existingPrices = await stripe.prices.list({
            product: stripeProductId,
            active: true,
          });

          const currentPrice = existingPrices.data.find((p) => p.id === priceId);

          if (currentPrice && currentPrice.unit_amount === variantPrice) {
            // Price exists and amount matches, reuse it
            variantPrices.push({
              variantId: variant.id,
              stripePriceId: priceId,
            });
            continue;
          } else if (currentPrice) {
            // Price exists but amount changed, archive old price
            await stripe.prices.update(priceId, { active: false });
            priceId = undefined;
          }
        }

        // Create new price (either no existing price or price changed)
        const price = await stripe.prices.create({
          product: stripeProductId,
          unit_amount: variantPrice,
          currency: 'usd',
          nickname: `${variant.variantType}: ${variant.variantValue}`,
          metadata: {
            variant_id: variant.id,
            variant_type: variant.variantType,
            variant_value: variant.variantValue,
          },
        });

        variantPrices.push({
          variantId: variant.id,
          stripePriceId: price.id,
        });
      }

      return {
        productId: product.id,
        action: product.stripeProductId ? 'updated' : 'created',
        stripeProductId,
        variantPrices,
      };
    }

    // PRODUCTS WITHOUT VARIANTS → Single product with single price
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
