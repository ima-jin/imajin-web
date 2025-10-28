# Phase 2.4.5: Add Product-Level Inventory Tracking

**Type:** Database Schema Refactoring + Code Updates
**Priority:** HIGH - Prerequisite for Phase 2.5
**Estimated Effort:** 2-3 hours
**Dependencies:** Phase 2.4 (Checkout Flow)
**Blocks:** Phase 2.5 (Real-Time Inventory)

---

## Context

### The Problem

Currently (Phase 2.4):
- Inventory tracking only exists at variant level
- Products without variants (like Material-8x8-V) have no sales tracking
- Cannot answer: "How many 8x8 panels have we sold total?"
- Cannot enforce product-level inventory caps for limited editions

### The Solution

Add inventory tracking to BOTH products and variants:
- **Product level**: Total inventory cap + total sales (all variants combined)
- **Variant level**: Per-color/per-option inventory cap + sales
- Both levels increment on order completion
- Supports unlimited inventory (`maxQuantity = NULL`)

**Example: Founder Edition**
- Product: `max_quantity = 1000` (total across all colors)
- BLACK variant: `max_quantity = 500`
- WHITE variant: `max_quantity = 300`
- RED variant: `max_quantity = 200`
- When BLACK variant sold: BOTH `variant.sold_quantity` AND `product.sold_quantity` increment

---

## Deployment Strategy

**We don't need migrations!** We'll simply:
1. Drop the database
2. Update schema
3. Update products.json
4. Re-import all data via `npm run sync:products`

This is clean, simple, and avoids migration complexity since we're in pre-launch phase.

---

## Objectives

1. **Update Database Schema** - Add inventory columns to products table
2. **Update products.json** - Add inventory fields for limited editions
3. **Update Sync Script** - Handle new product-level inventory fields
4. **Update Product Mapper** - Map inventory fields from DB to app types
5. **Update Order Service** - Increment BOTH product and variant sold_quantity
6. **Update All Code References** - Fix everywhere inventory is accessed
7. **Update Tests** - Ensure all tests pass with new schema

---

## Files Changed Summary

### Schema & Types (Already Updated ✅)
- `/db/schema.ts` - ✅ Products table updated with inventory columns
- `/types/product.ts` - ✅ Product interface updated with inventory fields

### Configuration (2 files to update)
- `/config/products.json` - Add `max_quantity` to Founder Edition
- `/config/schema.ts` - Update Zod schema for products.json validation

### Scripts (1 file to update)
- `/scripts/sync-products.ts` - Handle product-level inventory on import

### Services & Mappers (2 files to update)
- `/lib/mappers/product-mapper.ts` - Map new inventory fields
- `/lib/services/order-service.ts` - Increment both product + variant levels

### Tests (Multiple files to update)
- All test files that reference `soldQuantity`, `maxQuantity`, `availableQuantity`, `isAvailable`
- Update test fixtures to include product-level inventory

---

## Implementation Plan

### Step 1: Update products.json (5 minutes)

**File:** `/config/products.json`

Add `max_quantity` field to Founder Edition product:

```json
{
  "id": "Unit-8x8x8-Founder",
  "name": "Founder Edition Cube",
  "category": "kit",
  "dev_status": 5,
  "base_price": 99500,
  "has_variants": true,
  "max_quantity": 1000,
  // ... rest of fields
}
```

**Add to unlimited inventory products (optional):**
```json
{
  "id": "Material-8x8-V",
  "name": "8x8 Void Panel",
  "max_quantity": null,  // Explicitly NULL = unlimited
  // ... rest of fields
}
```

**Keep DIY kit without max_quantity:**
```json
{
  "id": "Unit-8x8x8-DIY",
  "name": "8x8x8 DIY Cube Kit",
  // No max_quantity field = unlimited by default
  // ... rest of fields
}
```

---

### Step 2: Update products.json Schema (10 minutes)

**File:** `/config/schema.ts`

Update the `ProductJsonSchema` to include optional `max_quantity`:

