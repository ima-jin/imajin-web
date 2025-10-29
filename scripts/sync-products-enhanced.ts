#!/usr/bin/env tsx

/**
 * Enhanced Product Sync Script
 *
 * Comprehensive sync workflow:
 * 1. Scan media files from config/content/media/
 * 2. Upload new media to Cloudinary
 * 3. Sync products to Stripe (create/update/archive)
 * 4. Sync to PostgreSQL database
 * 5. Update products.json with generated IDs (cloudinary_public_id, stripe_product_id)
 * 6. Cleanup deleted media (if file removed from disk)
 *
 * Usage:
 *   npm run sync:products:enhanced
 *   tsx scripts/sync-products-enhanced.ts
 *   tsx scripts/sync-products-enhanced.ts <custom-products-json-path> <custom-media-dir>
 */

import { db } from '@/db';
import { products, variants, productSpecs, productDependencies } from '@/db/schema';
import { eq, notInArray } from 'drizzle-orm';
import { ProductsJsonSchema } from '@/config/schema';
import type { ProductsJson } from '@/config/schema';
import { uploadMedia, deleteMedia } from '@/lib/services/cloudinary-service';
import { syncProductToStripe } from '@/lib/services/stripe-sync-service';
import { logger } from '@/lib/utils/logger';
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join } from 'path';

// Default paths (can be overridden for testing)
const DEFAULT_PRODUCTS_JSON_PATH = join(process.cwd(), 'config', 'content', 'products.json');
const DEFAULT_MEDIA_DIR = join(process.cwd(), 'config', 'content', 'media');

interface SyncReport {
  mediaUploaded: number;
  mediaSkipped: number;
  mediaDeleted: number;
  mediaErrors: string[];
  stripeCreated: number;
  stripeUpdated: number;
  stripeArchived: number;
  stripeErrors: string[];
  dbSynced: number;
  dbErrors: string[];
}

/**
 * Main sync function
 */
