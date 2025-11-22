# Phase 2.5.1 - Stripe Product/Price Architecture Refactor

**Status:** 🟡 Ready to Start
**Priority:** CRITICAL - Blocking all revenue
**Started:** 2025-11-01
**Target Completion:** 2025-11-02

---

## Problem Statement

The current Stripe sync implementation creates **separate Products** for each variant, which violates Stripe's recommended architecture and industry best practices.

### Current (Incorrect) Architecture

```
Stripe Dashboard:
├── Product: "Founder Edition Cube" (prod_TLWCEEY3blul23)
├── Product: "Founder Edition - BLACK" (prod_TLWC78h4y2DvWI)  ❌ WRONG
├── Product: "Founder Edition - WHITE" (prod_TLWCKSdz5hHmlb) ❌ WRONG
└── Product: "Founder Edition - RED" (prod_TLWCEB3m8VtNO1)   ❌ WRONG
```

**Problems:**
- 4 products in Stripe instead of 1
- Can't see aggregated "Founder Edition" sales
- Dashboard clutter and confusion
- Analytics fragmentation
- Not how Stripe is designed to work

---

### Correct (Target) Architecture

```
Stripe Dashboard:
└── Product: "Founder Edition Cube" (prod_founder_edition)
    ├── Price: $1,295 USD (price_founder_black) - metadata: { color: 'BLACK', variant_id: '...' }
    ├── Price: $1,295 USD (price_founder_white) - metadata: { color: 'WHITE', variant_id: '...' }
    └── Price: $1,295 USD (price_founder_red) - metadata: { color: 'RED', variant_id: '...' }
```

**Benefits:**
- 1 product with 3 price options
- Aggregated sales reporting
- Clean dashboard
- Proper use of Stripe's variant system
- Industry standard pattern

---

## Scope

### In Scope
1. Refactor `stripe-sync-service.ts` to create Prices (not Products) for variants
2. Add `stripe_price_id` column to `variants` table
3. Update `products.json` schema to support `stripe_price_id` on variants
4. Migrate existing Stripe data (delete wrong products, create correct structure)
5. Update cart/checkout to use Price IDs
6. Update webhooks to handle Price IDs correctly
7. Add comprehensive tests for new sync logic

### Out of Scope
- Pre-sale deposit functionality (Phase 2.5.2)
- Real-time inventory UI (Phase 2.5.5)
- Additional payment methods beyond card/Link

---

## Implementation Plan

### Step 1: Database Schema Changes

**Add `stripe_price_id` to variants table:**

```sql
ALTER TABLE variants
ADD COLUMN stripe_price_id VARCHAR(255);
```

**Update Drizzle schema** (`db/schema.ts`):
```typescript
export const variants = pgTable('variants', {
  // ... existing fields ...
  stripePriceId: varchar('stripe_price_id', { length: 255 }),
});
```

**Migration:** Run `npm run db:push` to apply schema changes.

---

### Step 2: Update JSON Config Schema

**File:** `config/schema.ts`

Update `VariantConfigSchema` to include `stripe_price_id`:

```typescript
export const VariantConfigSchema = z.object({
  id: z.string(),
  product_id: z.string(),
  variant_type: z.string(),
  variant_value: z.string(),
  price_modifier: z.number().default(0),
  max_quantity: z.number().nullable(),
  stripe_price_id: z.string().optional(), // NEW
  // ... other fields
});
```

---

### Step 3: Refactor Stripe Sync Service

**File:** `lib/services/stripe-sync-service.ts`

**Current logic:**
- Creates Stripe Product per variant
- Returns `stripeProductId` for each variant

**New logic:**
- For products with `hasVariants: true`:
  - Create ONE Stripe Product for the parent
  - Create MULTIPLE Stripe Prices (one per variant)
  - Store Price IDs in `variants.stripe_price_id`
- For products without variants:
  - Create Stripe Product
  - Create ONE Price
  - Store Price ID in `products.stripe_product_id` (reusing field)

**New function signature:**