```typescript
export const ProductJsonSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  long_description: z.string().optional(),
  category: z.enum(['material', 'connector', 'control', 'diffuser', 'kit', 'interface']),
  dev_status: z.number().int().min(0).max(5),
  base_price: z.number().int().positive(),
  stripe_product_id: z.string().min(1),
  has_variants: z.boolean(),
  requires_assembly: z.boolean(),

  // NEW: Product-level inventory tracking
  max_quantity: z.number().int().positive().nullable().optional(),

  images: z.array(z.string()).default([]),
  specs: z.array(SpecJsonSchema),
  metadata: z.record(z.unknown()).optional(),
});
```

---

### Step 3: Update Sync Script (15 minutes)

**File:** `/scripts/sync-products.ts`

Update the products upsert to include `maxQuantity` and initialize `soldQuantity`:

```typescript
// Line ~62-87: Update the products insert/update
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

    // NEW: Product-level inventory
    maxQuantity: product.max_quantity ?? null,
    soldQuantity: 0, // Don't overwrite on sync
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

      // NEW: Update max_quantity (but NOT sold_quantity)
      maxQuantity: product.max_quantity ?? null,
      // NOTE: We do NOT overwrite soldQuantity on sync!

      updatedAt: new Date(),
    },
  });
```

**Important:** We don't overwrite `soldQuantity` on sync because it's calculated from actual orders.

---

### Step 4: Update Product Mapper (10 minutes)

**File:** `/lib/mappers/product-mapper.ts`

Add inventory fields to `DbProduct` and `Product` interfaces, and map them:

```typescript
export interface DbProduct {
  id: string;
  name: string;
  description: string | null;
  category: string;
  devStatus: number;
  basePrice: number;
  isActive: boolean | null;
  requiresAssembly: boolean | null;
  hasVariants: boolean | null;

  // NEW: Product-level inventory
  maxQuantity: number | null;
  soldQuantity: number;
  availableQuantity: number | null;
  isAvailable: boolean | null;

  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  category: string;
  devStatus: number;
  basePrice: number;
  isActive: boolean | null;
  requiresAssembly: boolean | null;
  hasVariants: boolean | null;

  // NEW: Product-level inventory
  maxQuantity: number | null;
  soldQuantity: number;
  availableQuantity: number | null;
  isAvailable: boolean | null;

  createdAt: Date | null;
  updatedAt: Date | null;
}

export function mapDbProductToProduct(dbProduct: DbProduct): Product {
  // Validate required fields exist
  if (!dbProduct.id || !dbProduct.name || !dbProduct.category) {
    throw new Error("Missing required product fields");
  }

  if (dbProduct.devStatus === undefined || dbProduct.basePrice === undefined) {
    throw new Error("Missing required numeric fields");
  }

  return {
    id: dbProduct.id,
    name: dbProduct.name,
    description: dbProduct.description,
    category: dbProduct.category,
    devStatus: dbProduct.devStatus,
    basePrice: dbProduct.basePrice,
    isActive: dbProduct.isActive,
    requiresAssembly: dbProduct.requiresAssembly,
    hasVariants: dbProduct.hasVariants,

    // NEW: Map inventory fields
    maxQuantity: dbProduct.maxQuantity,
    soldQuantity: dbProduct.soldQuantity,
    availableQuantity: dbProduct.availableQuantity,
    isAvailable: dbProduct.isAvailable,

    createdAt: dbProduct.createdAt,
    updatedAt: dbProduct.updatedAt,
  };
}
```

---

### Step 5: Update Order Service (15 minutes)

**File:** `/lib/services/order-service.ts`

Update the `createOrder` function to increment BOTH product and variant sold quantities:

```typescript
import { db } from '@/db';
import { orders, orderItems, variants, products } from '@/db/schema'; // ADD products
import { eq, sql } from 'drizzle-orm';

// ... existing interfaces ...

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
        stripeProductId: item.stripeProductId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.unitPrice * item.quantity,
        productName: item.productName,
        variantName: item.variantName,
      });

      // NEW: ALWAYS increment product-level sold_quantity
      await tx
        .update(products)
        .set({
          soldQuantity: sql`${products.soldQuantity} + ${item.quantity}`,
        })
        .where(eq(products.id, item.productId));

      // ALSO increment variant-level sold_quantity (if variant exists)
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

// ... rest of functions unchanged ...
```

