# Coding Standards - Pre-Launch Phase

**Status:** Pre-Launch (No backward compatibility required)
**Last Updated:** 2025-11-03
**Enforced By:** Dr. Clean (code review), ESLint (automated), Dr. LeanDev (implementation)

---

## Quick Reference

### ❌ Never Do This (Blockers)

```typescript
// ❌ Phase markers
stripePriceId: string; // Phase 2.5.1: New feature

// ❌ Deprecation notices
stripeProductId?: string; // DEPRECATED: Use stripePriceId

// ❌ Migration markers
// TODO: Remove after migration
// Will be removed in v2.0

// ❌ Backward compatibility
interface CartItem {
  stripeProductId?: string; // Old field
  stripePriceId: string;    // New field
}

// ❌ console.log in production code
console.log('Debug:', data); // app/, components/, lib/
```

### ✅ Always Do This

```typescript
// ✅ Clean, timeless comments
stripePriceId: string; // Stripe Price ID for checkout session

// ✅ Just the correct field
interface CartItem {
  stripePriceId: string; // Stripe Price ID for checkout session
}

// ✅ Use logger in production code
import { logger } from '@/lib/utils/logger';
logger.debug('Processing data', { data });

// ✅ console.log allowed in tests/scripts
console.log('✅ Synced:', result); // tests/, scripts/
```

---

## Comments (What to Write)

### Good Comments - Explain "Why"

```typescript
// ✅ Explains technical reason
// Stripe API expects 'product' field (accepts both product and price IDs)
stripeProductId: item.stripePriceId,

// ✅ Explains business logic
// Generated column - automatically calculated as max_quantity - sold_quantity
availableQuantity: integer("available_quantity").generatedAlwaysAs(...)

// ✅ Explains design pattern
// Snapshot pattern - preserve historical pricing even if product price changes
unitPrice: orderItem.unitPrice,

// ✅ Explains constraint
// Must be nullable - unlimited inventory has no max quantity
maxQuantity: integer("max_quantity"),

// ✅ Explains edge case
// Null check required - unlimited inventory returns null available quantity
if (availableQuantity === null) {
  return 'In Stock'; // Unlimited
}
```

### Bad Comments - Timeline Markers (Will Be Blocked)

```typescript
// ❌ Phase markers
// Phase 2.5.1: Stripe product/price refactor
// Added in Phase 2.3
// v1.0: New checkout flow

// ❌ Deprecation notices
// DEPRECATED: Use stripePriceId instead
// TODO: Remove after migration
// Legacy field (keep for 30 days)

// ❌ Implementation dates
// Added: 2025-10-28
// Created during Phase 2.4

// ❌ Version markers
// @since v1.0.0
// @deprecated in v2.0.0
```

---

## Field Naming (Pre-Launch)

### Clean Slate - No Backward Compatibility

```typescript
// ✅ RIGHT - Just the correct field
interface CartItem {
  stripePriceId: string; // Stripe Price ID for checkout session
}

// ❌ WRONG - Keeping old field around
interface CartItem {
  stripeProductId?: string; // DEPRECATED: Use stripePriceId
  stripePriceId: string;
}
```

**Why:** We're pre-launch. No users. No data to migrate. No need for backward compatibility.

**Post-launch (future):** Then we'd need deprecation paths. Not now.

---

## Database Schema

### Column Definitions

```typescript
// ✅ RIGHT - Clean, descriptive
export const products = pgTable('products', {
  stripePriceId: text("stripe_price_id"), // Stripe Price ID (for products without variants)
  maxQuantity: integer("max_quantity"),   // Max inventory (null = unlimited)
});

// ❌ WRONG - Phase markers
export const products = pgTable('products', {
  stripePriceId: text("stripe_price_id"), // Phase 2.5.1: New architecture
  maxQuantity: integer("max_quantity"),   // Phase 2.4.5: Inventory tracking
});
```

### Generated Columns

```typescript
// ✅ RIGHT - Explain calculation
availableQuantity: integer("available_quantity").generatedAlwaysAs(
  sql`CASE WHEN max_quantity IS NULL THEN NULL ELSE max_quantity - sold_quantity END`
), // Calculated: max_quantity - sold_quantity (null = unlimited)

// ❌ WRONG - Timeline context
availableQuantity: integer("available_quantity").generatedAlwaysAs(
  sql`CASE WHEN max_quantity IS NULL THEN NULL ELSE max_quantity - sold_quantity END`
), // Added in Phase 2.4.5 for inventory tracking
```

---

## Console Logging

### Where Console Is Allowed

```typescript
// ✅ ALLOWED - Tests
// tests/**/*.test.ts
console.log('Test fixture:', product);
expect(result).toBe(expected);

// ✅ ALLOWED - Scripts
// scripts/**/*.ts
console.log('✅ Synced products:', results.length);
console.error('❌ Sync failed:', error.message);

// ✅ ALLOWED - React Error Boundaries (if needed)
// components/**/ErrorBoundary.tsx
console.error('Component error:', error, errorInfo);
```

### Where Console Is Blocked

```typescript
// ❌ BLOCKED - Production code
// app/**/*.ts, components/**/*.tsx, lib/**/*.ts
console.log('Debug:', data);        // Use logger.debug()
console.error('Error:', error);     // Use logger.error()
console.warn('Warning:', message);  // Use logger.warn()
```

### Use Logger Instead

```typescript
// ✅ RIGHT - Production code
import { logger } from '@/lib/utils/logger';

logger.debug('Processing checkout', { sessionId, items });
logger.info('Order created', { orderId, total });
logger.warn('Low inventory', { productId, remaining });
logger.error('Payment failed', { error, sessionId });
```

---

## Type Definitions

### Interface Documentation