```typescript
export interface StripeSyncResult {
  productId: string;
  action: 'created' | 'updated' | 'archived' | 'skipped';
  stripeProductId?: string;
  stripePriceId?: string; // For non-variant products
  variantPrices?: Array<{  // For products with variants
    variantId: string;
    stripePriceId: string;
  }>;
  error?: string;
}

export async function syncProductToStripe(
  product: ProductSyncInput,
  variants?: VariantSyncInput[]
): Promise<StripeSyncResult>
```

**Implementation pseudocode:**

```typescript
if (product.hasVariants && variants && variants.length > 0) {
  // Create parent product (or update if exists)
  const stripeProduct = await createOrUpdateStripeProduct(product);

  // Create prices for each variant
  const variantPrices = [];
  for (const variant of variants) {
    const price = await stripe.prices.create({
      product: stripeProduct.id,
      unit_amount: product.basePrice + variant.priceModifier,
      currency: 'usd',
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
    action: 'created',
    stripeProductId: stripeProduct.id,
    variantPrices,
  };
} else {
  // Standard single-price product logic
  // ... existing code ...
}
```

---

### Step 4: Update Enhanced Sync Script

**File:** `scripts/sync-products-enhanced.ts`

Update the script to:
1. Pass variants to `syncProductToStripe` when product has variants
2. Write `stripe_price_id` to variants in `products.json`
3. Write `stripe_product_id` to parent product only (not variants)

**Changes needed:**

```typescript
// When syncing product with variants
if (product.has_variants && productVariants.length > 0) {
  const syncResult = await syncProductToStripe(
    {
      id: product.id,
      name: product.name,
      description: product.description,
      basePriceCents: product.base_price_cents,
      isLive: product.is_live,
      sellStatus: product.sell_status,
      stripeProductId: product.stripe_product_id,
    },
    productVariants.map(v => ({
      id: v.id,
      productId: v.product_id,
      variantType: v.variant_type,
      variantValue: v.variant_value,
      priceModifier: v.price_modifier || 0,
      stripePriceId: v.stripe_price_id,
    }))
  );

  // Update parent product
  product.stripe_product_id = syncResult.stripeProductId;

  // Update variant prices
  if (syncResult.variantPrices) {
    for (const vp of syncResult.variantPrices) {
      const variant = productVariants.find(v => v.id === vp.variantId);
      if (variant) {
        variant.stripe_price_id = vp.stripePriceId;
      }
    }
  }
}
```

---

### Step 5: Update Cart/Checkout Logic

**Files to update:**
- `components/cart/CartProvider.tsx`
- `components/products/ProductAddToCart.tsx`
- `app/api/checkout/session/route.ts`

**Change needed:**

Currently cart items store `stripeProductId`. For variants, this should be `stripePriceId` instead.

**CartItem type update** (`types/cart.ts`):

```typescript
export interface CartItem {
  productId: string;
  variantId?: string | null;
  name: string;
  variantName?: string | null;
  price: number;
  quantity: number;
  image?: string;
  voltage?: string;
  stripeProductId: string; // Rename to stripePriceId or keep for compatibility
}
```

**Decision needed:** Rename field or keep backward compatible?

**Option A (Clean break):**
```typescript
stripePriceId: string; // Use for both products and variants
```

**Option B (Backward compatible):**
```typescript
stripeProductId: string; // Actually contains Price ID (confusing name)
```

**Recommendation:** Option A - Rename to `stripePriceId` for clarity.

---

### Step 6: Update Webhook Handler

**File:** `app/api/webhooks/stripe/route.ts`

Verify the webhook can handle Price IDs correctly when creating orders.

The current webhook pulls cart data from `session.metadata.cartItems` which contains:
- `stripeProductId` (which will be Price ID after changes)

**No changes needed** if we keep the field name `stripeProductId` for compatibility.

If we rename to `stripePriceId`, update webhook accordingly.

---

### Step 7: Migration Strategy

**Clean up existing Stripe products:**