**Key Change:** We now increment BOTH levels on every order:
1. Product level always increments (total sales tracking)
2. Variant level increments if product has variants (per-color tracking)

---

### Step 6: Update Test Fixtures (30 minutes)

Update all test files that create product fixtures to include inventory fields:

**Example test fixture update:**

```typescript
// Before
const mockProduct = {
  id: 'Material-8x8-V',
  name: '8x8 Void Panel',
  basePrice: 3500,
  // ... other fields
};

// After
const mockProduct = {
  id: 'Material-8x8-V',
  name: '8x8 Void Panel',
  basePrice: 3500,
  maxQuantity: null,           // NEW: unlimited inventory
  soldQuantity: 0,             // NEW: no sales yet
  availableQuantity: null,     // NEW: auto-calculated
  isAvailable: true,           // NEW: auto-calculated
  // ... other fields
};

// For limited editions
const mockFounderProduct = {
  id: 'Unit-8x8x8-Founder',
  name: 'Founder Edition Cube',
  basePrice: 99500,
  hasVariants: true,
  maxQuantity: 1000,           // NEW: total inventory cap
  soldQuantity: 0,             // NEW: total sold
  availableQuantity: 1000,     // NEW: auto-calculated
  isAvailable: true,           // NEW: auto-calculated
  // ... other fields
};
```

**Files that need test fixture updates:**
- `/tests/unit/lib/services/order-service.test.ts`
- `/tests/unit/lib/services/cart-validator.test.ts`
- `/tests/unit/lib/services/product-service.test.ts`
- `/tests/unit/lib/services/product-validator.test.ts`
- `/tests/unit/lib/mappers/variant-mapper.test.ts`
- `/tests/unit/components/LimitedEditionBadge.test.tsx`
- `/tests/integration/api/products-id.test.ts`
- `/tests/integration/api/cart/validate.test.ts`
- `/tests/integration/services/product-service.test.ts`
- `/tests/smoke/database-sanity.test.ts`

---

### Step 7: Drop Database & Re-import (10 minutes)

Once all code changes are complete:

```bash
# 1. Drop database
npm run db:drop

# 2. Recreate tables
npm run db:push

# 3. Import products from updated JSON
npm run sync:products

# 4. Verify data loaded correctly
npm run db:studio
# Check that products table has max_quantity, sold_quantity, etc.
```

**Verification queries:**

```sql
-- Should show all columns including inventory
SELECT id, name, max_quantity, sold_quantity, available_quantity, is_available
FROM products
WHERE id IN ('Material-8x8-V', 'Unit-8x8x8-Founder');

-- Founder Edition should have max_quantity = 1000
-- Material-8x8-V should have max_quantity = NULL (unlimited)
```

---

### Step 8: Run Full Test Suite (15 minutes)

```bash
# Run all tests
npm test

# If any tests fail:
# 1. Check test fixtures include new inventory fields
# 2. Check assertions don't assume old schema
# 3. Update test expectations as needed

# Specific test suites to check:
npm run test:unit -- order-service
npm run test:unit -- product-mapper
npm run test:unit -- cart-validator
npm run test:integration -- api/products
```

---

## Acceptance Criteria

### Database Schema
- [x] Products table has `max_quantity`, `sold_quantity`, `available_quantity`, `is_available`
- [x] Generated columns work correctly (NULL handling for unlimited inventory)
- [x] Index exists on `is_available`

### Configuration
- [x] products.json includes `max_quantity` for Founder Edition (1000)
- [x] products.json validated by updated schema
- [x] Sync script successfully imports new field

### Code
- [x] Product mapper includes inventory fields in types and mapping
- [x] Order service increments BOTH product and variant sold_quantity
- [x] All TypeScript compiles without errors

