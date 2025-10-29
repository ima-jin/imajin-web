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

// Config file path
const configFile = join(process.cwd(), "config", "content", "products.json");

/**
 * Load and validate products.json
 */
function loadProductsJson() {
  const fileContent = readFileSync(configFile, "utf-8");
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
 */
async function syncProducts() {
  logger.syncStart('product_sync');

  let totalProducts = 0;
  let totalVariants = 0;
  let totalSpecs = 0;
  let totalDependencies = 0;

  try {
    // Load products.json
    logger.info('Loading config/products.json');
    const data = loadProductsJson();
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
          isLive: product.sell_status === 'for-sale',
          sellStatus: product.sell_status || 'internal',
          sellStatusNote: product.sell_status_note || null,
          costCents: product.cost_cents || null,
          wholesalePriceCents: product.wholesale_price_cents || null,
          media: product.media || null,
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
            isLive: product.sell_status === 'for-sale',
            sellStatus: product.sell_status || 'internal',
            sellStatusNote: product.sell_status_note || null,
            costCents: product.cost_cents || null,
            wholesalePriceCents: product.wholesale_price_cents || null,
            media: product.media || null,
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

    // Upsert variants if present
    if (data.variants && data.variants.length > 0) {
      logger.info('Syncing variants', { variantCount: data.variants.length });
      for (const variant of data.variants) {
        // Skip variants without required IDs
        if (!variant.id || !variant.product_id || !variant.stripe_product_id) {
          logger.warn('Skipping variant with missing ID fields', { variantId: variant.id });
          continue;
        }

        await db
          .insert(variants)
          .values({
            id: variant.id,
            productId: variant.product_id,
            stripeProductId: variant.stripe_product_id,
            variantType: variant.variant_type,
            variantValue: variant.variant_value,
            priceModifier: variant.price_modifier || 0,
            isLimitedEdition: variant.is_limited_edition,
            maxQuantity: variant.max_quantity || null,
            soldQuantity: 0, // Don't overwrite existing soldQuantity
            media: variant.media || null,
            metadata: variant.metadata || null,
          })
          .onConflictDoUpdate({
            target: variants.id,
            set: {
              stripeProductId: variant.stripe_product_id,
              variantType: variant.variant_type,
              variantValue: variant.variant_value,
              priceModifier: variant.price_modifier || 0,
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
    process.exit(1);
  }

  process.exit(0);
}

// Run the sync
syncProducts();
