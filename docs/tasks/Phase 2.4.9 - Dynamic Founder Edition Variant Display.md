# Phase 2.4.9 - Dynamic Founder Edition Variant Display

**Type:** Enhancement - Data-Driven UI
**Priority:** HIGH
**Status:** 🔴 Implemented Without TDD (Needs Validation)
**Estimated Effort:** 2-3 hours (with proper TDD)
**Dependencies:** Phase 2.4.6 (Product Data Normalization), Phase 2.4.7 (Launch Injection)
**Grooming Status:** ⚠️ Reverse Engineered from Implementation

---

## Overview

Replace hardcoded Founder Edition product cards with dynamic variant rendering that fetches actual variant data (BLACK/WHITE/RED) and displays real-time availability counts from the database.

### Goals

1. **Dynamic Variant Rendering:** Fetch and display actual Founder Edition variants instead of duplicating the same product card 3 times
2. **Real Availability Data:** Show actual `availableQuantity` from database instead of hardcoded values (500, 300, 200)
3. **Variant-Specific Display:** Pass `variantName` to ProductCard for proper variant-specific rendering
4. **DRY Principle:** Eliminate duplicate code on homepage and products page

---

## Problem Statement

**Current State (Before Phase 2.4.9):**
```typescript
// Homepage (app/page.tsx) - BEFORE
{founderEdition && (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
    <ProductCard product={founderEdition} />
    <ProductCard product={founderEdition} />
    <ProductCard product={founderEdition} />
  </div>
)}
```

**Issues:**
- Same product card duplicated 3 times
- No variant differentiation (BLACK/WHITE/RED not shown)
- Hardcoded availability badges (500, 300, 200)
- Not using actual database variant data
- Variants not being fetched from database

**Solution:**
Fetch product with variants using `getProductWithVariants()` and map over actual variant data.

---

## Implementation Changes (Reverse Engineered)

### Change 1: Homepage - Dynamic Variant Rendering

**File:** `app/page.tsx`

**Before:**
```typescript
const founderEdition = products.find((p) => p.hasVariants === true);

// ... in JSX:
{founderEdition && (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
    <ProductCard product={founderEdition} />
    <ProductCard product={founderEdition} />
    <ProductCard product={founderEdition} />
  </div>
)}
```

**After:**
```typescript
import { getAllProducts, getProductWithVariants } from "@/lib/services/product-service";

const founderEdition = products.find((p) => p.hasVariants === true);

// Fetch Founder Edition with variants if it exists
const founderEditionWithVariants = founderEdition
  ? await getProductWithVariants(founderEdition.id)
  : null;

// ... in JSX:
{founderEditionWithVariants && (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
    {founderEditionWithVariants.variants.map((variant) => (
      <ProductCard
        key={variant.id}
        product={founderEditionWithVariants}
        variantName={variant.variantValue}
      />
    ))}
  </div>
)}
```

**Changes:**
- Import `getProductWithVariants` from product-service
- Call `getProductWithVariants(founderEdition.id)` to fetch variants
- Map over `variants` array instead of duplicating ProductCard
- Pass `variantName={variant.variantValue}` to ProductCard
- Use `key={variant.id}` for proper React list rendering

---

### Change 2: Products Page - Dynamic Variant Rendering with Availability Badges

**File:** `app/products/page.tsx`

**Before:**
```typescript
const founderEdition = products.find(p => p.hasVariants === true);

// ... in JSX:
{founderEdition && (
  <div className="bg-gray-50 border-2 border-gray-300 p-10 mb-16">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="relative">
        <ProductCard product={founderEdition} />
        <Badge variant="limited" className="absolute top-4 left-4">
          500 Available
        </Badge>
      </div>
      <div className="relative">
        <ProductCard product={founderEdition} />
        <Badge variant="limited" className="absolute top-4 left-4">
          300 Available
        </Badge>
      </div>
      <div className="relative">
        <ProductCard product={founderEdition} />
        <Badge variant="limited" className="absolute top-4 left-4">
          200 Available
        </Badge>
      </div>
    </div>
  </div>
)}
```

**After:**
```typescript
import { getAllProducts, getProductWithVariants } from "@/lib/services/product-service";

const founderEdition = products.find(p => p.hasVariants === true);

// Fetch Founder Edition with variants if it exists
const founderEditionWithVariants = founderEdition
  ? await getProductWithVariants(founderEdition.id)
  : null;

// ... in JSX:
{founderEditionWithVariants && (
  <div className="bg-gray-50 border-2 border-gray-300 p-10 mb-16">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {founderEditionWithVariants.variants.map((variant) => (
        <div key={variant.id} className="relative">
          <ProductCard
            product={founderEditionWithVariants}
            variantName={variant.variantValue}
          />
          <Badge variant="limited" className="absolute top-4 left-4">
            {variant.availableQuantity ?? 0} Available
          </Badge>
        </div>
      ))}
    </div>
  </div>
)}
```