export async function syncProductsEnhanced(
  productsJsonPath: string = DEFAULT_PRODUCTS_JSON_PATH,
  mediaDir: string = DEFAULT_MEDIA_DIR
): Promise<SyncReport> {
  logger.syncStart('enhanced_product_sync', { productsJsonPath, mediaDir });

  const report: SyncReport = {
    mediaUploaded: 0,
    mediaSkipped: 0,
    mediaDeleted: 0,
    mediaErrors: [],
    stripeCreated: 0,
    stripeUpdated: 0,
    stripeArchived: 0,
    stripeErrors: [],
    dbSynced: 0,
    dbErrors: [],
  };

  try {
    // Step 1: Load products.json
    logger.info('Loading products.json', { path: productsJsonPath });
    const fileContent = readFileSync(productsJsonPath, 'utf-8');
    const data = JSON.parse(fileContent) as ProductsJson;

    const validation = ProductsJsonSchema.safeParse(data);
    if (!validation.success) {
      logger.error('Validation failed for products.json', undefined, {
        errors: validation.error.format(),
      });
      throw new Error('Invalid products.json');
    }

    logger.info('Loaded products', { count: data.products.length });

    let modified = false;

    // Step 2: Process media files for products
    logger.info('Processing product media files');
    for (const product of data.products) {
      const productResult = await processProductMedia(product, mediaDir, report);
      if (productResult) modified = true;
    }

    // Step 3: Process media files for variants
    logger.info('Processing variant media files');
    for (const variant of data.variants) {
      const variantResult = await processVariantMedia(variant, data, mediaDir, report);
      if (variantResult) modified = true;
    }

    // Step 4: Cleanup deleted media
    logger.info('Checking for deleted media');
    for (const product of data.products) {
      const cleanupResult = await cleanupDeletedMedia(product, mediaDir, report);
      if (cleanupResult) modified = true;
    }
    for (const variant of data.variants) {
      const cleanupResult = await cleanupDeletedMediaVariant(variant, data, mediaDir, report);
      if (cleanupResult) modified = true;
    }

    logger.info('Media processing complete', {
      uploaded: report.mediaUploaded,
      skipped: report.mediaSkipped,
      deleted: report.mediaDeleted,
      errors: report.mediaErrors.length,
    });

    // Step 5: Sync to Stripe
    logger.info('Syncing to Stripe');
    for (const product of data.products) {
      try {
        const result = await syncProductToStripe({
          id: product.id,
          name: product.name,
          description: product.description,
          basePrice: product.base_price,
          isLive: product.sell_status === 'for-sale' || product.sell_status === 'pre-order',
          sellStatus: product.sell_status || 'internal',
          stripeProductId: product.stripe_product_id,
        });

        if (result.action === 'created') {
          report.stripeCreated++;
          product.stripe_product_id = result.stripeProductId;
          modified = true;
        } else if (result.action === 'updated') {
          report.stripeUpdated++;
        } else if (result.action === 'archived') {
          report.stripeArchived++;
          delete product.stripe_product_id;
          modified = true;
        }

        if (result.error) {
          report.stripeErrors.push(`${product.id}: ${result.error}`);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        report.stripeErrors.push(`${product.id}: ${errorMsg}`);
        logger.error('Stripe sync failed', error as Error, { productId: product.id });
      }
    }

    // Step 5b: Sync variants to Stripe
    logger.info('Syncing variants to Stripe');
    for (const variant of data.variants) {
      try {
        // Find parent product for pricing
        const parentProduct = data.products.find((p) => p.id === variant.product_id);
        if (!parentProduct) {
          report.stripeErrors.push(`${variant.id}: Parent product not found`);
          continue;
        }

        const variantPrice = parentProduct.base_price + (variant.price_modifier || 0);

        const result = await syncProductToStripe({
          id: variant.id,
          name: `${parentProduct.name} - ${variant.variant_value}`,
          description: `${parentProduct.description} (${variant.variant_value})`,
          basePrice: variantPrice,
          isLive: parentProduct.sell_status === 'for-sale' || parentProduct.sell_status === 'pre-order',
          sellStatus: parentProduct.sell_status || 'internal',
          stripeProductId: variant.stripe_product_id,
        });

        if (result.action === 'created') {
          report.stripeCreated++;
          variant.stripe_product_id = result.stripeProductId;
          modified = true;
        } else if (result.action === 'updated') {
          report.stripeUpdated++;
        } else if (result.action === 'archived') {
          report.stripeArchived++;
          delete variant.stripe_product_id;
          modified = true;
        }

        if (result.error) {
          report.stripeErrors.push(`${variant.id}: ${result.error}`);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        report.stripeErrors.push(`${variant.id}: ${errorMsg}`);
        logger.error('Variant Stripe sync failed', error as Error, { variantId: variant.id });
      }
    }

    logger.info('Stripe sync complete', {
      created: report.stripeCreated,
      updated: report.stripeUpdated,
      archived: report.stripeArchived,
      errors: report.stripeErrors.length,
    });

    // Step 6: Update last_synced_at timestamps (only for successful products)
    const now = new Date().toISOString();
    for (const product of data.products) {
      const hasErrors = report.stripeErrors.some((e) => e.startsWith(`${product.id}:`));
      if (!hasErrors) {
        product.last_synced_at = now;
        modified = true;
      }
    }

    // Step 7: Write updated products.json
    if (modified) {
      logger.info('Writing updated products.json');
      writeFileSync(productsJsonPath, JSON.stringify(data, null, 2), 'utf-8');
      logger.info('products.json updated');
    }

    // Step 8: Sync to database
    logger.info('Syncing to database');
    for (const product of data.products) {
      await syncProductToDb(product, report);
    }

    for (const variant of data.variants) {
      await syncVariantToDb(variant, report);
    }

    // Sync specs and dependencies (reuse existing logic)
    await syncProductSpecs(data, report);
    await syncProductDependencies(data, report);

    // Step 9: Mark products as inactive if removed from products.json
    await markDeletedProductsInactive(data, report);

    logger.info('Database sync complete', {
      synced: report.dbSynced,
      errors: report.dbErrors.length,
    });

    // Print final report
    printReport(report);

    logger.syncComplete('enhanced_product_sync', { report });
    return report;
  } catch (error) {
    logger.syncError('enhanced_product_sync', error as Error);
    throw error;
  }
}

/**
 * Process media files for a product
 */
async function processProductMedia(
  product: any,
  mediaDir: string,
  report: SyncReport
): Promise<boolean> {
  let modified = false;
  const productMediaDir = join(mediaDir, product.id);

  if (!existsSync(productMediaDir)) {
    return false;
  }

  const files = readdirSync(productMediaDir);

  for (const file of files) {
    const fullPath = join(productMediaDir, file);
    const stats = statSync(fullPath);

    // Skip directories (variants handled separately)
    if (stats.isDirectory()) continue;

    const localPath = `${product.id}/${file}`;
    const existingMedia = product.media?.find((m: any) => m.local_path === localPath);

    if (existingMedia?.cloudinary_public_id) {
      report.mediaSkipped++;
      continue;
    }

    // Upload to Cloudinary
    try {
      const fileExt = file.split('.').pop() || '';
      const publicId = `media/products/${product.id}/${file.split('.')[0]}`;
      const resourceType = getResourceType(fileExt);

      const result = await uploadMedia(fullPath, publicId, resourceType);

      // Initialize media array if needed
      if (!product.media) {
        product.media = [];
      }

      // Add or update media entry
      if (!existingMedia) {
        product.media.push({
          local_path: localPath,
          cloudinary_public_id: result.publicId,
          type: getMediaType(result.format),
          mime_type: `${result.resourceType}/${result.format}`,
          alt: `${product.name}`,
          category: 'main',
          order: product.media.length + 1,
          uploaded_at: new Date().toISOString(),
        });
      } else {
        existingMedia.cloudinary_public_id = result.publicId;
        existingMedia.uploaded_at = new Date().toISOString();
      }

      report.mediaUploaded++;
      modified = true;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      report.mediaErrors.push(`${product.id}/${file}: ${errorMsg}`);
      logger.error('Media upload failed', error as Error, {
        productId: product.id,
        file,
      });
    }
  }

  return modified;
}

/**
 * Process media files for a variant
 */
async function processVariantMedia(
  variant: any,
  data: ProductsJson,
  mediaDir: string,
  report: SyncReport
): Promise<boolean> {
  let modified = false;
  const productId = variant.product_id;
  const variantValue = variant.variant_value;

  const variantMediaDir = join(mediaDir, productId, variantValue);

  if (!existsSync(variantMediaDir)) {
    return false;
  }

  const files = readdirSync(variantMediaDir);

  for (const file of files) {
    const fullPath = join(variantMediaDir, file);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) continue;

    const localPath = `${productId}/${variantValue}/${file}`;
    const existingMedia = variant.media?.find((m: any) => m.local_path === localPath);

    if (existingMedia?.cloudinary_public_id) {
      report.mediaSkipped++;
      continue;
    }

    // Upload to Cloudinary
    try {
      const fileExt = file.split('.').pop() || '';
      const publicId = `media/products/${productId}/${variantValue}/${file.split('.')[0]}`;
      const resourceType = getResourceType(fileExt);

      const result = await uploadMedia(fullPath, publicId, resourceType);

      // Initialize media array if needed
      if (!variant.media) {
        variant.media = [];
      }

      // Add or update media entry
      if (!existingMedia) {
        variant.media.push({
          local_path: localPath,
          cloudinary_public_id: result.publicId,
          type: getMediaType(result.format),
          mime_type: `${result.resourceType}/${result.format}`,
          alt: `${variantValue} variant`,
          category: 'main',
          order: variant.media.length + 1,
          uploaded_at: new Date().toISOString(),
        });
      } else {
        existingMedia.cloudinary_public_id = result.publicId;
        existingMedia.uploaded_at = new Date().toISOString();
      }

      report.mediaUploaded++;
      modified = true;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      report.mediaErrors.push(`${productId}/${variantValue}/${file}: ${errorMsg}`);
      logger.error('Variant media upload failed', error as Error, {
        productId,
        variantValue,
        file,
      });
    }
  }

  return modified;
}

/**
 * Cleanup deleted media for a product
 */
async function cleanupDeletedMedia(
  product: any,
  mediaDir: string,
  report: SyncReport
): Promise<boolean> {
  let modified = false;

  if (!product.media || product.media.length === 0) {
    return false;
  }

  for (let i = product.media.length - 1; i >= 0; i--) {
    const mediaItem = product.media[i];
    const fullPath = join(mediaDir, mediaItem.local_path);

    if (!existsSync(fullPath)) {
      // File deleted from disk
      try {
        if (mediaItem.cloudinary_public_id) {
          await deleteMedia(mediaItem.cloudinary_public_id);
          logger.info('Deleted from Cloudinary', {
            publicId: mediaItem.cloudinary_public_id,
          });
        }

        product.media.splice(i, 1);
        report.mediaDeleted++;
        modified = true;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        report.mediaErrors.push(`Cleanup failed for ${mediaItem.local_path}: ${errorMsg}`);
        logger.error('Media cleanup failed', error as Error, {
          localPath: mediaItem.local_path,
        });
      }
    }
  }

  return modified;
}

/**
 * Cleanup deleted media for a variant
 */
async function cleanupDeletedMediaVariant(
  variant: any,
  data: ProductsJson,
  mediaDir: string,
  report: SyncReport
): Promise<boolean> {
  let modified = false;

  if (!variant.media || variant.media.length === 0) {
    return false;
  }

  for (let i = variant.media.length - 1; i >= 0; i--) {
    const mediaItem = variant.media[i];
    const fullPath = join(mediaDir, mediaItem.local_path);

    if (!existsSync(fullPath)) {
      // File deleted from disk
      try {
        if (mediaItem.cloudinary_public_id) {
          await deleteMedia(mediaItem.cloudinary_public_id);
          logger.info('Deleted variant media from Cloudinary', {
            publicId: mediaItem.cloudinary_public_id,
          });
        }

        variant.media.splice(i, 1);
        report.mediaDeleted++;
        modified = true;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        report.mediaErrors.push(`Cleanup failed for ${mediaItem.local_path}: ${errorMsg}`);
        logger.error('Variant media cleanup failed', error as Error, {
          localPath: mediaItem.local_path,
        });
      }
    }
  }

  return modified;
}

/**
 * Sync product to database
 */
async function syncProductToDb(product: any, report: SyncReport): Promise<void> {
  try {
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
        isLive: product.sell_status === 'for-sale' || product.sell_status === 'pre-order',
        sellStatus: product.sell_status || 'internal',
        sellStatusNote: product.sell_status_note || null,
        costCents: product.cost_cents || null,
        wholesalePriceCents: product.wholesale_price_cents || null,
        media: product.media?.map((m: any) => m.cloudinary_public_id).filter(Boolean) || null,
        lastSyncedAt: product.last_synced_at ? new Date(product.last_synced_at) : null,
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
          // NOTE: Don't overwrite soldQuantity on sync
          isLive: product.sell_status === 'for-sale' || product.sell_status === 'pre-order',
          sellStatus: product.sell_status || 'internal',
          sellStatusNote: product.sell_status_note || null,
          costCents: product.cost_cents || null,
          wholesalePriceCents: product.wholesale_price_cents || null,
          media: product.media?.map((m: any) => m.cloudinary_public_id).filter(Boolean) || null,
          lastSyncedAt: product.last_synced_at ? new Date(product.last_synced_at) : null,
        },
      });

    report.dbSynced++;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    report.dbErrors.push(`${product.id}: ${errorMsg}`);
    logger.error('Database sync failed', error as Error, { productId: product.id });
  }
}

