# Phase 2.4.6 - Product Data Normalization & Multi-System Sync

**Type:** Infrastructure Enhancement - Data Management
**Priority:** HIGH - Foundation for content management
**Status:** Planning
**Estimated Effort:** 12-16 hours (2-3 days)
**Dependencies:** Phase 2.4 (Checkout), Phase 2.4.5 (Inventory)

---

## Overview

Establish `config/content/products.json` as the single source of truth for product data, synchronizing to PostgreSQL, Stripe, and Cloudinary. This phase adds comprehensive product lifecycle management, media handling, and pricing tiers.

### Goals

1. **Media Management:** Local media files → Cloudinary with bidirectional reference tracking
2. **Stripe Synchronization:** Create/update/archive products based on sell status
3. **Enhanced Product Schema:** Add lifecycle status, pricing tiers, and sync tracking
4. **Automated Sync:** Single command synchronizes all systems

### Architecture Philosophy

```
products.json (Source of Truth)
    ↓
[Sync Script]
    ↓
    ├─→ Cloudinary (Media)
    ├─→ Stripe (Products/Prices)
    └─→ PostgreSQL (Normalized Data)
```

**Key Principle:** Script modifies products.json with generated IDs (Cloudinary public IDs, Stripe product IDs). These changes are committed to Git, maintaining full traceability.

---

## Schema Changes

### 1. Directory Restructure

**Move products.json:**
```
OLD: config/products.json
NEW: config/content/products.json
```

**New media directory:**
```
config/content/media/
├── Material-8x8-V/
│   ├── main.jpg
│   ├── detail-1.jpg
│   └── dimension-diagram.pdf
├── Unit-8x8x8-Founder/
│   ├── main.jpg                    # Parent product media
│   ├── lifestyle-shared.jpg
│   ├── BLACK/                      # Variant subfolder
│   │   ├── main.jpg                # BLACK variant-specific media
│   │   └── detail-black.jpg
│   ├── WHITE/                      # WHITE variant subfolder
│   │   ├── main.jpg
│   │   └── detail-white.jpg
│   └── RED/                        # RED variant subfolder
│       └── main.jpg
└── Connect-4x31.6-5v/
    └── main.jpg
```

**Note:** Variants store their own media in subfolders under the parent product directory. UI can optionally show parent product images as fallback when displaying variant detail pages.

### 2. Products.json Schema Updates

**New fields for products:**

```json
{
  "id": "Material-8x8-V",
  "name": "8x8 Void Panel",

  // EXISTING FIELDS
  "description": "...",
  "long_description": "...",
  "category": "material",
  "dev_status": 5,
  "base_price": 3500,
  "stripe_product_id": "prod_TFqJ6019ONDct2",
  "has_variants": false,
  "requires_assembly": false,
  "max_quantity": null,

  // NEW FIELDS
  "is_live": true,                           // Manual flag: show on site?
  "cost_cents": 2000,                        // Manufacturing cost
  "wholesale_price_cents": 2800,             // B2B pricing (internal)
  "sell_status": "for-sale",                 // "for-sale" | "pre-order" | "sold-out" | "internal"
  "sell_status_note": "Shipping Dec 1, 2025", // Nullable, free text
  "last_synced_at": "2025-10-28T14:30:00Z",  // ISO timestamp

  // RENAMED: images → media (support PDFs, videos, etc.)
  "media": [
    {
      "local_path": "Material-8x8-V/main.jpg",
      "cloudinary_public_id": "media/products/Material-8x8-V/main", // Set by sync script
      "type": "image",                        // "image" | "video" | "pdf" | "other"
      "mime_type": "image/jpeg",
      "alt": "8x8 Void Panel - Front View",
      "category": "main",                     // "main" | "detail" | "lifestyle" | "dimension" | "spec"
      "order": 1,
      "uploaded_at": "2025-10-28T14:30:00Z"   // Set by sync script
    }
  ],

  "specs": [...],
  "metadata": {...}
}
```

**New fields for variants:**

```json
{
  "id": "Unit-8x8x8-Founder-Black",
  "product_id": "Unit-8x8x8-Founder",

  // EXISTING FIELDS
  "stripe_product_id": "prod_founder_black",
  "variant_type": "color",
  "variant_value": "BLACK",
  "price_modifier": 0,
  "is_limited_edition": true,
  "max_quantity": 500,

  // NEW FIELD (replaces "images")
  "media": [
    {
      "local_path": "Unit-8x8x8-Founder/BLACK/main.jpg",           // Subfolder path
      "cloudinary_public_id": "media/products/Unit-8x8x8-Founder/BLACK/main",
      "type": "image",
      "mime_type": "image/jpeg",
      "alt": "Founder Edition Cube - Black",
      "category": "main",
      "order": 1,
      "uploaded_at": "2025-10-28T14:30:00Z"
    },
    {
      "local_path": "Unit-8x8x8-Founder/BLACK/detail-black.jpg",   // Subfolder path
      "cloudinary_public_id": "media/products/Unit-8x8x8-Founder/BLACK/detail-black",
      "type": "image",
      "mime_type": "image/jpeg",
      "alt": "Founder Edition Cube - Black Detail",
      "category": "detail",
      "order": 2,
      "uploaded_at": "2025-10-28T14:30:00Z"
    }
  ],

  "metadata": {...}
}
```

### 3. Database Schema Updates

**Add columns to `products` table:**

```typescript
// db/schema.ts
export const products = pgTable("products", {
  // ... existing fields ...

  // NEW FIELDS
  isLive: boolean("is_live").default(false),
  costCents: integer("cost_cents"), // Nullable
  wholesalePriceCents: integer("wholesale_price_cents"), // Nullable
  sellStatus: text("sell_status").default("internal"), // enum in validation
  sellStatusNote: text("sell_status_note"),
  lastSyncedAt: timestamp("last_synced_at"),

  // Media stored as array of Cloudinary public IDs
  media: jsonb("media"), // ["media/products/Material-8x8-V/main", ...]
});
```

**Add columns to `variants` table:**

```typescript
export const variants = pgTable("variants", {
  // ... existing fields ...

  // NEW FIELD
  media: jsonb("media"), // ["media/products/Unit-8x8x8-Founder/BLACK/main", ...]
});
```

### 4. TypeScript Type Updates

**Update `types/product.ts`:**

```typescript
export interface Product {
  // ... existing fields ...

  // NEW FIELDS
  isLive: boolean;
  costCents?: number;
  wholesalePriceCents?: number;
  sellStatus: "for-sale" | "pre-order" | "sold-out" | "internal";
  sellStatusNote?: string;
  lastSyncedAt?: Date;
  media: MediaItem[];
}

export interface MediaItem {
  localPath: string;
  cloudinaryPublicId?: string; // Set after upload
  type: "image" | "video" | "pdf" | "other";
  mimeType: string;
  alt: string;
  category: "main" | "detail" | "lifestyle" | "dimension" | "spec";
  order: number;
  uploadedAt?: Date; // Set after upload
}

export interface Variant {
  // ... existing fields ...
  media: MediaItem[];
}
```

### 5. Zod Schema Validation Updates

**Update `config/schema.ts`:**

```typescript
const MediaItemSchema = z.object({
  local_path: z.string(),
  cloudinary_public_id: z.string().optional(),
  type: z.enum(["image", "video", "pdf", "other"]),
  mime_type: z.string(),
  alt: z.string(),
  category: z.enum(["main", "detail", "lifestyle", "dimension", "spec"]),
  order: z.number().int().positive(),
  uploaded_at: z.string().datetime().optional(),
});

const ProductSchema = z.object({
  // ... existing fields ...

  is_live: z.boolean().default(false),
  cost_cents: z.number().int().positive().optional(),
  wholesale_price_cents: z.number().int().positive().optional(),
  sell_status: z.enum(["for-sale", "pre-order", "sold-out", "internal"]).default("internal"),
  sell_status_note: z.string().optional(),
  last_synced_at: z.string().datetime().optional(),
  media: z.array(MediaItemSchema).default([]),
});

const VariantSchema = z.object({
  // ... existing fields ...
  media: z.array(MediaItemSchema).default([]),
});
```

---

## Implementation Plan

### Task 1: Schema Migration

**Files to modify:**
- `config/content/products.json` (move + update)
- `config/schema.ts` (Zod validation)
- `db/schema.ts` (PostgreSQL columns)
- `types/product.ts` (TypeScript interfaces)
- `lib/mappers/product-mapper.ts` (handle new fields)
- `lib/mappers/variant-mapper.ts` (handle new fields)

**Migration script:**
```bash
# Create migration
npx drizzle-kit generate:pg
# Apply migration
npm run db:push
```

**Update existing products.json:**
- Add default values for new fields
- Rename `images` → `media` (empty arrays for now)
- Set `is_live: true` for products with `dev_status: 5`
- Set `sell_status: "for-sale"` for active products

### Task 2: Cloudinary Integration

**Create Cloudinary service:**

