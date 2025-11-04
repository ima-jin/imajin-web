/**
 * One-time migration script to fix Stripe variant architecture
 *
 * This script migrates from the incorrect architecture (separate Products per variant)
 * to the correct architecture (one Product with multiple Prices).
 *
 * BEFORE running this script:
 * 1. Backup products.json: cp config/content/products.json config/content/products.json.backup-$(date +%Y%m%d)
 * 2. Ensure STRIPE_SECRET_KEY is set in .env
 * 3. Review the VARIANT_PRODUCTS_TO_DELETE and PARENT_PRODUCT_ID constants
 *
 * What this script does:
 * 1. Archives incorrect variant products from Stripe
 * 2. Creates correct prices under parent product
 * 3. Updates products.json with new price IDs
 * 4. Syncs to database
 *
 * Run with: npx tsx scripts/migrate-stripe-variants.ts
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import Stripe from 'stripe';
import fs from 'fs';
import path from 'path';

// Configuration - UPDATE THESE VALUES BEFORE RUNNING
const PARENT_PRODUCT_ID = 'prod_TLWCEEY3blul23'; // Founder Edition Cube parent product
const VARIANT_PRODUCTS_TO_DELETE = [
  'prod_TLWC78h4y2DvWI', // Founder Edition - BLACK
  'prod_TLWCKSdz5hHmlb', // Founder Edition - WHITE
  'prod_TLWCEB3m8VtNO1', // Founder Edition - RED
];

const PRODUCTS_JSON_PATH = path.join(process.cwd(), 'config', 'content', 'products.json');

interface VariantPriceMapping {
  variantId: string;
  color: string;
  priceId: string;
}

/**
 * Initialize Stripe client
 */
function getStripeClient(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY environment variable is not set');
  }

  return new Stripe(secretKey, {
    apiVersion: '2025-09-30.clover',
  });
}

/**
 * Archive (deactivate) incorrect variant products
 */
async function archiveVariantProducts(stripe: Stripe): Promise<void> {
  console.log('\n📦 Archiving incorrect variant products...');

  for (const productId of VARIANT_PRODUCTS_TO_DELETE) {
    try {
      await stripe.products.update(productId, {
        active: false,
      });
      console.log(`✅ Archived product: ${productId}`);
    } catch (error) {
      console.error(`❌ Failed to archive product ${productId}:`, error);
      throw error;
    }
  }
}

/**
 * Create prices for variants under parent product
 */
async function createVariantPrices(stripe: Stripe): Promise<VariantPriceMapping[]> {
  console.log('\n💰 Creating variant prices under parent product...');

  const variantConfigs = [
    { variantId: 'Unit-8x8x8-Founder-BLACK', color: 'BLACK', unitAmount: 129500 },
    { variantId: 'Unit-8x8x8-Founder-WHITE', color: 'WHITE', unitAmount: 129500 },
    { variantId: 'Unit-8x8x8-Founder-RED', color: 'RED', unitAmount: 129500 },
  ];

  const mappings: VariantPriceMapping[] = [];

  for (const config of variantConfigs) {
    try {
      const price = await stripe.prices.create({
        product: PARENT_PRODUCT_ID,
        unit_amount: config.unitAmount,
        currency: 'usd',
        metadata: {
          variant_id: config.variantId,
          variant_type: 'color',
          variant_value: config.color,
        },
        nickname: `Founder Edition - ${config.color}`,
      });

      console.log(`✅ Created price for ${config.color}: ${price.id}`);

      mappings.push({
        variantId: config.variantId,
        color: config.color,
        priceId: price.id,
      });
    } catch (error) {
      console.error(`❌ Failed to create price for ${config.color}:`, error);
      throw error;
    }
  }

  return mappings;
}

/**
 * Update products.json with new price IDs
 */
async function updateProductsJson(mappings: VariantPriceMapping[]): Promise<void> {
  console.log('\n📝 Updating products.json with new price IDs...');

  // Read products.json
  const productsJsonRaw = fs.readFileSync(PRODUCTS_JSON_PATH, 'utf-8');
  const productsJson = JSON.parse(productsJsonRaw);

  // Update parent product stripe_product_id
  const parentProduct = productsJson.products.find((p: any) => p.id === 'Unit-8x8x8-Founder');
  if (parentProduct) {
    parentProduct.stripe_product_id = PARENT_PRODUCT_ID;
    console.log(`✅ Updated parent product stripe_product_id`);
  } else {
    console.warn('⚠️  Parent product not found in products.json');
  }

  // Update variants with new price IDs
  for (const mapping of mappings) {
    const variant = productsJson.variants?.find((v: any) => v.id === mapping.variantId);
    if (variant) {
      variant.stripe_price_id = mapping.priceId;
      console.log(`✅ Updated ${mapping.color} variant with price ID: ${mapping.priceId}`);
    } else {
      console.warn(`⚠️  Variant ${mapping.variantId} not found in products.json`);
    }
  }

  // Write updated products.json
  fs.writeFileSync(PRODUCTS_JSON_PATH, JSON.stringify(productsJson, null, 2), 'utf-8');
  console.log('✅ products.json updated successfully');
}

/**
 * Main migration function
 */
async function main() {
  console.log('🚀 Starting Stripe variant architecture migration...\n');

  const stripe = getStripeClient();

  try {
    // Step 1: Archive incorrect variant products
    await archiveVariantProducts(stripe);

    // Step 2: Create new prices under parent product
    const mappings = await createVariantPrices(stripe);

    // Step 3: Update products.json
    await updateProductsJson(mappings);

    console.log('\n✅ Migration completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Run: npm run db:sync:enhanced');
    console.log('2. Verify Stripe Dashboard shows correct structure');
    console.log('3. Test checkout with a variant product');
    console.log('4. If everything works, you can delete the archived products from Stripe Dashboard after 30 days\n');
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.error('\nTo rollback:');
    console.error('1. Restore products.json from backup');
    console.error('2. Re-activate archived products in Stripe Dashboard');
    console.error('3. Delete created prices from Stripe Dashboard\n');
    process.exit(1);
  }
}

// Run migration
main();