1. **Delete incorrect variant products from Stripe:**
   - prod_TLWC78h4y2DvWI (Founder BLACK)
   - prod_TLWCKSdz5hHmlb (Founder WHITE)
   - prod_TLWCEB3m8VtNO1 (Founder RED)

2. **Keep parent product:**
   - prod_TLWCEEY3blul23 (Founder Edition Cube)

3. **Create three new Prices under parent product**

**Script:** Create `scripts/migrate-stripe-variants.ts`

```typescript
/**
 * One-time migration script to fix Stripe variant architecture
 *
 * 1. Deletes incorrect variant products
 * 2. Creates correct prices under parent product
 * 3. Updates products.json with new price IDs
 */
```

**Run order:**
1. Run migration script to fix Stripe
2. Update `products.json` with new price IDs
3. Run `npm run db:sync:enhanced` to sync to database

---

## Testing Strategy

### Unit Tests

**File:** `tests/unit/lib/services/stripe-sync-service.test.ts`

Add tests for:
- Creating product with multiple variant prices
- Updating existing variant prices
- Archiving products with variants
- Handling price changes (Stripe prices are immutable)

```typescript
describe('syncProductToStripe - with variants', () => {
  it('should create parent product with three variant prices', async () => {
    // Test implementation
  });

  it('should update variant prices when base price changes', async () => {
    // Test implementation
  });

  it('should include variant metadata in prices', async () => {
    // Test implementation
  });
});
```

### Integration Tests

**File:** `tests/integration/stripe-variant-sync.test.ts` (new)

Test full sync workflow:
1. Sync product with variants to Stripe
2. Verify parent product created
3. Verify three prices created with correct metadata
4. Verify database updated correctly
5. Verify `products.json` updated correctly

### E2E Tests

**File:** `tests/e2e/checkout-with-variants.test.ts` (new)

Test checkout flow:
1. Add Founder Edition (BLACK) to cart
2. Proceed to checkout
3. Create Stripe session with Price ID
4. Verify session contains correct line items
5. Simulate webhook
6. Verify order created correctly

---

## Acceptance Criteria

- [ ] Database schema includes `stripe_price_id` on variants table
- [ ] JSON config schema supports `stripe_price_id` on variants
- [ ] `stripe-sync-service.ts` creates Prices (not Products) for variants
- [ ] Enhanced sync script writes Price IDs to `products.json`
- [ ] Cart stores Price IDs correctly
- [ ] Checkout session uses Price IDs
- [ ] Webhook handles Price IDs correctly
- [ ] Migration script successfully migrates existing Stripe data
- [ ] Stripe Dashboard shows 1 product with 3 prices for Founder Edition
- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] Full checkout E2E test passing

---

## Rollback Plan

If issues arise after migration:

1. **Restore old products.json** from git
2. **Delete new Prices from Stripe** (via script or dashboard)
3. **Restore old Product structure** (if deleted)
4. **Revert database migration** (if schema changed)
5. **Revert code changes**

**Keep backup before migration:**
```bash
cp config/content/products.json config/content/products.json.backup-$(date +%Y%m%d)
```

---

## Estimated Duration

- Schema changes: 30 min
- Sync service refactor: 2-3 hours
- Cart/checkout updates: 1-2 hours
- Migration script: 1 hour
- Testing: 2-3 hours
- **Total: 6-9 hours**

---

## Related Documents

- [Phase 2.5 - Products & Inventory Completion](./Phase%202.5%20-%20Products%20&%20Inventory%20Completion.md)
- [DATABASE_SCHEMA.md](../DATABASE_SCHEMA.md)
- [Stripe Prices API Documentation](https://stripe.com/docs/api/prices)
- [Stripe Product/Price Best Practices](https://stripe.com/docs/billing/prices-guide)

---

## Notes

- **Critical:** Do not process real customer orders until this is complete
- Consider running migration in TEST mode first (Stripe test keys)
- Keep old variant products in Stripe for 30 days before permanent deletion
- Update IMPLEMENTATION_PLAN.md after completion