**Changes:**
- Import `getProductWithVariants` from product-service
- Call `getProductWithVariants(founderEdition.id)` to fetch variants
- Map over `variants` array instead of duplicating 3 divs
- Pass `variantName={variant.variantValue}` to ProductCard
- Use dynamic `{variant.availableQuantity ?? 0}` instead of hardcoded values
- Use `key={variant.id}` for proper React list rendering

---

## Test Specification (TDD Approach - MISSING)

**⚠️ WARNING: These tests were NOT written before implementation.**

### Test 1: Homepage - Fetch Founder Edition with Variants

**File:** `tests/unit/app/page.test.tsx`

```typescript
describe('HomePage - Founder Edition Section', () => {
  it('should fetch founder edition with variants when hasVariants is true', async () => {
    const mockProducts = [
      createMockProduct({ id: 'prod-1', name: 'Regular', hasVariants: false }),
      createMockProduct({ id: 'founder', name: 'Founder Edition', hasVariants: true }),
    ];

    const mockFounderWithVariants = {
      ...mockProducts[1],
      variants: [
        createMockVariant({ id: 'var-1', variantValue: 'BLACK', availableQuantity: 500 }),
        createMockVariant({ id: 'var-2', variantValue: 'WHITE', availableQuantity: 300 }),
        createMockVariant({ id: 'var-3', variantValue: 'RED', availableQuantity: 200 }),
      ],
    };

    vi.mocked(getAllProducts).mockResolvedValue(mockProducts);
    vi.mocked(getProductWithVariants).mockResolvedValue(mockFounderWithVariants);

    // Render and verify
    // (Note: This is a server component, so testing approach may differ)
  });

  it('should not call getProductWithVariants when no product has variants', async () => {
    const mockProducts = [
      createMockProduct({ id: 'prod-1', name: 'Regular 1', hasVariants: false }),
      createMockProduct({ id: 'prod-2', name: 'Regular 2', hasVariants: false }),
    ];

    vi.mocked(getAllProducts).mockResolvedValue(mockProducts);
    vi.mocked(getProductWithVariants).mockResolvedValue(null);

    // Verify getProductWithVariants was not called
    expect(getProductWithVariants).not.toHaveBeenCalled();
  });

  it('should render a ProductCard for each variant', async () => {
    // Test that 3 ProductCards are rendered (one for each variant)
    // Verify each has correct variantName prop
  });
});
```

### Test 2: Products Page - Variant Cards with Availability Badges

**File:** `tests/unit/app/products/page.test.tsx`

```typescript
describe('ProductsPage - Founder Edition Section', () => {
  it('should fetch founder edition with variants', async () => {
    const mockFounderWithVariants = createMockProductWithVariants({
      id: 'founder',
      name: 'Founder Edition',
      variants: [
        { id: 'var-1', variantValue: 'BLACK', availableQuantity: 500 },
        { id: 'var-2', variantValue: 'WHITE', availableQuantity: 300 },
        { id: 'var-3', variantValue: 'RED', availableQuantity: 200 },
      ],
    });

    vi.mocked(getProductWithVariants).mockResolvedValue(mockFounderWithVariants);

    // Render and verify
  });

  it('should display availability badge for each variant', async () => {
    // Verify Badge shows "{availableQuantity} Available"
    // Test that variant.availableQuantity is used, not hardcoded value
  });

  it('should handle null availableQuantity gracefully', async () => {
    const mockVariant = createMockVariant({
      id: 'var-1',
      variantValue: 'BLACK',
      availableQuantity: null,
    });

    // Verify badge shows "0 Available" when availableQuantity is null
  });

  it('should pass variantName to ProductCard for each variant', async () => {
    // Verify ProductCard receives variantName="BLACK", "WHITE", "RED"
  });
});
```

### Test 3: Integration Test - Variant Data Flow

**File:** `tests/integration/variant-display.test.ts`