/**
 * Sync variant to database
 */
async function syncVariantToDb(variant: any, report: SyncReport): Promise<void> {
  try {
    await db
      .insert(variants)
      .values({
        id: variant.id,
        productId: variant.product_id,
        stripeProductId: variant.stripe_product_id || null,
        variantType: variant.variant_type,
        variantValue: variant.variant_value,
        priceModifier: variant.price_modifier,
        isLimitedEdition: variant.is_limited_edition || false,
        maxQuantity: variant.max_quantity ?? null,
        soldQuantity: 0,
        media: variant.media?.map((m: any) => m.cloudinary_public_id).filter(Boolean) || null,
      })
      .onConflictDoUpdate({
        target: variants.id,
        set: {
          productId: variant.product_id,
          stripeProductId: variant.stripe_product_id || null,
          variantType: variant.variant_type,
          variantValue: variant.variant_value,
          priceModifier: variant.price_modifier,
          isLimitedEdition: variant.is_limited_edition || false,
          maxQuantity: variant.max_quantity ?? null,
          // NOTE: Don't overwrite soldQuantity on sync
          media: variant.media?.map((m: any) => m.cloudinary_public_id).filter(Boolean) || null,
        },
      });

    report.dbSynced++;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    report.dbErrors.push(`${variant.id}: ${errorMsg}`);
    logger.error('Variant database sync failed', error as Error, { variantId: variant.id });
  }
}