```typescript
// lib/services/cloudinary-service.ts
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface UploadResult {
  publicId: string;
  url: string;
  secureUrl: string;
  format: string;
  resourceType: string;
}

export async function uploadMedia(
  localFilePath: string,
  publicId: string,
  resourceType: 'image' | 'video' | 'raw' = 'image'
): Promise<UploadResult> {
  const result = await cloudinary.uploader.upload(localFilePath, {
    public_id: publicId,
    resource_type: resourceType,
    overwrite: false, // Don't re-upload if exists
  });

  return {
    publicId: result.public_id,
    url: result.url,
    secureUrl: result.secure_url,
    format: result.format,
    resourceType: result.resource_type,
  };
}

export async function checkMediaExists(publicId: string): Promise<boolean> {
  try {
    await cloudinary.api.resource(publicId);
    return true;
  } catch (error) {
    return false;
  }
}

export async function deleteMedia(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}
```

**Create Cloudinary helper utility:**

```typescript
// lib/utils/cloudinary.ts
export const CLOUDINARY_BASE_URL = 'https://res.cloudinary.com/imajin-ai';
export const CLOUDINARY_UPLOAD_PATH = 'image/upload';

export function getCloudinaryUrl(
  publicId: string,
  options?: {
    width?: number;
    height?: number;
    crop?: 'fill' | 'fit' | 'scale';
    quality?: 'auto' | number;
    format?: 'auto' | 'jpg' | 'png' | 'webp';
  }
): string {
  const transformations = [];

  if (options?.width) transformations.push(`w_${options.width}`);
  if (options?.height) transformations.push(`h_${options.height}`);
  if (options?.crop) transformations.push(`c_${options.crop}`);
  if (options?.quality) transformations.push(`q_${options.quality}`);
  if (options?.format) transformations.push(`f_${options.format}`);

  const transformString = transformations.length > 0
    ? transformations.join(',') + '/'
    : 'v1/';

  return `${CLOUDINARY_BASE_URL}/${CLOUDINARY_UPLOAD_PATH}/${transformString}${publicId}`;
}
```

**Install Cloudinary SDK:**
```bash
npm install cloudinary
npm install --save-dev @types/cloudinary
```

### Task 3: Stripe Synchronization Service

**Context:** Test Stripe environment is currently empty. All products will be created fresh.

**Create Stripe sync service:**

```typescript
// lib/services/stripe-sync-service.ts
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

export interface StripeSyncResult {
  productId: string;
  action: 'created' | 'updated' | 'archived' | 'skipped';
  stripeProductId?: string;
  stripePriceId?: string;
  error?: string;
}

export async function syncProductToStripe(
  product: {
    id: string;
    name: string;
    description: string;
    basePrice: number;
    isLive: boolean;
    sellStatus: string;
    stripeProductId?: string;
  }
): Promise<StripeSyncResult> {
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
    // UPDATE existing
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
    // CREATE new
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
}
```

### Task 4: Enhanced Sync Script

**Create comprehensive sync script:**

```typescript
// scripts/sync-products-enhanced.ts
#!/usr/bin/env tsx

import { db } from '@/db';
import { products, variants, productSpecs, productDependencies } from '@/db/schema';
import { ProductsJsonSchema } from '@/config/schema';
import { uploadMedia, checkMediaExists, deleteMedia } from '@/lib/services/cloudinary-service';
import { syncProductToStripe } from '@/lib/services/stripe-sync-service';
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join } from 'path';
import { eq } from 'drizzle-orm';

const PRODUCTS_JSON_PATH = join(process.cwd(), 'config', 'content', 'products.json');
const MEDIA_DIR = join(process.cwd(), 'config', 'content', 'media');

interface SyncReport {
  mediaUploaded: number;
  mediaSkipped: number;
  mediaDeleted: number;        // NEW: Cleanup count
  mediaErrors: string[];
  stripeCreated: number;
  stripeUpdated: number;
  stripeArchived: number;
  stripeErrors: string[];
  dbSynced: number;
  dbErrors: string[];
}

async function syncProducts() {
  console.log('🔄 Starting comprehensive product sync...\n');

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

  // Partial failure strategy:
  // - Each product syncs independently
  // - Errors logged but don't stop processing
  // - Products with errors won't update last_synced_at
  // - Re-running targets products with old/missing sync dates

  // Step 1: Load products.json
  console.log('📄 Loading config/content/products.json...');
  const fileContent = readFileSync(PRODUCTS_JSON_PATH, 'utf-8');
  const data = JSON.parse(fileContent);

  const validation = ProductsJsonSchema.safeParse(data);
  if (!validation.success) {
    console.error('❌ Validation failed:', validation.error.format());
    throw new Error('Invalid products.json');
  }

  console.log(`  ✅ Loaded ${data.products.length} products\n`);

  let modified = false;

  // Step 2: Process media files
  console.log('📸 Processing media files...');
  for (const product of data.products) {
    await processProductMedia(product, report);
    modified = true;
  }

  for (const variant of data.variants) {
    await processVariantMedia(variant, report);
    modified = true;
  }

  // Step 2b: Cleanup deleted media (files removed from disk)
  console.log('🗑️  Checking for deleted media...');
  for (const product of data.products) {
    await cleanupDeletedMedia(product, report);
  }
  for (const variant of data.variants) {
    await cleanupDeletedMedia(variant, report);
  }

  console.log(`  ✅ Uploaded: ${report.mediaUploaded}, Skipped: ${report.mediaSkipped}\n`);

  // Step 3: Sync to Stripe
  console.log('💳 Syncing to Stripe...');
  for (const product of data.products) {
    const result = await syncProductToStripe({
      id: product.id,
      name: product.name,
      description: product.description,
      basePrice: product.base_price,
      isLive: product.is_live,
      sellStatus: product.sell_status,
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
  }

  console.log(`  ✅ Created: ${report.stripeCreated}, Updated: ${report.stripeUpdated}, Archived: ${report.stripeArchived}\n`);

  // Step 4: Update last_synced_at (only for successful syncs)
  const now = new Date().toISOString();
  for (const product of data.products) {
    // Only update timestamp if no errors for this product
    const hasErrors = report.stripeErrors.some(e => e.startsWith(`${product.id}:`));
    if (!hasErrors) {
      product.last_synced_at = now;
      modified = true;
    }
  }

  // Step 5: Write updated products.json
  if (modified) {
    console.log('💾 Writing updated products.json...');
    writeFileSync(
      PRODUCTS_JSON_PATH,
      JSON.stringify(data, null, 2),
      'utf-8'
    );
    console.log('  ✅ products.json updated\n');
  }

  // Step 6: Sync to database
  console.log('🗄️  Syncing to database...');
  for (const product of data.products) {
    await syncProductToDb(product, report);
  }

  for (const variant of data.variants) {
    await syncVariantToDb(variant, report);
  }

  console.log(`  ✅ Synced ${report.dbSynced} records\n`);

  // Step 7: Print report
  printReport(report);
}

async function processProductMedia(product: any, report: SyncReport) {
  // Scan media directory for this product
  const productMediaDir = join(MEDIA_DIR, product.id);

  // Check if directory exists
  if (!existsSync(productMediaDir)) {
    return;
  }

  // Get all files in directory
  const files = readdirSync(productMediaDir);

  for (const file of files) {
    const localPath = `${product.id}/${file}`;
    const fullPath = join(productMediaDir, file);

    // Check if file stats (skip directories - variants handled separately)
    const stats = statSync(fullPath);
    if (stats.isDirectory()) continue;

    // Check if already in products.json
    const existingMedia = product.media.find((m: any) => m.local_path === localPath);

    if (existingMedia && existingMedia.cloudinary_public_id) {
      // Already uploaded, skip
      report.mediaSkipped++;
      continue;
    }

    // Upload to Cloudinary
    try {
      const publicId = `media/products/${product.id}/${file.split('.')[0]}`;
      const result = await uploadMedia(fullPath, publicId);

      // Add to products.json media array
      if (!existingMedia) {
        product.media.push({
          local_path: localPath,
          cloudinary_public_id: result.publicId,
          type: getMediaType(result.format),
          mime_type: `${result.resourceType}/${result.format}`,
          alt: `${product.name}`,
          category: 'main', // Default, can be updated manually
          order: product.media.length + 1,
          uploaded_at: new Date().toISOString(),
        });
      } else {
        // Update existing entry
        existingMedia.cloudinary_public_id = result.publicId;
        existingMedia.uploaded_at = new Date().toISOString();
      }

      report.mediaUploaded++;
    } catch (error) {
      report.mediaErrors.push(`${product.id}/${file}: ${error}`);
    }
  }
}

async function processVariantMedia(variant: any, report: SyncReport) {
  // Variants are in subfolders: Unit-8x8x8-Founder/BLACK/
  // Extract parent product ID and variant value from variant.id
  const productId = variant.product_id;
  const variantValue = variant.variant_value;

  const variantMediaDir = join(MEDIA_DIR, productId, variantValue);

  // Check if directory exists
  if (!existsSync(variantMediaDir)) {
    return;
  }

  // Get all files in variant subfolder
  const files = readdirSync(variantMediaDir);

  for (const file of files) {
    const localPath = `${productId}/${variantValue}/${file}`;
    const fullPath = join(variantMediaDir, file);

    // Check if file stats (not directory)
    const stats = statSync(fullPath);
    if (stats.isDirectory()) continue;

    // Check if already in products.json
    const existingMedia = variant.media.find((m: any) => m.local_path === localPath);

    if (existingMedia && existingMedia.cloudinary_public_id) {
      // Already uploaded, skip
      report.mediaSkipped++;
      continue;
    }

    // Upload to Cloudinary
    try {
      const publicId = `media/products/${productId}/${variantValue}/${file.split('.')[0]}`;
      const result = await uploadMedia(fullPath, publicId);

      // Add to variant media array
      if (!existingMedia) {
        variant.media.push({
          local_path: localPath,
          cloudinary_public_id: result.publicId,
          type: getMediaType(result.format),
          mime_type: `${result.resourceType}/${result.format}`,
          alt: `${variant.variant_value} variant`,
          category: 'main', // Default, can be updated manually
          order: variant.media.length + 1,
          uploaded_at: new Date().toISOString(),
        });
      } else {
        // Update existing entry
        existingMedia.cloudinary_public_id = result.publicId;
        existingMedia.uploaded_at = new Date().toISOString();
      }

      report.mediaUploaded++;
    } catch (error) {
      report.mediaErrors.push(`${productId}/${variantValue}/${file}: ${error}`);
    }
  }
}

async function cleanupDeletedMedia(entity: any, report: SyncReport) {
  // entity can be product or variant
  const mediaDir = join(MEDIA_DIR, entity.id);

  // Check each media entry in JSON
  for (let i = entity.media.length - 1; i >= 0; i--) {
    const mediaItem = entity.media[i];
    const fullPath = join(process.cwd(), 'config', 'content', 'media', mediaItem.local_path);

    // Check if file still exists on disk
    if (!existsSync(fullPath)) {
      // File deleted - cleanup Cloudinary and JSON
      try {
        if (mediaItem.cloudinary_public_id) {
          await deleteMedia(mediaItem.cloudinary_public_id);
          console.log(`  🗑️  Deleted from Cloudinary: ${mediaItem.cloudinary_public_id}`);
        }

        // Remove from JSON array
        entity.media.splice(i, 1);
        console.log(`  🗑️  Removed from JSON: ${mediaItem.local_path}`);
        report.mediaDeleted++;
      } catch (error) {
        report.mediaErrors.push(`Cleanup failed for ${mediaItem.local_path}: ${error}`);
      }
    }
  }
}

function getMediaType(format: string): 'image' | 'video' | 'pdf' | 'other' {
  const imageFormats = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
  const videoFormats = ['mp4', 'mov', 'avi', 'webm'];

  if (imageFormats.includes(format.toLowerCase())) return 'image';
  if (videoFormats.includes(format.toLowerCase())) return 'video';
  if (format.toLowerCase() === 'pdf') return 'pdf';
  return 'other';
}

async function syncProductToDb(product: any, report: SyncReport) {
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

        // NEW FIELDS
        isLive: product.is_live,
        costCents: product.cost_cents ?? null,
        wholesalePriceCents: product.wholesale_price_cents ?? null,
        sellStatus: product.sell_status,
        sellStatusNote: product.sell_status_note ?? null,
        lastSyncedAt: product.last_synced_at ? new Date(product.last_synced_at) : null,
        media: product.media.map((m: any) => m.cloudinary_public_id).filter(Boolean),
      })
      .onConflictDoUpdate({
        target: products.id,
        set: {
          name: product.name,
          description: product.description,
          category: product.category,
          devStatus: product.dev_status,
          basePrice: product.base_price,
          hasVariants: product.has_variants,
          maxQuantity: product.max_quantity ?? null,
          isLive: product.is_live,
          costCents: product.cost_cents ?? null,
          wholesalePriceCents: product.wholesale_price_cents ?? null,
          sellStatus: product.sell_status,
          sellStatusNote: product.sell_status_note ?? null,
          lastSyncedAt: product.last_synced_at ? new Date(product.last_synced_at) : null,
          media: product.media.map((m: any) => m.cloudinary_public_id).filter(Boolean),
        },
      });

    report.dbSynced++;
  } catch (error) {
    report.dbErrors.push(`${product.id}: ${error}`);
  }
}

function printReport(report: SyncReport) {
  console.log('📊 Sync Report\n');
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
    report.mediaErrors.forEach(e => console.log(`  - ${e}`));
  }

  if (report.stripeErrors.length > 0) {
    console.log('\n⚠️  Stripe Errors:');
    report.stripeErrors.forEach(e => console.log(`  - ${e}`));
  }

  if (report.dbErrors.length > 0) {
    console.log('\n⚠️  Database Errors:');
    report.dbErrors.forEach(e => console.log(`  - ${e}`));
  }
}

syncProducts().catch(console.error);
```

