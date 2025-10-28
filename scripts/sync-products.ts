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
import { readFileSync } from "fs";
import { join } from "path";

// Config file path
const configFile = join(process.cwd(), "config", "products.json");

/**
 * Load and validate products.json
 */
function loadProductsJson() {
  const fileContent = readFileSync(configFile, "utf-8");
  const jsonData = JSON.parse(fileContent);

  const validation = ProductsJsonSchema.safeParse(jsonData);

  if (!validation.success) {
    console.error(`❌ Validation failed for products.json:`);
    console.error(validation.error.format());
    throw new Error(`Invalid products.json file`);
  }

  return validation.data;
}

/**
 * Sync products to database
 */
async function syncProducts() {
  console.log("🔄 Syncing products to database...\n");

  let totalProducts = 0;
  let totalVariants = 0;
  let totalSpecs = 0;
  let totalDependencies = 0;

  try {
    // Load products.json
    console.log(`📄 Loading config/products.json...`);
    const data = loadProductsJson();
    console.log(`  ✅ Loaded ${data.products.length} products\n`);

    // Upsert products
    console.log(`📦 Syncing products...`);
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
    console.log(`  ✅ Synced ${totalProducts} products with ${totalSpecs} specs\n`);

    // Upsert variants if present
    if (data.variants && data.variants.length > 0) {
      console.log(`🎨 Syncing variants...`);
      for (const variant of data.variants) {
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
              metadata: variant.metadata || null,
              updatedAt: new Date(),
            },
          });

        totalVariants++;
      }
      console.log(`  ✅ Synced ${totalVariants} variants\n`);
    }

    // Sync dependencies if present
    if (data.dependencies && data.dependencies.length > 0) {
      console.log(`🔗 Syncing dependencies...`);

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
      console.log(`  ✅ Synced ${totalDependencies} dependencies\n`);
    }

    // Summary
    console.log("✅ Sync complete!\n");
    console.log("📊 Summary:");
    console.log(`   Products: ${totalProducts}`);
    console.log(`   Variants: ${totalVariants}`);
    console.log(`   Specs: ${totalSpecs}`);
    console.log(`   Dependencies: ${totalDependencies}`);
    console.log(`\n💡 Database has been updated with latest product configuration.`);
  } catch (error) {
    console.error("\n❌ Error during sync:");
    console.error(error);
    process.exit(1);
  }

  process.exit(0);
}

// Run the sync
syncProducts();