```typescript
// ✅ RIGHT - Explain purpose and constraints
/**
 * Cart item representation for checkout session
 * Includes Stripe Price ID for payment processing
 */
export interface CartItem {
  productId: string;
  variantId?: string;
  stripePriceId: string;  // Stripe Price ID for checkout session
  quantity: number;
  price: number;          // Price in cents
}

// ❌ WRONG - Timeline context
/**
 * Cart item representation (Phase 2.4 checkout flow)
 * Updated in Phase 2.5.1 to use Price IDs instead of Product IDs
 */
export interface CartItem {
  stripePriceId: string;  // Phase 2.5.1: Renamed from stripeProductId
}
```

---

## Zod Schemas

### Validation Schemas

```typescript
// ✅ RIGHT - Explain validation rules
export const ProductConfigSchema = z.object({
  stripe_product_id: z.string().min(1).optional(), // For products with variants (parent product)
  stripe_price_id: z.string().min(1).optional(),   // For products without variants (single price)
});

// ❌ WRONG - Phase markers
export const ProductConfigSchema = z.object({
  stripe_product_id: z.string().min(1).optional(), // Phase 2.5.1: New architecture
  stripe_price_id: z.string().min(1).optional(),   // Phase 2.5.1: Single-price products
});
```

---

## API Routes

### Response Comments

```typescript
// ✅ RIGHT - Explain API contract
export async function POST(request: NextRequest) {
  // Stripe API expects 'product' field in line_items (accepts both product and price IDs)
  const stripeItems = items.map((item) => ({
    stripeProductId: item.stripePriceId, // Field name required by Stripe
    quantity: item.quantity,
  }));
}

// ❌ WRONG - Timeline context
export async function POST(request: NextRequest) {
  // Phase 2.5.1: Using stripePriceId after architecture refactor
  const stripeItems = items.map((item) => ({
    stripeProductId: item.stripePriceId, // Actually contains Price ID after Phase 2.5.1
    quantity: item.quantity,
  }));
}
```

---

## Test Code

### Test Comments

```typescript
// ✅ RIGHT - Explain test scenario
it('should create parent product with multiple variant prices', async () => {
  // Founder Edition has 3 color variants (BLACK, WHITE, RED)
  // Should create 1 product in Stripe with 3 prices
  const result = await syncProductToStripe(product, variants);
  expect(result.variantPrices).toHaveLength(3);
});

// ❌ WRONG - Phase markers in tests
it('should create parent product with multiple variant prices (Phase 2.5.1)', async () => {
  // Phase 2.5.1: Test new architecture
  const result = await syncProductToStripe(product, variants);
});
```

---

## Pre-Commit Checklist

Before committing ANY code, verify:

### Automated Checks
- [ ] `npm run type-check` passes (0 errors)
- [ ] `npm run lint` passes (0 errors)
- [ ] `npm test` passes (0 failures)
- [ ] `npm run build` succeeds

### Manual Code Review
- [ ] No "Phase X.X" anywhere in code
- [ ] No "DEPRECATED" comments
- [ ] No "TODO: Remove after..." markers
- [ ] No backward compatibility fields
- [ ] No console.log in app/, components/, lib/
- [ ] Comments explain "why", not "when"
- [ ] Code looks timeless (as if always correct)

### ESLint Will Catch
- Phase markers in comments
- DEPRECATED keywords
- console.log in production code (if configured)

### Dr. Clean Will Catch (Code Review)
- Backward compatibility code
- Migration markers
- Implementation date comments
- Documentation drift

---

## Why These Rules Exist

### Pre-Launch = Clean Slate Freedom

**Current reality:**
- ❌ No users yet
- ❌ No production data
- ❌ No deployed systems
- ❌ No backward compatibility needed

**This means:**
- ✅ Can change anything freely
- ✅ Can break schemas boldly
- ✅ Code should look perfect from day one
- ✅ No need for migration paths

### Post-Launch (Future State)

**After we launch:**
- Then deprecation notices make sense
- Then migration paths are required
- Then backward compatibility is needed
- Then phase markers might be useful

**Right now:** Write code that looks timeless and correct from the start.

---

## Philosophy

> **"If you can simplify it, do. If you can delete it, better."**
>
> — Dr. Clean

**Applied to code style:**
- Delete phase markers → Simplifies
- Delete deprecation notices → Better
- Delete backward compatibility code → Best

Pre-launch is the time to be ruthless. No cruft. Clean slate.

---

## Quick Examples

### Schema Field

```typescript
// ❌ WRONG
stripePriceId: text("stripe_price_id"), // Phase 2.5.1: Renamed from stripe_product_id

// ✅ RIGHT
stripePriceId: text("stripe_price_id"), // Stripe Price ID for variant
```

### Interface Field

```typescript
// ❌ WRONG
stripePriceId: string; // Phase 2.5.1: Stripe Price ID (renamed from stripeProductId)

// ✅ RIGHT
stripePriceId: string; // Stripe Price ID for checkout session
```

### Function Comment

```typescript
// ❌ WRONG
// Phase 2.5.1: Create prices instead of products for variants
export async function syncProductToStripe() { }

// ✅ RIGHT
// Creates Stripe product with multiple prices (one per variant)
export async function syncProductToStripe() { }
```

---

## Related Documents

- [DOCTOR_CLEAN.md](./agents/DOCTOR_CLEAN.md) - Quality enforcement rules
- [DOCTOR_LEANDEV.md](./agents/DOCTOR_LEANDEV.md) - TDD implementation guidelines
- [CLAUDE.md](../CLAUDE.md) - Project context and rules
- [TESTING_STRATEGY.md](./TESTING_STRATEGY.md) - Test patterns

---

**Remember:** Code should look like it was designed correctly from the beginning. No timeline markers. No backward compatibility cruft. Clean slate.