/**
 * Sync product specs to database
 */
async function syncProductSpecs(data: ProductsJson, report: SyncReport): Promise<void> {
  for (const product of data.products) {
    if (!product.specs || product.specs.length === 0) continue;

    for (const spec of product.specs) {
      try {
        await db
          .insert(productSpecs)
          .values({
            productId: product.id,
            label: spec.label,
            value: spec.value,
            order: spec.order,
          })
          .onConflictDoNothing();

        report.dbSynced++;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        report.dbErrors.push(`${product.id}/spec/${spec.label}: ${errorMsg}`);
      }
    }
  }
}

/**
 * Sync product dependencies to database
 */
async function syncProductDependencies(data: ProductsJson, report: SyncReport): Promise<void> {
  for (const product of data.products) {
    if (!product.dependencies || product.dependencies.length === 0) continue;

    for (const dep of product.dependencies) {
      try {
        await db
          .insert(productDependencies)
          .values({
            productId: product.id,
            dependsOnProductId: dep.depends_on_product_id,
            dependencyType: dep.dependency_type,
          })
          .onConflictDoNothing();

        report.dbSynced++;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        report.dbErrors.push(`${product.id}/dep/${dep.depends_on_product_id}: ${errorMsg}`);
      }
    }
  }
}

/**
 * Mark products as inactive if removed from products.json
 */