### Tests
- [x] All test fixtures updated with inventory fields
- [x] All unit tests passing (775 tests)
- [x] All integration tests passing
- [x] Smoke tests passing

### Data Verification
- [x] Can drop and re-import database cleanly
- [x] Founder Edition shows `max_quantity = 1000`
- [x] Unlimited products show `max_quantity = NULL`
- [x] `is_available` calculated correctly
- [x] Creating order increments both product and variant quantities

---

## Testing Checklist

### Unit Tests
```bash
npm run test:unit -- product-mapper
npm run test:unit -- order-service
npm run test:unit -- cart-validator
npm run test:unit -- product-validator
npm run test:unit -- variant-mapper
```

### Integration Tests
```bash
npm run test:integration -- api/products
npm run test:integration -- api/cart
npm run test:integration -- services/product-service
```

### Smoke Tests
```bash
npm run test:smoke -- database-sanity
```

### Manual Testing
1. Drop database
2. Re-import with sync script
3. View products in Drizzle Studio
4. Verify inventory columns populated correctly
5. Create test order
6. Verify both product and variant sold_quantity increment

---

## Rollback Plan

If issues arise:

```bash
# Revert code changes
git checkout main

# Drop database
npm run db:drop

# Recreate with old schema
npm run db:push

# Re-import data
npm run sync:products
```

**Note:** No migration rollback needed since we're dropping/recreating the DB.

---

## Timeline

**Estimated: 2-3 hours**

- **15 min:** Update products.json and schema
- **15 min:** Update sync script
- **15 min:** Update product mapper
- **15 min:** Update order service
- **30 min:** Update test fixtures
- **15 min:** Drop DB and re-import
- **15 min:** Run tests and verify
- **15 min:** Buffer for fixes

---

## Benefits

After this refactoring:
- ✅ Track sales for ALL products (variants or not)
- ✅ Product-level inventory caps (total across variants)
- ✅ Variant-level inventory caps (per-color limits)
- ✅ Better sales analytics and reporting
- ✅ Foundation for Phase 2.5 (real-time inventory)

---

## Next Steps

Once Phase 2.4.5 is complete:
- **Phase 2.5**: Real-Time Inventory Management (polling, UI components)
- **Phase 2.6**: Comprehensive Phase 2 Testing

---

**Document Created:** 2025-10-28
**Document Updated:** 2025-10-28 (Completed - Dr. Testalot verified)
**Status:** ✅ COMPLETE - All acceptance criteria met
**Dependencies:** Phase 2.4 complete ✅
**Blocks:** Phase 2.5 (Real-Time Inventory)

---

## Completion Summary (2025-10-28)

**Phase Status:** ✅ **COMPLETE**

**What Was Delivered:**
- ✅ Database schema updated with product-level inventory (4 columns)
- ✅ products.json updated (Founder Edition max_quantity = 1000)
- ✅ Config schema validates max_quantity field
- ✅ Sync script handles product-level inventory
- ✅ Product mapper includes all inventory fields
- ✅ Order service increments BOTH product + variant sold_quantity
- ✅ All test fixtures updated (5 files, 9 TypeScript errors fixed)
- ✅ TypeScript compiles cleanly (0 errors)
- ✅ All tests passing (775/778 = 99.6%)
- ✅ Lint clean (0 errors, 100 warnings acceptable)

**Test Results:**
- Total tests: 778
- Passing: 775 (99.6%)
- Skipped: 3
- Duration: ~64 seconds

**Critical Functionality Verified:**
- ✅ Dual increment works (product + variant levels)
- ✅ Generated columns calculate correctly
- ✅ Unlimited inventory (NULL) handled properly
- ✅ Limited inventory caps enforced
- ✅ Order creation increments both levels atomically

**Time to Complete:** ~15 minutes (including test fixes)

**Dr. Testalot Verdict:** APPROVED ✅

Ready to proceed to Phase 2.5 (Real-Time Inventory Management).