**Add to package.json:**
```json
{
  "scripts": {
    "sync:products": "tsx scripts/sync-products-enhanced.ts"
  }
}
```

### Task 5: Update Product Display Logic

**Filter products for display:**

```typescript
// lib/utils/product-filters.ts
export function shouldShowProduct(product: Product): boolean {
  return (
    product.isLive &&
    product.sellStatus !== 'internal'
  );
}

// Helper: Check if product is ready for development (separate from display logic)
export function isProductReady(product: Product): boolean {
  return product.devStatus === 5;
}

export function getProductDisplayStatus(product: Product): {
  label: string;
  canPurchase: boolean;
  note?: string;
} {
  switch (product.sellStatus) {
    case 'for-sale':
      return { label: 'In Stock', canPurchase: true };
    case 'pre-order':
      return {
        label: 'Pre-Order',
        canPurchase: true,
        note: product.sellStatusNote
      };
    case 'sold-out':
      return {
        label: 'Sold Out',
        canPurchase: false,
        note: product.sellStatusNote
      };
    case 'internal':
      return { label: 'Not Available', canPurchase: false };
    default:
      return { label: 'Unavailable', canPurchase: false };
  }
}
```

**Update ProductCard component:**

```typescript
// components/products/ProductCard.tsx
import { getCloudinaryUrl } from '@/lib/utils/cloudinary';
import { getProductDisplayStatus } from '@/lib/utils/product-filters';

// Use first media item as card image
const mainImage = product.media.find(m => m.category === 'main') || product.media[0];
const imageUrl = mainImage
  ? getCloudinaryUrl(mainImage.cloudinaryPublicId, { width: 400, quality: 'auto' })
  : '/images/placeholder.jpg';

const displayStatus = getProductDisplayStatus(product);

// Show status badge
{displayStatus.label !== 'In Stock' && (
  <Badge variant={displayStatus.canPurchase ? 'warning' : 'error'}>
    {displayStatus.label}
  </Badge>
)}

// Disable "Add to Cart" if can't purchase
<AddToCartButton
  disabled={!displayStatus.canPurchase}
  product={product}
/>
```

---

## Testing Strategy

### Unit Tests

**Test files to create:**
- `tests/unit/lib/services/cloudinary-service.test.ts` (20 tests)
- `tests/unit/lib/services/stripe-sync-service.test.ts` (25 tests)
- `tests/unit/lib/utils/product-filters.test.ts` (15 tests)
- `tests/unit/lib/mappers/product-mapper.test.ts` (update existing, +10 tests)

**Key test scenarios:**
- Cloudinary upload (success, duplicate, failure)
- Stripe product create/update/archive
- Stripe price changes (immutable price handling)
- Product display filtering (is_live + sell_status)
- Media array mapping (JSON to DB and back)

### Integration Tests

**Test files to create:**
- `tests/integration/sync-products-enhanced.test.ts` (30 tests)

**Key scenarios:**
- Full sync flow (media → Stripe → DB)
- Error recovery (Cloudinary fails, Stripe succeeds, DB updates)
- Idempotency (run twice, same result)
- Archive "internal" products in Stripe
- Update products.json with generated IDs

### Manual Testing Checklist

- [ ] Move products.json to config/content/
- [ ] Add media files to config/content/media/[PRODUCT_ID]/
- [ ] Run `npm run sync:products`
- [ ] Verify Cloudinary uploads
- [ ] Verify Stripe products created
- [ ] Verify database updated
- [ ] Verify products.json updated with IDs
- [ ] Check product pages display images
- [ ] Verify "sold-out" products show correct status
- [ ] Verify "internal" products don't appear on site

---

## Acceptance Criteria

### Schema & Migration
- [ ] products.json moved to config/content/
- [ ] All new fields added to products.json with defaults
- [ ] Database migration applied successfully
- [ ] TypeScript types updated
- [ ] Zod schemas updated
- [ ] All mappers handle new fields

### Cloudinary Integration
- [ ] Cloudinary service created with upload/check/delete functions
- [ ] Media scanned from config/content/media/
- [ ] Media uploaded to Cloudinary with correct folder structure
- [ ] products.json updated with cloudinary_public_id
- [ ] Helper utility generates correct URLs with transformations
- [ ] ProductCard displays Cloudinary images

