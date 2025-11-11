#!/usr/bin/env tsx

/**
 * Product Sync Script
 *
 * Syncs product configuration from config/products.json to the database.
 * This script is idempotent - can be run multiple times safely.
 *
 * Usage:
 *   npm run sync:products
 *   or
 *   tsx scripts/sync-products.ts
 */

import { db } from "@/db";
import { products, variants, productSpecs, productDependencies } from "@/db/schema";
import { ProductsJsonSchema } from "@/config/schema";
import { logger } from "@/lib/utils/logger";
import { readFileSync } from "fs";
import { join } from "path";

/**
 * Load and validate products.json
 * @param filePath - Path to products.json file
 */
function loadProductsJson(filePath: string) {
  const fileContent = readFileSync(filePath, "utf-8");
  const jsonData = JSON.parse(fileContent);

  const validation = ProductsJsonSchema.safeParse(jsonData);

  if (!validation.success) {
    logger.error('Validation failed for products.json', undefined, {
      validationErrors: validation.error.format(),
    });
    throw new Error(`Invalid products.json file`);
  }

  return validation.data;
}

/**
 * Sync products to database
 * @param configPath - Optional path to products.json (defaults to config/content/products.json)
 */
export async function syncProducts(configPath?: string) {
  logger.syncStart('product_sync');

  const filePath = configPath ?? join(process.cwd(), "config", "content", "products.json");
  let totalProducts = 0;
  let totalVariants = 0;
  let totalSpecs = 0;
  let totalDependencies = 0;

  try {
    // Load products.json
    logger.info('Loading config/products.json');
    const data = loadProductsJson(filePath);
    logger.info('Loaded products', { productCount: data.products.length });

    // Upsert products
    logger.info('Syncing products to database');
    for (const product of data.products) {
      await db
        .insert(products)
        .values({
          id: product.id,
          name: product.name,
          description: product.description,
          category: product.category,
          devStatus: product.dev_status,
          basePrice: product.base_price,
          isActive: true,
          requiresAssembly: product.requires_assembly || false,
          hasVariants: product.has_variants,
          maxQuantity: product.max_quantity ?? null,
          soldQuantity: 0,
          isLive: product.is_live ?? false,
          sellStatus: product.sell_status || 'internal',
          sellStatusNote: product.sell_status_note || null,
          costCents: product.cost_cents || null,
          wholesalePriceCents: product.wholesale_price_cents || null,
          cogsPrice: product.cogs_price || null,
          presaleDepositPrice: product.presale_deposit_price || null,
          media: product.media || null,
          stripeProductId: product.stripe_product_id || null,
          stripePriceId: product.stripe_price_id || null,
          lastSyncedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: products.id,
          set: {
            name: product.name,
            description: product.description,
            category: product.category,
            devStatus: product.dev_status,
            basePrice: product.base_price,
            requiresAssembly: product.requires_assembly || false,
            hasVariants: product.has_variants,
            maxQuantity: product.max_quantity ?? null,
            // NOTE: We do NOT overwrite soldQuantity on sync!
            isLive: product.is_live ?? false,
            sellStatus: product.sell_status || 'internal',
            sellStatusNote: product.sell_status_note || null,
            costCents: product.cost_cents || null,
            wholesalePriceCents: product.wholesale_price_cents || null,
            cogsPrice: product.cogs_price || null,
            presaleDepositPrice: product.presale_deposit_price || null,
            media: product.media || null,
            stripeProductId: product.stripe_product_id || null,
            stripePriceId: product.stripe_price_id || null,
            lastSyncedAt: new Date(),
            updatedAt: new Date(),
          },
        });

      totalProducts++;

      // Upsert specs for this product
      for (const spec of product.specs) {
        await db
          .insert(productSpecs)
          .values({
            productId: product.id,
            specKey: spec.key,
            specValue: spec.value,
            specUnit: spec.unit || null,
            displayOrder: spec.display_order,
          })
          .onConflictDoUpdate({
            target: [productSpecs.productId, productSpecs.specKey],
            set: {
              specValue: spec.value,
              specUnit: spec.unit || null,
              displayOrder: spec.display_order,
            },
          });

        totalSpecs++;
      }
    }
    logger.info('Products synced', { totalProducts, totalSpecs });

    // Create a map of products for variant lookup
    const productsMap = new Map(data.products.map(p => [p.id, p]));

    // Upsert variants if present
    if (data.variants && data.variants.length > 0) {
      logger.info('Syncing variants', { variantCount: data.variants.length });
      for (const variant of data.variants) {
        // Skip variants without required IDs
        if (!variant.id || !variant.product_id) {
          logger.warn('Skipping variant with missing ID fields', { variantId: variant.id });
          continue;
        }

        // Get stripe_product_id from variant or parent product
        const parentProduct = productsMap.get(variant.product_id);
        const stripeProductId = variant.stripe_product_id || parentProduct?.stripe_product_id;

        if (!stripeProductId) {
          logger.warn('Skipping variant - no stripe_product_id found', {
            variantId: variant.id,
            productId: variant.product_id,
          });
          continue;
        }

        await db
          .insert(variants)
          .values({
            id: variant.id,
            productId: variant.product_id,
            stripeProductId: stripeProductId,
            stripePriceId: variant.stripe_price_id || null,
            variantType: variant.variant_type,
            variantValue: variant.variant_value,
            priceModifier: variant.price_modifier || 0,
            wholesalePriceModifier: variant.wholesale_price_modifier ?? 0,
            presaleDepositModifier: variant.presale_deposit_modifier ?? 0,
            isLimitedEdition: variant.is_limited_edition,
            maxQuantity: variant.max_quantity || null,
            soldQuantity: 0, // Don't overwrite existing soldQuantity
            media: variant.media || null,
            metadata: variant.metadata || null,
          })
          .onConflictDoUpdate({
            target: variants.id,
            set: {
              stripeProductId: stripeProductId,
              stripePriceId: variant.stripe_price_id || null,
              variantType: variant.variant_type,
              variantValue: variant.variant_value,
              priceModifier: variant.price_modifier || 0,
              wholesalePriceModifier: variant.wholesale_price_modifier ?? 0,
              presaleDepositModifier: variant.presale_deposit_modifier ?? 0,
              isLimitedEdition: variant.is_limited_edition,
              maxQuantity: variant.max_quantity || null,
              media: variant.media || null,
              metadata: variant.metadata || null,
              updatedAt: new Date(),
            },
          });

        totalVariants++;
      }
      logger.info('Variants synced', { totalVariants });
    }

    // Sync dependencies if present
    if (data.dependencies && data.dependencies.length > 0) {
      logger.info('Syncing dependencies', { dependencyCount: data.dependencies.length });

      // Clear existing dependencies and insert new ones
      // Note: We delete and re-insert because dependencies don't have a unique constraint
      await db.delete(productDependencies);

      for (const dependency of data.dependencies) {
        await db.insert(productDependencies).values({
          productId: dependency.product_id,
          dependsOnProductId: dependency.depends_on_product_id,
          dependencyType: dependency.dependency_type,
          message: dependency.message || null,
          metadata: dependency.metadata || null,
        });

        totalDependencies++;
      }
      logger.info('Dependencies synced', { totalDependencies });
    }

    // Summary
    logger.syncComplete('product_sync', {
      totalProducts,
      totalVariants,
      totalSpecs,
      totalDependencies,
    });
  } catch (error) {
    logger.syncError('product_sync', error as Error);
    throw error; // Let tests handle the error, don't exit process
  }
}

// Only run if this file is executed directly (not imported)
if (require.main === module || import.meta.url === `file://${process.argv[1]}`) {
  syncProducts()
    .then(() => {
      process.exit(0);
    })
    .catch(() => {
      process.exit(1);
    });
}