async function markDeletedProductsInactive(data: ProductsJson, report: SyncReport): Promise<void> {
  try {
    const activeProductIds = data.products.map((p) => p.id);

    if (activeProductIds.length === 0) {
      // If no products in JSON, mark all as inactive
      await db.update(products).set({ isActive: false });
      logger.info('Marked all products as inactive (no products in JSON)');
      return;
    }

    // Mark products as inactive if they're not in the products.json file
    const result = await db
      .update(products)
      .set({ isActive: false })
      .where(notInArray(products.id, activeProductIds));

    logger.info('Marked deleted products as inactive', {
      activeProductIds,
      deletedCount: result.rowCount || 0,
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    report.dbErrors.push(`Failed to mark deleted products inactive: ${errorMsg}`);
    logger.error('Failed to mark deleted products inactive', error as Error);
  }
}

/**
 * Helper: Get Cloudinary resource type from file extension
 */
function getResourceType(ext: string): 'image' | 'video' | 'raw' {
  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
  const videoExts = ['mp4', 'mov', 'avi', 'webm'];

  const lowerExt = ext.toLowerCase();

  if (imageExts.includes(lowerExt)) return 'image';
  if (videoExts.includes(lowerExt)) return 'video';
  return 'raw'; // PDFs, etc.
}

/**
 * Helper: Get media type from format
 */
function getMediaType(format: string): 'image' | 'video' | 'pdf' | 'other' {
  const imageFormats = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
  const videoFormats = ['mp4', 'mov', 'avi', 'webm'];

  const lowerFormat = format.toLowerCase();

  if (imageFormats.includes(lowerFormat)) return 'image';
  if (videoFormats.includes(lowerFormat)) return 'video';
  if (lowerFormat === 'pdf') return 'pdf';
  return 'other';
}

/**
 * Print sync report
 */
function printReport(report: SyncReport): void {
  console.log('\n📊 Sync Report\n');

  console.log('Media:');
  console.log(`  Uploaded: ${report.mediaUploaded}`);
  console.log(`  Skipped: ${report.mediaSkipped}`);
  console.log(`  Deleted: ${report.mediaDeleted}`);
  console.log(`  Errors: ${report.mediaErrors.length}`);

  console.log('\nStripe:');
  console.log(`  Created: ${report.stripeCreated}`);
  console.log(`  Updated: ${report.stripeUpdated}`);
  console.log(`  Archived: ${report.stripeArchived}`);
  console.log(`  Errors: ${report.stripeErrors.length}`);

  console.log('\nDatabase:');
  console.log(`  Synced: ${report.dbSynced}`);
  console.log(`  Errors: ${report.dbErrors.length}`);

  if (report.mediaErrors.length > 0) {
    console.log('\n⚠️  Media Errors:');
    report.mediaErrors.forEach((e) => console.log(`  - ${e}`));
  }

  if (report.stripeErrors.length > 0) {
    console.log('\n⚠️  Stripe Errors:');
    report.stripeErrors.forEach((e) => console.log(`  - ${e}`));
  }

  if (report.dbErrors.length > 0) {
    console.log('\n⚠️  Database Errors:');
    report.dbErrors.forEach((e) => console.log(`  - ${e}`));
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const customProductsPath = process.argv[2];
  const customMediaDir = process.argv[3];

  syncProductsEnhanced(customProductsPath, customMediaDir)
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Sync failed', error as Error);
      process.exit(1);
    });
}
