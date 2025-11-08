/**
 * Sync From Stripe Script
 *
 * Fetches products and prices from Stripe and compares them to local products.json
 * Helps ensure pricing consistency and identify any discrepancies
 *
 * Usage:
 *   npx tsx scripts/sync-from-stripe.ts [--verbose] [--update]
 *
 * Options:
 *   --verbose   Show detailed information for each product
 *   --update    Update local products.json with Stripe pricing (NOT IMPLEMENTED YET)
 */

import {
  fetchStripeProducts,
  fetchStripePrices,
} from '@/lib/services/stripe-service';
import { ProductsJsonSchema, type VariantConfig } from '@/config/schema';
import { logger } from '@/lib/utils/logger';
import { readFileSync } from 'fs';
import { join } from 'path';
import type Stripe from 'stripe';

interface SyncIssue {
  severity: 'error' | 'warning' | 'info';
  productId: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Load and validate products.json
 */
function loadProductsJson() {
  const configFile = join(process.cwd(), 'config', 'content', 'products.json');
  const fileContent = readFileSync(configFile, 'utf-8');
  const jsonData = JSON.parse(fileContent);

  const validation = ProductsJsonSchema.safeParse(jsonData);

  if (!validation.success) {
    logger.error('Validation failed for products.json', undefined, {
      validationErrors: validation.error.format(),
    });
    throw new Error('Invalid products.json file');
  }

  return validation.data;
}

async function syncFromStripe() {
  const verbose = process.argv.includes('--verbose');
  const issues: SyncIssue[] = [];

  console.log('\n🔄 Syncing product data from Stripe...\n');

  try {
    // Load local products
    console.log('📦 Loading local products.json...');
    const productsData = await loadProductsJson();
    const localProducts = productsData.products;
    console.log(`   Found ${localProducts.length} local products\n`);

    // Fetch Stripe products
    console.log('🔗 Fetching products from Stripe...');
    const stripeProducts = await fetchStripeProducts();
    console.log(`   Found ${stripeProducts.length} Stripe products\n`);

    // Fetch all prices
    console.log('💰 Fetching prices from Stripe...');
    const stripePrices = await fetchStripePrices();
    console.log(`   Found ${stripePrices.length} Stripe prices\n`);

    // Create price lookup map (price_id -> price)
    const priceMap = new Map<string, Stripe.Price>();
    stripePrices.forEach((price) => {
      priceMap.set(price.id, price);
    });

    // Create product lookup map (product_id -> product)
    const stripeProductMap = new Map<string, Stripe.Product>();
    stripeProducts.forEach((product) => {
      stripeProductMap.set(product.id, product);
    });

    console.log('🔍 Analyzing product data...\n');
    console.log('─'.repeat(80));

    // Build variants map by product ID
    const variantsByProductId = new Map<string, VariantConfig[]>();
    if (productsData.variants) {
      for (const variant of productsData.variants) {
        if (!variantsByProductId.has(variant.product_id)) {
          variantsByProductId.set(variant.product_id, []);
        }
        variantsByProductId.get(variant.product_id)!.push(variant);
      }
    }

    // Check each local product
    for (const localProduct of localProducts) {
      if (verbose) {
        console.log(`\n📦 ${localProduct.name} (${localProduct.id})`);
      }

      // Check if product has variants
      const productVariants = variantsByProductId.get(localProduct.id) || [];
      if (productVariants.length > 0) {
        // Product with variants - check each variant's Stripe price
        for (const variant of productVariants) {
          const stripePriceId = variant.stripe_price_id;

          if (!stripePriceId) {
            issues.push({
              severity: 'error',
              productId: localProduct.id,
              message: `Variant "${variant.variant_value}" missing stripe_price_id`,
              details: { variantId: variant.id },
            });
            if (verbose) {
              console.log(`   ❌ Variant "${variant.variant_value}": Missing Stripe price ID`);
            }
            continue;
          }

          const stripePrice = priceMap.get(stripePriceId);

          if (!stripePrice) {
            issues.push({
              severity: 'error',
              productId: localProduct.id,
              message: `Variant "${variant.variant_value}" price not found in Stripe: ${stripePriceId}`,
              details: { variantId: variant.id, stripePriceId },
            });
            if (verbose) {
              console.log(`   ❌ Variant "${variant.variant_value}": Price not found in Stripe`);
            }
            continue;
          }

          // Calculate expected price (base_price + price_modifier)
          const expectedPrice = localProduct.base_price + (variant.price_modifier || 0);
          const stripeAmount = stripePrice.unit_amount || 0;

          if (expectedPrice !== stripeAmount) {
            issues.push({
              severity: 'warning',
              productId: localProduct.id,
              message: `Variant "${variant.variant_value}" price mismatch`,
              details: {
                variantId: variant.id,
                expectedPrice,
                stripePrice: stripeAmount,
                difference: stripeAmount - expectedPrice,
              },
            });
            if (verbose) {
              console.log(
                `   ⚠️  Variant "${variant.variant_value}": Price mismatch (local: $${(expectedPrice / 100).toFixed(2)}, Stripe: $${(stripeAmount / 100).toFixed(2)})`
              );
            }
          } else if (verbose) {
            console.log(
              `   ✅ Variant "${variant.variant_value}": $${(expectedPrice / 100).toFixed(2)}`
            );
          }
        }
      } else {
        // Product without variants - should still have a Stripe price ID if it's for sale
        if (localProduct.sell_status === 'for-sale' && !localProduct.stripe_product_id) {
          issues.push({
            severity: 'warning',
            productId: localProduct.id,
            message: 'Product marked for sale but missing stripe_product_id',
          });
          if (verbose) {
            console.log('   ⚠️  Missing Stripe price ID (marked for sale)');
          }
        } else if (localProduct.stripe_product_id) {
          const stripePriceId = localProduct.stripe_product_id;
          const stripePrice = priceMap.get(stripePriceId);

          if (!stripePrice) {
            issues.push({
              severity: 'error',
              productId: localProduct.id,
              message: `Stripe price not found: ${stripePriceId}`,
              details: { stripePriceId },
            });
            if (verbose) {
              console.log('   ❌ Price not found in Stripe');
            }
          } else {
            const expectedPrice = localProduct.base_price;
            const stripeAmount = stripePrice.unit_amount || 0;

            if (expectedPrice !== stripeAmount) {
              issues.push({
                severity: 'warning',
                productId: localProduct.id,
                message: 'Price mismatch with Stripe',
                details: {
                  expectedPrice,
                  stripePrice: stripeAmount,
                  difference: stripeAmount - expectedPrice,
                },
              });
              if (verbose) {
                console.log(
                  `   ⚠️  Price mismatch (local: $${(expectedPrice / 100).toFixed(2)}, Stripe: $${(stripeAmount / 100).toFixed(2)})`
                );
              }
            } else if (verbose) {
              console.log(`   ✅ Price: $${(expectedPrice / 100).toFixed(2)}`);
            }
          }
        } else if (verbose) {
          console.log('   ℹ️  No Stripe price ID (internal product)');
        }
      }
    }

    console.log('\n' + '─'.repeat(80));
    console.log('\n📊 Summary\n');

    // Group issues by severity
    const errors = issues.filter((i) => i.severity === 'error');
    const warnings = issues.filter((i) => i.severity === 'warning');
    const infos = issues.filter((i) => i.severity === 'info');

    console.log(`   Total Products: ${localProducts.length}`);
    console.log(`   Stripe Products: ${stripeProducts.length}`);
    console.log(`   Stripe Prices: ${stripePrices.length}`);
    console.log('');
    console.log(`   ❌ Errors: ${errors.length}`);
    console.log(`   ⚠️  Warnings: ${warnings.length}`);
    console.log(`   ℹ️  Info: ${infos.length}`);

    // Print issues
    if (issues.length > 0) {
      console.log('\n📋 Issues Found:\n');

      errors.forEach((issue) => {
        console.log(`   ❌ [${issue.productId}] ${issue.message}`);
        if (issue.details) {
          console.log(`      Details: ${JSON.stringify(issue.details)}`);
        }
      });

      warnings.forEach((issue) => {
        console.log(`   ⚠️  [${issue.productId}] ${issue.message}`);
        if (issue.details) {
          console.log(`      Details: ${JSON.stringify(issue.details)}`);
        }
      });

      infos.forEach((issue) => {
        console.log(`   ℹ️  [${issue.productId}] ${issue.message}`);
      });
    } else {
      console.log('\n✅ All products in sync with Stripe!\n');
    }

    // Exit with error code if there are errors
    if (errors.length > 0) {
      console.log('\n⚠️  Sync completed with errors. Please fix the issues above.\n');
      process.exit(1);
    } else if (warnings.length > 0) {
      console.log('\n⚠️  Sync completed with warnings. Review the issues above.\n');
      process.exit(0);
    } else {
      console.log('\n✅ Sync completed successfully!\n');
      process.exit(0);
    }
  } catch (error) {
    console.error('\n❌ Sync failed:', error);
    if (error instanceof Error) {
      console.error('   Message:', error.message);
      if (error.stack) {
        console.error('   Stack:', error.stack);
      }
    }
    process.exit(1);
  }
}

syncFromStripe();