```typescript
describe('Founder Edition Variant Display - Integration', () => {
  beforeEach(async () => {
    await db.delete(products);
    await db.delete(variants);
  });

  it('should fetch and display all variants with availability', async () => {
    // Insert Founder Edition product with 3 variants
    await db.insert(products).values(
      createMockDbProduct({
        id: 'founder',
        name: 'Founder Edition',
        hasVariants: true,
      })
    );

    await db.insert(variants).values([
      createMockDbVariant({ productId: 'founder', variantValue: 'BLACK', maxQuantity: 500, soldQuantity: 0 }),
      createMockDbVariant({ productId: 'founder', variantValue: 'WHITE', maxQuantity: 300, soldQuantity: 0 }),
      createMockDbVariant({ productId: 'founder', variantValue: 'RED', maxQuantity: 200, soldQuantity: 0 }),
    ]);

    // Fetch product with variants
    const result = await getProductWithVariants('founder');

    // Verify all 3 variants returned
    expect(result.variants).toHaveLength(3);
    expect(result.variants[0].availableQuantity).toBe(500);
    expect(result.variants[1].availableQuantity).toBe(300);
    expect(result.variants[2].availableQuantity).toBe(200);
  });
});
```

---

## Acceptance Criteria

**Functional Requirements:**
- [ ] Homepage displays 3 Founder Edition cards (BLACK, WHITE, RED) dynamically from database
- [ ] Products page displays 3 Founder Edition cards with availability badges
- [ ] Availability badges show actual database values (not hardcoded)
- [ ] ProductCard receives `variantName` prop for each variant
- [ ] No duplicate ProductCard components in JSX
- [ ] Handles case where no product has variants (no crash)
- [ ] Handles null `availableQuantity` gracefully (shows "0 Available")

**Technical Requirements:**
- [ ] Uses `getProductWithVariants()` service function
- [ ] Properly maps over `variants` array
- [ ] Uses React `key` prop for list items
- [ ] Conditional rendering with `founderEditionWithVariants && ...`
- [ ] Null coalescing for `availableQuantity ?? 0`

**Quality Gates:**
- [ ] All tests written BEFORE implementation (TDD RED phase)
- [ ] All tests passing after implementation (TDD GREEN phase)
- [ ] TypeScript: 0 errors
- [ ] Lint: 0 errors
- [ ] Production build succeeds
- [ ] No visual regressions on homepage or products page

---

## TDD Violations Identified

**⚠️ CRITICAL: Implementation was done WITHOUT following TDD workflow.**

**Violations:**
1. ❌ No tests written before implementation
2. ❌ No RED phase (failing tests)
3. ❌ Implementation written first, tests missing entirely
4. ❌ No verification that changes don't break existing functionality

**Required Remediation:**
1. Write all tests specified above (RED phase)
2. Verify implementation passes tests (GREEN phase)
3. Refactor if needed (REFACTOR phase)
4. Run quality gates (type-check, lint, build)

---

## Files Changed

**Modified (2 files):**
- `app/page.tsx` - Added variant fetching and dynamic rendering
- `app/products/page.tsx` - Added variant fetching and dynamic rendering with badges

**Tests to Create (3 files):**
- `tests/unit/app/page.test.tsx` - Update with variant rendering tests
- `tests/unit/app/products/page.test.tsx` - Update with variant rendering tests
- `tests/integration/variant-display.test.ts` - New integration test

**Lines Changed:**
- Homepage: +7 lines, -3 lines (net +4)
- Products page: +9 lines, -26 lines (net -17)
- **Total: ~30 lines changed**

---

## Risk Assessment

**Low Risk:**
- ✅ Small, focused change (2 files, ~30 lines)
- ✅ Uses existing `getProductWithVariants()` function
- ✅ No new database changes

**Medium Risk:**
- ⚠️ No tests exist to verify behavior
- ⚠️ Could break if `getProductWithVariants()` returns unexpected structure
- ⚠️ Could crash if variant data is missing

**High Risk:**
- 🔴 **TDD workflow was violated** - no safety net of tests
- 🔴 **No verification that existing functionality still works**
- 🔴 **Could have introduced bugs that won't be caught until production**

---

## Recommended Next Steps

1. **IMMEDIATE: Write tests** (follow TDD spec above)
2. **VERIFY: Run all quality gates** (tests, type-check, lint, build)
3. **VALIDATE: Manual testing** (check homepage and products page in browser)
4. **UPDATE: Director profile** to enforce TDD discipline

---

## Status: 🔴 Implemented Without TDD - Needs Validation

**Created:** 2025-10-31 (Reverse Engineered)
**Implemented By:** Director (without TDD)
**Needs:** Test coverage, TDD validation, quality gate verification

---

## Lessons Learned

**For Director Profile Update:**
- Must write tests BEFORE implementation (even for "quick changes")
- Must run quality gates BEFORE marking complete
- Must follow TDD workflow for ALL code changes, regardless of size
- "Small change" doesn't mean "skip TDD"