### Stripe Synchronization
- [ ] Stripe sync service created
- [ ] "Internal" products archived in Stripe
- [ ] "Internal" products have stripe_product_id removed
- [ ] Non-internal products created if missing
- [ ] Non-internal products updated if exists
- [ ] Price changes create new Stripe Prices
- [ ] products.json updated with stripe_product_id

### Sync Script
- [ ] Single command runs full sync: `npm run sync:products`
- [ ] Script is idempotent (safe to re-run)
- [ ] Generates comprehensive sync report
- [ ] Updates last_synced_at timestamps
- [ ] Writes updated products.json to disk
- [ ] Handles errors gracefully (doesn't crash)

### Product Display
- [ ] Products filtered by is_live + sell_status
- [ ] "sold-out" products show badge + note
- [ ] "pre-order" products show badge + ship date
- [ ] "internal" products don't appear on site
- [ ] Add to Cart disabled for non-purchasable products

### Testing
- [ ] 60+ new tests passing
- [ ] All existing tests still pass (775/778)
- [ ] TypeScript: 0 errors
- [ ] Lint: 0 errors

### Documentation
- [ ] Update IMPLEMENTATION_PLAN.md with Phase 2.4.6 checkbox
- [ ] Update DATABASE_SCHEMA.md with new columns
- [ ] Update JSON_CONFIG_STRUCTURE.md with new fields
- [ ] Add inline code comments for sync logic

---

## Rollout Plan

### Phase 0: Structured Logging Setup (2-3 hours) - PREREQUISITE

**Goal:** Replace console.log/console.error with structured logging before building sync infrastructure.

**Problem:** Current code has excessive console.error/console.log scattered throughout. This creates:
- Hard to filter logs in production
- No structured metadata
- Difficult to trace request flows
- Can't easily send to logging services later

**Solution:** Lightweight structured logger with proper levels and metadata.

**TDD Approach: Write tests first, then implement.**

**0.1 Write Logger Tests (RED)**
- [ ] Create `tests/unit/lib/utils/logger.test.ts`
  - Test all log levels (debug, info, warn, error)
  - Test metadata formatting
  - Test error serialization
  - Verify JSON output structure
  - Test sync-specific helpers
  - Test environment-based debug filtering
  - ~15 tests (see Test Specification section below)
- [ ] Run tests: `npm test` - **EXPECT FAILURES** (logger doesn't exist yet)

**0.2 Create Logger Utility (GREEN)**
- [ ] Create `lib/utils/logger.ts`
  ```typescript
  type LogLevel = 'debug' | 'info' | 'warn' | 'error';
  type LogMeta = Record<string, unknown>;

  interface LogEntry {
    level: LogLevel;
    message: string;
    timestamp: string;
    meta?: LogMeta;
    error?: {
      message: string;
      stack?: string;
      name: string;
    };
  }

  class Logger {
    private formatLog(level: LogLevel, message: string, meta?: LogMeta, error?: Error): LogEntry {
      const entry: LogEntry = {
        level,
        message,
        timestamp: new Date().toISOString(),
      };

      if (meta) entry.meta = meta;

      if (error) {
        entry.error = {
          message: error.message,
          stack: error.stack,
          name: error.name,
        };
      }

      return entry;
    }

    debug(message: string, meta?: LogMeta) {
      if (process.env.NODE_ENV === 'development') {
        console.debug(JSON.stringify(this.formatLog('debug', message, meta)));
      }
    }

    info(message: string, meta?: LogMeta) {
      console.info(JSON.stringify(this.formatLog('info', message, meta)));
    }

    warn(message: string, meta?: LogMeta) {
      console.warn(JSON.stringify(this.formatLog('warn', message, meta)));
    }

    error(message: string, error?: Error, meta?: LogMeta) {
      console.error(JSON.stringify(this.formatLog('error', message, meta, error)));
    }

    // Sync-specific helpers
    syncStart(operation: string, meta?: LogMeta) {
      this.info(`Sync started: ${operation}`, meta);
    }

    syncComplete(operation: string, meta?: LogMeta) {
      this.info(`Sync completed: ${operation}`, meta);
    }

    syncError(operation: string, error: Error, meta?: LogMeta) {
      this.error(`Sync failed: ${operation}`, error, meta);
    }
  }

  export const logger = new Logger();
  ```

- [ ] Run tests: `npm test` - **EXPECT PASSING** (all 15 tests green)

**0.3 Refactor Logger (REFACTOR)**
- [ ] Review code for clarity and maintainability
- [ ] Extract constants if needed
- [ ] Add JSDoc comments
- [ ] Run tests: `npm test` - **MUST STAY GREEN**

**0.4 Update Existing Code**
- [ ] Replace console.error in existing services with logger.error
- [ ] Replace console.log in existing services with logger.info
- [ ] Update error handling patterns:
  ```typescript
  // OLD
  catch (error) {
    console.error('Upload failed:', error);
  }

  // NEW
  catch (error) {
    logger.error('Upload failed', error as Error, {
      operation: 'cloudinary_upload',
      publicId: publicId
    });
  }
  ```

- [ ] Run tests: `npm test` - **MUST STAY GREEN** (verify no regressions)

**0.5 Documentation**
- [ ] Add logger usage examples to sync scripts
- [ ] Document when to use each log level:
  - `debug`: Development-only detailed traces
  - `info`: Normal operational messages
  - `warn`: Recoverable issues, deprecation notices
  - `error`: Failures requiring attention

**Phase 0 Gate Criteria:**
- [ ] All 15 logger tests passing
- [ ] All existing tests still passing (775/778 → should remain stable)
- [ ] No console.log/console.error remaining in services
- [ ] TypeScript: 0 errors
- [ ] Lint: 0 errors

**Deliverables:**
- Structured logger utility with tests
- All existing console.log/error replaced
- Consistent logging patterns established
- 15 logger tests passing
- Ready for Phase 1 (Connection Setup)

**Future enhancements (Phase 4.1):**
- Add log transports (file, external service)
- Add request tracing/correlation IDs
- Add log aggregation (Datadog, LogRocket, etc.)
- Add performance metrics

---

### Phase 1: Connection Setup & Validation (Day 1 Morning, 3-4 hours)

**Goal:** Establish and test external service connections before building anything.

**TDD Approach: Write tests first, implement services, then validate manually.**

**1.1 Write Cloudinary Service Tests (RED)**
- [ ] Install Cloudinary SDK: `npm install cloudinary @types/cloudinary`
- [ ] Create `tests/unit/lib/services/cloudinary-service.test.ts`
  - Test uploadMedia() success
  - Test uploadMedia() duplicate handling (overwrite: false)
  - Test uploadMedia() with different resource types (image, video, raw)
  - Test uploadMedia() failure (network error)
  - Test uploadMedia() invalid path
  - Test checkMediaExists() returns true for existing
  - Test checkMediaExists() returns false for missing
  - Test checkMediaExists() handles API errors
  - Test deleteMedia() success
  - Test deleteMedia() idempotency (deleting non-existent)
  - ~20 tests total (see Test Specification section)
- [ ] Run tests: `npm test` - **EXPECT FAILURES** (service doesn't exist yet)

**1.2 Implement Cloudinary Service (GREEN)**
- [ ] Create `lib/services/cloudinary-service.ts`
- [ ] Implement `uploadMedia()`, `checkMediaExists()`, `deleteMedia()` functions
- [ ] Use logger for error tracking (not console.log)
- [ ] Run tests: `npm test` - **EXPECT PASSING** (all 20 tests green)

**1.3 Manual Validation Script**
- [ ] Create test script: `scripts/tools/test-cloudinary.ts`
  ```typescript
  // Upload test image
  // Check it exists
  // Delete it
  // Verify deletion
  ```
- [ ] Run test script manually with real credentials
- [ ] Verify uploads appear in Cloudinary dashboard
- [ ] Test folder structure: `media/products/test/sample.jpg`
- [ ] Clean up test assets

**1.4 Write Stripe Sync Service Tests (RED)**
- [ ] Verify Stripe SDK installed (already have it from Phase 2.4)
- [ ] Create `tests/unit/lib/services/stripe-sync-service.test.ts`
  - Test syncProductToStripe() with sell_status="internal" (archives)
  - Test syncProductToStripe() creates new product when stripe_product_id missing
  - Test syncProductToStripe() updates existing product
  - Test syncProductToStripe() handles price changes (creates new Price)
  - Test syncProductToStripe() archives old prices when price changes
  - Test syncProductToStripe() sets default price
  - Test syncProductToStripe() adds metadata (local_id, sell_status)
  - Test syncProductToStripe() skips internal products with no stripe_product_id
  - Test syncProductToStripe() handles Stripe API errors
  - Test syncProductToStripe() validates input data
  - ~25 tests total (see Test Specification section)
- [ ] Run tests: `npm test` - **EXPECT FAILURES** (service doesn't exist yet)

**1.5 Implement Stripe Sync Service (GREEN)**
- [ ] Create `lib/services/stripe-sync-service.ts`
- [ ] Implement `syncProductToStripe()` function
- [ ] Handle price immutability (archive old, create new)
- [ ] Use logger for error tracking
- [ ] Run tests: `npm test` - **EXPECT PASSING** (all 25 tests green)

**1.6 Manual Validation Script**
- [ ] Create test script: `scripts/tools/test-stripe.ts`
  ```typescript
  // Create test product
  // Update product name
  // Create price
  // Archive product
  // Verify in Stripe dashboard
  ```
- [ ] Run test script manually in Stripe test mode
- [ ] Verify products appear in Stripe dashboard
- [ ] Clean up test products

**Phase 1 Gate Criteria:**
- [ ] All 20 Cloudinary tests passing
- [ ] All 25 Stripe tests passing
- [ ] Manual validation scripts successful
- [ ] Credentials validated
- [ ] Rate limits understood and documented
- [ ] All existing tests still passing (775/778)
- [ ] TypeScript: 0 errors
- [ ] Lint: 0 errors

**Deliverables:**
- Working Cloudinary service with 20 tests
- Working Stripe sync service with 25 tests
- Test scripts demonstrating connectivity
- Documented any API quirks or limitations
- Total new tests: 45

---

### Phase 2: Schema & Migration (Day 1 Afternoon, 4-5 hours)

**Goal:** Update data structures to support new features.

**TDD Approach: Write mapper tests first, update schemas, then implement mappers.**

**2.1 Schema Updates**
- [ ] Move `config/products.json` → `config/content/products.json`
- [ ] Create `config/content/media/` directory structure
- [ ] Update `config/schema.ts` (Zod validation)
  - Add MediaItemSchema
  - Add new product fields (is_live, cost_cents, etc.)
  - Update ProductSchema and VariantSchema
- [ ] Update `types/product.ts` (TypeScript interfaces)
  - Add MediaItem interface
  - Add new Product fields
  - Add new Variant fields
- [ ] Update `db/schema.ts` (PostgreSQL columns)
  - Add new columns to products table
  - Add new columns to variants table
  - Add media JSONB columns

**2.2 Database Migration**
- [ ] Generate migration: `npx drizzle-kit generate:pg`
- [ ] Review migration SQL
- [ ] Apply to local DB: `npm run db:push`
- [ ] Verify columns added: `npm run db:studio`
- [ ] Test rollback strategy (document only)

**2.3 Write Mapper Tests (RED)**
- [ ] Update `tests/unit/lib/mappers/product-mapper.test.ts`
  - Test mapping new fields (is_live, cost_cents, wholesalePriceCents, sellStatus, sellStatusNote, lastSyncedAt)
  - Test media JSONB array mapping (JSON → DB)
  - Test media array extraction (DB → TypeScript)
  - Test null handling for optional fields
  - Test empty media array
  - +10 tests
- [ ] Update `tests/unit/lib/mappers/variant-mapper.test.ts`
  - Test variant media JSONB mapping
  - +5 tests
- [ ] Run tests: `npm test` - **EXPECT FAILURES** (mappers don't handle new fields yet)

**2.4 Update Mappers (GREEN)**
- [ ] Update `lib/mappers/product-mapper.ts`
  - Map new fields (is_live, sell_status, etc.)
  - Handle media JSONB array
- [ ] Update `lib/mappers/variant-mapper.ts`
  - Handle media JSONB array
- [ ] Run tests: `npm test` - **EXPECT PASSING** (all mapper tests green)

**2.5 Migrate Existing Data**
- [ ] Add default values to products.json:
  - `is_live: true` for products with `dev_status: 5`
  - `sell_status: "for-sale"` for active products
  - `media: []` for all products/variants
  - Other new fields with sensible defaults
- [ ] Validate updated JSON against new schema
- [ ] Re-sync to database: `npm run sync:products` (existing script)

**Phase 2 Gate Criteria:**
- [ ] All 15 new mapper tests passing
- [ ] All existing tests still passing (775/778)
- [ ] Database migration applied successfully
- [ ] products.json validates against new schema
- [ ] TypeScript: 0 errors
- [ ] Lint: 0 errors

**Deliverables:**
- Updated schemas (Zod, TypeScript, PostgreSQL)
- Database migration applied
- Mappers handling new fields with 15 new tests
- products.json with default values
- All existing tests passing
- Total new tests: 60 (45 from Phase 1 + 15 from Phase 2)

---

### Phase 3: Cloudinary Integration (Day 2 Morning, 4-5 hours)

**Goal:** Connect media files to Cloudinary with UI display.

**TDD Approach: Write utility tests first, implement, then integrate with UI.**

**3.1 Write Cloudinary Utility Tests (RED)**
- [ ] Create `tests/unit/lib/utils/cloudinary.test.ts`
  - Test getCloudinaryUrl() basic URL generation
  - Test getCloudinaryUrl() with width transformation
  - Test getCloudinaryUrl() with height transformation
  - Test getCloudinaryUrl() with crop modes (fill, fit, scale)
  - Test getCloudinaryUrl() with quality settings
  - Test getCloudinaryUrl() with format settings (auto, jpg, png, webp)
  - Test getCloudinaryUrl() with multiple transformations
  - Test constants are correct (base URL, upload path)
  - ~10 tests
- [ ] Run tests: `npm test` - **EXPECT FAILURES** (utility doesn't exist yet)

**3.2 Implement Cloudinary Utility (GREEN)**
- [ ] Create `lib/utils/cloudinary.ts`
- [ ] Implement `getCloudinaryUrl()` with transformations
- [ ] Add constants (base URL, upload path)
- [ ] Run tests: `npm test` - **EXPECT PASSING** (all 10 tests green)

**3.3 Write Component Tests (RED)**
- [ ] Update `tests/unit/components/products/ProductCard.test.tsx`
  - Test ProductCard displays Cloudinary image
  - Test ProductCard uses placeholder when no media
  - Test ProductCard applies transformations (width, quality)
  - +5 tests
- [ ] Run tests: `npm test` - **EXPECT FAILURES** (component not updated yet)

**3.4 Update UI Components (GREEN)**
- [ ] Update `components/products/ProductCard.tsx`
  - Use `getCloudinaryUrl()` for images
  - Add placeholder for missing media
  - Apply transformations (width, quality)
- [ ] Update `components/products/ProductGrid.tsx` if needed
- [ ] Update product detail page with media display
- [ ] Run tests: `npm test` - **EXPECT PASSING** (all component tests green)

**3.5 Manual Validation**
- [ ] Add placeholder images to `config/content/media/Material-8x8-V/`
- [ ] Create simple upload script: `scripts/upload-media.ts`
- [ ] Test upload script manually
- [ ] Verify images in Cloudinary dashboard
- [ ] Test in browser with dev server

**Phase 3 Gate Criteria:**
- [ ] All 15 new tests passing (10 utility + 5 component)
- [ ] All existing tests still passing (775/778)
- [ ] Images displaying correctly in browser
- [ ] TypeScript: 0 errors
- [ ] Lint: 0 errors

**Deliverables:**
- Cloudinary helper utility with 10 tests
- ProductCard with 5 new tests
- Sample media uploaded and displaying
- Total new tests: 75 (60 from Phases 1-2 + 15 from Phase 3)

---

### Phase 4: Product Display Logic (Day 2 Afternoon, 3-4 hours)

**Goal:** Update UI to use new sell_status and is_live flags.

**TDD Approach: Write filter tests first, implement logic, then update components.**

**4.1 Write Product Filter Tests (RED)**
- [ ] Create `tests/unit/lib/utils/product-filters.test.ts`
  - Test shouldShowProduct() returns true when is_live=true and sell_status="for-sale"
  - Test shouldShowProduct() returns false when is_live=false
  - Test shouldShowProduct() returns false when sell_status="internal"
  - Test shouldShowProduct() handles all sell_status values
  - Test getProductDisplayStatus() for "for-sale"
  - Test getProductDisplayStatus() for "pre-order"
  - Test getProductDisplayStatus() for "sold-out"
  - Test getProductDisplayStatus() for "internal"
  - Test getProductDisplayStatus() includes sell_status_note
  - Test isProductReady() checks dev_status=5
  - ~15 tests
- [ ] Run tests: `npm test` - **EXPECT FAILURES** (filters don't exist yet)

**4.2 Implement Product Filters (GREEN)**
- [ ] Create `lib/utils/product-filters.ts`
- [ ] Implement `shouldShowProduct()` function
- [ ] Implement `getProductDisplayStatus()` function
- [ ] Implement `isProductReady()` function
- [ ] Run tests: `npm test` - **EXPECT PASSING** (all 15 tests green)

**4.3 Write Component Tests (RED)**
- [ ] Update component tests for ProductCard
  - Test sell_status badges display correctly
  - Test "Add to Cart" disabled for sold-out
  - Test sell_status_note displays when present
  - +5 tests
- [ ] Run tests: `npm test` - **EXPECT FAILURES** (components not updated yet)

**4.4 Update Components (GREEN)**
- [ ] Update `components/products/ProductCard.tsx`
  - Add sell_status badges
  - Show sell_status_note if present
- [ ] Update `components/cart/AddToCartButton.tsx`
  - Disable for sold-out products
  - Change text for pre-order products
- [ ] Update product listing page (filter by is_live)
- [ ] Update product API routes (filter by is_live)
- [ ] Run tests: `npm test` - **EXPECT PASSING** (all component tests green)

**4.5 Manual Validation**
- [ ] Test all sell_status scenarios in browser
- [ ] Verify products with is_live=false hidden
- [ ] Verify badges display correctly

**Phase 4 Gate Criteria:**
- [ ] All 20 new tests passing (15 filters + 5 component)
- [ ] All existing tests still passing (775/778)
- [ ] UI displays sell_status appropriately
- [ ] TypeScript: 0 errors
- [ ] Lint: 0 errors

**Deliverables:**
- Product filtering with 15 tests
- Updated components with 5 tests
- UI showing sell_status appropriately
- Total new tests: 95 (75 from Phases 1-3 + 20 from Phase 4)

---

### Phase 5: Enhanced Sync Script (Day 3 Morning, 5-6 hours)

**Goal:** Build comprehensive sync script integrating all systems.

**TDD Approach: Write integration tests first, then build sync script.**

**5.1 Write Integration Tests (RED)**
- [ ] Create `tests/integration/sync-products-enhanced.test.ts`
  - Test full sync flow (fresh start, 0 → 3 products)
  - Test idempotency (run twice, no duplicates)
  - Test add new product (3 → 4)
  - Test update existing product
  - Test delete media (cleanup Cloudinary + JSON)
  - Test price change (Stripe Price handling)
  - Test sell_status change to "internal" (Stripe archive)
  - Test partial failure (product 2 fails, others succeed)
  - Test products.json updated with IDs
  - Test last_synced_at timestamps
  - ~30 tests
- [ ] Run tests: `npm test:integration` - **EXPECT FAILURES** (script doesn't exist yet)

**5.2 Create Sync Script (GREEN)**
- [ ] Create `scripts/sync-products-enhanced.ts`
- [ ] Implement sync flow:
  1. Load products.json
  2. Scan media directories
  3. Upload new media to Cloudinary
  4. Update products.json with cloudinary_public_id
  5. Sync products to Stripe
  6. Update products.json with stripe_product_id
  7. Sync to PostgreSQL database
  8. Update last_synced_at timestamps
  9. Write updated products.json to disk
- [ ] Implement error handling (per-product basis)
- [ ] Add detailed sync report

**5.2 Media Cleanup Logic**
- [ ] Implement `cleanupDeletedMedia()` function
- [ ] Detect files removed from disk
- [ ] Delete from Cloudinary
- [ ] Remove from products.json
- [ ] Test cleanup workflow

**5.3 Idempotency Testing**
- [ ] Run sync twice, verify no duplicates
- [ ] Verify skipped uploads (already exists)
- [ ] Verify Stripe products not duplicated
- [ ] Test partial failure recovery

**5.4 Add to package.json**
- [ ] Add script: `"sync:products": "tsx scripts/sync-products-enhanced.ts"`
- [ ] Update existing `sync:products` or rename old one
- [ ] Document usage in script header

**Deliverables:**
- Complete sync-products-enhanced.ts script
- Media → Cloudinary working
- JSON → Stripe working
- JSON → Database working
- products.json auto-updated with IDs
- Idempotent and error-resilient
- 30 integration tests passing

---

### Phase 6: Smoke Tests & E2E Automation (Day 3 Afternoon, 4-5 hours)

**Goal:** Build automated smoke tests and convert manual checklist to E2E tests.

**TDD Approach: Automate all manual validation.**

**6.1 Write Smoke Test Suite (RED)**
- [ ] Create `tests/smoke/phase-2.4.6.spec.ts` (Playwright)
  - Test Cloudinary connection
  - Test Stripe connection
  - Test database schema current
  - Test products.json validates against schema
  - Test media directories exist
  - Test sync script runs end-to-end
  - Test UI displays products with Cloudinary images
  - Test sell_status filtering works
  - ~15 tests
- [ ] Run smoke tests: `npm run test:smoke -- phase-2.4.6` - **EXPECT FAILURES** (some features not complete)

**6.2 Write E2E Test Suite (RED)**
- [ ] Create `tests/e2e/product-sync.spec.ts` (Playwright)
  - Test product listing page displays Cloudinary images
  - Test "sold-out" product shows badge and disabled button
  - Test "pre-order" product shows badge and note
  - Test "internal" products don't appear on site
  - Test product page displays media correctly
  - Test media cleanup (delete file, re-sync, verify UI updated)
  - Test idempotency (run sync twice, verify no UI changes)
  - ~20 tests
- [ ] Run E2E tests: `npm run test:e2e` - **EXPECT FAILURES** (not all features integrated yet)

**6.3 Fix Implementation to Pass Tests (GREEN)**
- [ ] Fix any issues discovered by smoke tests
- [ ] Fix any issues discovered by E2E tests
- [ ] Run all tests: `npm test && npm run test:integration && npm run test:e2e && npm run test:smoke` - **EXPECT ALL PASSING**

**6.4 Performance Benchmarks**
- [ ] Create `tests/performance/sync-script-benchmarks.test.ts`
  - Test sync < 5s for 10 products with no media changes
  - Test sync < 30s for 10 products with 50 media files
  - Test sync < 2m for 100 products full sync
  - ~5 tests
- [ ] Run benchmarks and document results
- [ ] Add performance gates to CI/CD (future)

**Phase 6 Gate Criteria:**
- [ ] All 40 new tests passing (15 smoke + 20 E2E + 5 performance)
- [ ] All existing tests passing (775/778)
- [ ] All integration tests passing (30 from Phase 5)
- [ ] Smoke tests validate all acceptance criteria
- [ ] TypeScript: 0 errors
- [ ] Lint: 0 errors

**Deliverables:**
- Smoke test suite with 15 tests
- E2E test suite with 20 tests
- Performance benchmarks with 5 tests
- All manual validation automated
- Total new tests: 165 (125 from Phases 1-5 + 40 from Phase 6)

---

### Phase 7: Documentation & Phase Sign-Off (Day 4, 2-3 hours)

**Goal:** Complete documentation and finalize phase.

**7.1 Documentation Updates**
- [ ] Update DATABASE_SCHEMA.md with new columns
- [ ] Update JSON_CONFIG_STRUCTURE.md with new fields
- [ ] Create sync script usage guide in script header
- [ ] Document Cloudinary folder structure
- [ ] Document Stripe metadata conventions
- [ ] Update IMPLEMENTATION_PLAN.md checkboxes
- [ ] Document test coverage breakdown

**7.2 Regression Test Strategy**
- [ ] Document regression test approach
  - Run existing 775 tests before each phase
  - Run full suite after each phase
  - Track test count progression
  - Identify test failures immediately
- [ ] Create regression test report template

**7.3 Final Validation**
- [ ] Run full test suite: `npm test` (775 + 165 = 940 tests)
- [ ] Run integration tests: `npm run test:integration` (30 tests)
- [ ] Run E2E tests: `npm run test:e2e` (20 tests)
- [ ] Run smoke tests: `npm run test:smoke -- phase-2.4.6` (15 tests)
- [ ] Run performance benchmarks
- [ ] Verify all acceptance criteria met
- [ ] Test in browser manually (final sanity check)

**7.4 Commit & Review**
- [ ] Review all changes
- [ ] Commit updated products.json (with IDs)
- [ ] Create phase completion summary
- [ ] Mark Phase 2.4.6 complete

**Phase 7 Gate Criteria:**
- [ ] All 940 unit tests passing
- [ ] All 30 integration tests passing
- [ ] All 20 E2E tests passing
- [ ] All 15 smoke tests passing
- [ ] All 5 performance benchmarks passing
- [ ] Documentation complete and accurate
- [ ] TypeScript: 0 errors
- [ ] Lint: 0 errors

**Deliverables:**
- All tests passing (835+)
- Documentation updated
- Manual testing complete
- products.json with real data synced
- Phase 2.4.6 complete ✅

---

## Phase Timeline Summary (TDD-First Approach)

| Phase | Focus | Duration | Tests | Deliverable |
|-------|-------|----------|-------|-------------|
| **0** | **Structured Logging** | **2-3h** | **+15** | **Logger utility (TDD)** |
| 1 | Connection Setup | 3-4h | +45 | Cloudinary (20) + Stripe (25) services |
| 2 | Schema Migration | 4-5h | +15 | Database + mappers (TDD) |
| 3 | Cloudinary Integration | 4-5h | +15 | Media displaying (TDD) |
| 4 | Product Display Logic | 3-4h | +20 | UI filters + badges (TDD) |
| 5 | Enhanced Sync Script | 5-6h | +30 | Full sync workflow (integration tests first) |
| 6 | Smoke Tests & E2E | 4-5h | +40 | Automated validation (15 smoke + 20 E2E + 5 perf) |
| 7 | Documentation & Sign-Off | 2-3h | 0 | Final validation + docs |
| **Total** | **Full Implementation** | **27-35h** | **+180** | **Phase 2.4.6 Complete** |

**Estimated: 4-5 days of focused work** (increased from 3-4 days due to TDD)

**Test Count Progression:**
- Starting: 775/778 tests passing
- After Phase 2.4.6: 955/958 tests passing (+180 new tests)
  - Unit: 835 tests (775 + 60 new)
  - Integration: 30 tests (all new)
  - E2E: 20 tests (all new)
  - Smoke: 15 tests (all new)
  - Performance: 5 tests (all new)

**IMPORTANT: Phase 0 must complete BEFORE Phase 1.** Clean up logging mess before building more infrastructure.

**CRITICAL: All phases follow TDD (Red-Green-Refactor). Tests written BEFORE implementation.**

---

## Detailed Test Specifications

This section enumerates ALL 180 test scenarios BEFORE implementation begins.

### Phase 0: Logger Tests (15 tests)

**File:** `tests/unit/lib/utils/logger.test.ts`

1. **test:** logger.debug() formats log entry with correct level
2. **test:** logger.debug() includes timestamp in ISO format
3. **test:** logger.debug() includes metadata when provided
4. **test:** logger.debug() only outputs in development environment
5. **test:** logger.info() formats log entry with correct level
6. **test:** logger.info() outputs in all environments
7. **test:** logger.warn() formats log entry with correct level
8. **test:** logger.warn() includes metadata
9. **test:** logger.error() formats log entry with correct level
10. **test:** logger.error() serializes Error object with message, stack, and name
11. **test:** logger.error() includes both error and metadata
12. **test:** logger.syncStart() logs with correct format
13. **test:** logger.syncComplete() logs with correct format
14. **test:** logger.syncError() logs with error serialization
15. **test:** formatLog() returns valid JSON structure

---

### Phase 1: Service Tests (45 tests)

**File:** `tests/unit/lib/services/cloudinary-service.test.ts` (20 tests)

**uploadMedia() - 7 tests:**
1. **test:** uploadMedia() successfully uploads image and returns publicId
2. **test:** uploadMedia() respects overwrite:false (doesn't re-upload existing)
3. **test:** uploadMedia() handles resource_type='image'
4. **test:** uploadMedia() handles resource_type='video'
5. **test:** uploadMedia() handles resource_type='raw' (for PDFs)
6. **test:** uploadMedia() throws error on invalid file path
7. **test:** uploadMedia() throws error on network failure (mocked)

**checkMediaExists() - 4 tests:**
8. **test:** checkMediaExists() returns true for existing media
9. **test:** checkMediaExists() returns false for non-existent media
10. **test:** checkMediaExists() handles API errors gracefully
11. **test:** checkMediaExists() validates publicId format

**deleteMedia() - 4 tests:**
12. **test:** deleteMedia() successfully deletes media
13. **test:** deleteMedia() is idempotent (deleting non-existent doesn't throw)
14. **test:** deleteMedia() throws error on network failure
15. **test:** deleteMedia() validates publicId format

**Integration - 5 tests:**
16. **test:** upload then check exists returns true
17. **test:** upload then delete then check exists returns false
18. **test:** multiple uploads to same folder structure work
19. **test:** error handling logs with logger (not console.log)
20. **test:** Cloudinary config loaded from environment variables

---

**File:** `tests/unit/lib/services/stripe-sync-service.test.ts` (25 tests)

**syncProductToStripe() with sell_status="internal" - 3 tests:**
21. **test:** archives existing Stripe product when sell_status="internal"
22. **test:** skips sync when sell_status="internal" and no stripe_product_id
23. **test:** returns {action: 'archived'} result

**syncProductToStripe() creating new product - 6 tests:**
24. **test:** creates new Stripe product when stripe_product_id is missing
25. **test:** creates Stripe Price with correct unit_amount
26. **test:** sets default_price on created product
27. **test:** adds metadata (local_id, sell_status)
28. **test:** returns {action: 'created', stripeProductId, stripePriceId}
29. **test:** sets active based on is_live flag

**syncProductToStripe() updating existing product - 7 tests:**
30. **test:** updates existing Stripe product name and description
31. **test:** updates active status based on is_live
32. **test:** updates metadata
33. **test:** creates new Price when base_price changes
34. **test:** archives old Price when creating new one
35. **test:** sets new Price as default
36. **test:** returns {action: 'updated'}

**Error handling - 5 tests:**
37. **test:** handles Stripe API errors gracefully
38. **test:** validates input data (missing required fields)
39. **test:** logs errors with logger
40. **test:** returns error in result object (doesn't throw)
41. **test:** handles network timeout

**Edge cases - 4 tests:**
42. **test:** handles products with $0 price
43. **test:** handles very long product names (Stripe limits)
44. **test:** handles special characters in product name
45. **test:** Stripe config loaded from environment variables

---

### Phase 2: Mapper Tests (15 tests)

**File:** `tests/unit/lib/mappers/product-mapper.test.ts` (+10 tests)

**New field mapping - 7 tests:**
46. **test:** maps is_live boolean correctly
47. **test:** maps cost_cents nullable integer
48. **test:** maps wholesalePriceCents nullable integer
49. **test:** maps sellStatus enum
50. **test:** maps sellStatusNote nullable string
51. **test:** maps lastSyncedAt nullable Date
52. **test:** handles null values for optional fields

**Media array mapping - 3 tests:**
53. **test:** maps media array to JSONB (cloudinary_public_id only)
54. **test:** extracts media array from JSONB to TypeScript
55. **test:** handles empty media array

---

**File:** `tests/unit/lib/mappers/variant-mapper.test.ts` (+5 tests)

**Variant media mapping - 5 tests:**
56. **test:** maps variant media array to JSONB
57. **test:** extracts variant media from JSONB
58. **test:** handles empty variant media array
59. **test:** preserves variant media separate from parent product
60. **test:** handles variant with no media (uses parent fallback in UI only, not in data)

---

### Phase 3: Cloudinary Utility & Component Tests (15 tests)

**File:** `tests/unit/lib/utils/cloudinary.test.ts` (10 tests)

**getCloudinaryUrl() - 10 tests:**
61. **test:** generates basic URL with publicId
62. **test:** applies width transformation (w_400)
63. **test:** applies height transformation (h_300)
64. **test:** applies crop mode 'fill'
65. **test:** applies crop mode 'fit'
66. **test:** applies crop mode 'scale'
67. **test:** applies quality setting (q_auto)
68. **test:** applies format setting (f_webp)
69. **test:** combines multiple transformations correctly
70. **test:** constants (CLOUDINARY_BASE_URL, CLOUDINARY_UPLOAD_PATH) are correct

---

**File:** `tests/unit/components/products/ProductCard.test.tsx` (+5 tests)

71. **test:** ProductCard displays Cloudinary image from media array
72. **test:** ProductCard uses first 'main' category image
73. **test:** ProductCard shows placeholder when media array empty
74. **test:** ProductCard applies width transformation (w_400)
75. **test:** ProductCard applies quality transformation (q_auto)

---

### Phase 4: Product Filter & Component Tests (20 tests)

**File:** `tests/unit/lib/utils/product-filters.test.ts` (15 tests)

**shouldShowProduct() - 6 tests:**
76. **test:** returns true when is_live=true and sell_status="for-sale"
77. **test:** returns false when is_live=false
78. **test:** returns false when sell_status="internal"
79. **test:** returns true for "pre-order" products when is_live=true
80. **test:** returns true for "sold-out" products when is_live=true (show but disable purchase)
81. **test:** handles edge case: is_live=true, sell_status=null (defaults to false)

**getProductDisplayStatus() - 5 tests:**
82. **test:** returns {label: "In Stock", canPurchase: true} for "for-sale"
83. **test:** returns {label: "Pre-Order", canPurchase: true, note} for "pre-order"
84. **test:** returns {label: "Sold Out", canPurchase: false, note} for "sold-out"
85. **test:** returns {label: "Not Available", canPurchase: false} for "internal"
86. **test:** includes sellStatusNote in result when present

**isProductReady() - 2 tests:**
87. **test:** returns true when dev_status=5
88. **test:** returns false when dev_status<5

**Edge cases - 2 tests:**
89. **test:** handles missing sell_status field (defaults to "internal")
90. **test:** handles invalid sell_status value (defaults to unavailable)

---

**File:** `tests/unit/components/products/ProductCard.test.tsx` (+5 tests)

91. **test:** ProductCard displays "Pre-Order" badge when sell_status="pre-order"
92. **test:** ProductCard displays "Sold Out" badge when sell_status="sold-out"
93. **test:** ProductCard shows sell_status_note below badge when present
94. **test:** ProductCard disables AddToCartButton when canPurchase=false
95. **test:** ProductCard changes button text to "Pre-Order" for pre-order products

---

### Phase 5: Integration Tests (30 tests)

**File:** `tests/integration/sync-products-enhanced.test.ts` (30 tests)

**Full sync workflow - 5 tests:**
96. **test:** syncs 3 products from fresh start (0 → 3)
97. **test:** uploads media to Cloudinary
98. **test:** creates products in Stripe
99. **test:** inserts products into database
100. **test:** updates products.json with cloudinary_public_id and stripe_product_id

**Idempotency - 5 tests:**
101. **test:** running sync twice produces identical results
102. **test:** second run skips already-uploaded media (reports "skipped")
103. **test:** second run updates Stripe products (not create)
104. **test:** second run uses upsert for database
105. **test:** last_synced_at timestamp updates on each run

**Add/update/delete scenarios - 6 tests:**
106. **test:** adding new product (3 → 4) uploads only new media
107. **test:** updating product name syncs to Stripe and database
108. **test:** updating product price creates new Stripe Price
109. **test:** changing sell_status to "internal" archives Stripe product
110. **test:** deleting media file from disk removes from Cloudinary and JSON
111. **test:** deleting product from JSON archives in Stripe and soft-deletes in DB

**Partial failure handling - 8 tests:**
112. **test:** Cloudinary failure for product 2 doesn't block products 1, 3, 4
113. **test:** Stripe failure for product 2 doesn't block products 1, 3, 4
114. **test:** Database failure for product 2 doesn't block products 1, 3, 4
115. **test:** failed product doesn't update last_synced_at
116. **test:** successful products update last_synced_at
117. **test:** re-running sync retries failed products
118. **test:** error report includes all failures
119. **test:** sync continues after error (doesn't crash)

**Variant handling - 4 tests:**
120. **test:** syncs variant media from subfolder (Unit-8x8x8-Founder/BLACK/)
121. **test:** creates separate Stripe Product for each variant
122. **test:** links variant to parent via metadata
123. **test:** variant media independent from parent product media

**Media cleanup - 2 tests:**
124. **test:** cleanup deletes Cloudinary asset when file removed from disk
125. **test:** cleanup removes media entry from products.json

---

### Phase 6: Smoke & E2E Tests (40 tests)

**File:** `tests/smoke/phase-2.4.6.spec.ts` (15 tests - Playwright)

**Connection validation - 3 tests:**
126. **test:** Cloudinary connection works (can upload test file)
127. **test:** Stripe connection works (can create test product)
128. **test:** Database connection works (can query products table)

**Schema validation - 4 tests:**
129. **test:** Database schema includes new columns (is_live, sell_status, etc.)
130. **test:** products.json validates against updated Zod schema
131. **test:** media directory structure exists (config/content/media/)
132. **test:** products.json moved to config/content/products.json

**Sync script validation - 3 tests:**
133. **test:** sync script runs without errors
134. **test:** sync script generates valid report
135. **test:** sync script updates products.json with IDs

**UI validation - 5 tests:**
136. **test:** product listing page loads
137. **test:** product page displays Cloudinary image
138. **test:** sell_status filtering works (internal products hidden)
139. **test:** badges display for pre-order/sold-out
140. **test:** AddToCartButton disabled for sold-out products

---

**File:** `tests/e2e/product-sync.spec.ts` (20 tests - Playwright)

**Product display - 7 tests:**
141. **test:** product listing page shows products with is_live=true
142. **test:** product listing page hides products with is_live=false
143. **test:** product listing page hides products with sell_status="internal"
144. **test:** product page displays main Cloudinary image
145. **test:** product page displays all media in gallery
146. **test:** product page shows "Pre-Order" badge and note
147. **test:** product page shows "Sold Out" badge and disabled button

**Variant display - 3 tests:**
148. **test:** variant page displays variant-specific media
149. **test:** variant page falls back to parent media when variant has none
150. **test:** variant page shows correct sell_status badge

**Media sync E2E - 5 tests:**
151. **test:** upload new media file, run sync, verify image appears on site
152. **test:** delete media file, run sync, verify image removed from site
153. **test:** update media file, run sync, verify new image appears
154. **test:** media transformations applied correctly in browser
155. **test:** media loads with correct MIME type and cache headers

**Idempotency E2E - 3 tests:**
156. **test:** run sync twice, verify no duplicate images
157. **test:** run sync twice, verify no duplicate Stripe products
158. **test:** run sync twice, verify UI unchanged

**Error handling E2E - 2 tests:**
159. **test:** invalid media file skipped, sync continues
160. **test:** sync error report accessible and accurate

---

**File:** `tests/performance/sync-script-benchmarks.test.ts` (5 tests)

161. **test:** sync < 5s for 10 products with no media changes
162. **test:** sync < 30s for 10 products with 50 media files
163. **test:** sync < 2m for 100 products full sync
164. **test:** media upload time scales linearly with file count
165. **test:** database upsert time < 100ms per product

---

### Additional Test Categories

**Regression Tests (Not new tests, existing 775):**
- Run before each phase begins
- Run after each phase completes
- Verify no failures introduced
- Track test count progression

**Manual Validation (Converted to automated above):**
- All manual steps from Phase 7.2 now automated in E2E/Smoke tests
- No manual testing required except final sanity check

---

## Test Specification Summary

**Total New Tests: 165** (corrected from 180 - some duplication removed)

| Phase | Test Type | Count | File(s) |
|-------|-----------|-------|---------|
| 0 | Unit | 15 | logger.test.ts |
| 1 | Unit | 45 | cloudinary-service.test.ts (20), stripe-sync-service.test.ts (25) |
| 2 | Unit | 15 | product-mapper.test.ts (+10), variant-mapper.test.ts (+5) |
| 3 | Unit | 15 | cloudinary.test.ts (10), ProductCard.test.tsx (+5) |
| 4 | Unit | 20 | product-filters.test.ts (15), ProductCard.test.tsx (+5) |
| 5 | Integration | 30 | sync-products-enhanced.test.ts |
| 6 | Smoke | 15 | phase-2.4.6.spec.ts |
| 6 | E2E | 20 | product-sync.spec.ts |
| 6 | Performance | 5 | sync-script-benchmarks.test.ts |
| **Total** | | **180** | **13 test files** |

---

## Decisions Made

1. **is_live field:** ✅ Manual boolean flag stored in JSON. Not computed from dev_status.
   - Display logic: `showOnSite = product.is_live && product.sell_status !== 'internal'`
   - `dev_status` is now orthogonal to display (dev readiness vs. business decision to show)

2. **Backup strategy:** ✅ No auto-backup needed. products.json is version-controlled in Git.
   - Failed syncs won't corrupt file (write at end only)
   - Git provides rollback capability

3. **Partial failure handling:** ✅ Allow partial success, show errors in report.
   - Products track `last_synced_at` timestamp
   - Re-running sync targets products with old/missing sync dates
   - Errors logged but don't block other products

4. **Current Stripe state:** ✅ Test environment is empty. Will create all products fresh.
   - Production Stripe has some products already (need audit later)
   - Test mode: Clean slate, perfect for testing sync script

## All Decisions Finalized ✅

**No open questions remaining. Ready for implementation.**

Additional decisions:

5. **Media deletion handling:** ✅ If media file removed from `config/content/media/`:
   - Delete corresponding asset from Cloudinary
   - Remove media entry from products.json
   - Sync script performs cleanup on both sides

6. **Variant media model:** ✅ Variants have their own media arrays (no inheritance in data)
   - Variants stored in subfolders: `Unit-8x8x8-Founder/BLACK/`, `Unit-8x8x8-Founder/WHITE/`, etc.
   - Parent product media at root: `Unit-8x8x8-Founder/main.jpg`
   - Data model: Variants store their own media independently
   - Display layer: UI can optionally show parent product images as fallback

---

## Dependencies

**NPM Packages:**
```bash
npm install cloudinary stripe
npm install --save-dev @types/cloudinary
```

**Environment Variables:**
```env
# Cloudinary
CLOUDINARY_CLOUD_NAME=imajin-ai
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## Risk Assessment

**High Risk:**
- Modifying products.json in place (could corrupt if script crashes)
- Stripe price immutability (need careful handling of price changes)
- Large media uploads (rate limits, timeouts)

**Mitigations:**
- Backup products.json before modifications
- Wrap sync in try/catch with rollback logic
- Batch Cloudinary uploads with delays
- Use Stripe test mode for initial testing

**Medium Risk:**
- Database migration (new columns)
- Schema validation (breaking changes)

**Mitigations:**
- Test migration on local DB first
- Add default values for all new fields
- Backward-compatible validation (optional fields)

---

## Future Enhancements

- **Phase 3+:** Admin UI for managing products (WYSIWYG editor)
- **Phase 3+:** Automated image optimization (generate thumbnails, WebP conversions)
- **Phase 4+:** Webhook from Stripe to sync price changes back to JSON
- **Phase 5+:** Visual media library browser (select images from Cloudinary)
- **Phase 5+:** Bulk product import from CSV
- **Phase 5+:** Product versioning (track changes over time)

---

**Status:** Ready for implementation
**Next Step:** Review open questions, then begin Phase 1 (Schema & Migration)
