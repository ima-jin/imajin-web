# Phase 2.5: Real-Time Inventory Management

**Type:** Feature Enhancement - User Experience
**Priority:** HIGH - Improves trust and conversion
**Estimated Effort:** 8-12 hours (1-2 days)
**Dependencies:** Phase 2.4.5 (Product-Level Inventory)
**Blocks:** Phase 2.6 (Testing), MVP Launch

---

## Context

### The Problem

Currently (after Phase 2.4):
- Inventory data is static - users see stale counts
- No "Sold Out" indicators on product cards
- No "Only X remaining" urgency messaging
- Users could add out-of-stock items to cart (caught at checkout, but poor UX)
- No indication when items are running low

### The Solution

Build **real-time inventory display system** that:
1. Shows accurate stock counts that update automatically
2. Displays "Sold Out" badges on unavailable products
3. Shows "Only X remaining!" for low stock items
4. Polls server every 10 seconds for fresh inventory data
5. Provides visual feedback for stale data

---

## Prerequisites

### Phase 2.4.5 Must Be Complete

**Before starting Phase 2.5, complete Phase 2.4.5:**

Phase 2.4.5 adds product-level inventory tracking by:
- ✅ Adding `max_quantity`, `sold_quantity`, `available_quantity`, `is_available` to products table
- ✅ Updating products.json with inventory data
- ✅ Updating order service to increment both product and variant sold_quantity
- ✅ Updating product mapper to include inventory fields
- ✅ Dropping database and re-importing with new schema

**Verify Phase 2.4.5 completion:**
```sql
-- Check products table has inventory columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'products'
  AND column_name IN ('max_quantity', 'sold_quantity', 'available_quantity', 'is_available');
-- Should return 4 rows

-- Check Founder Edition has correct inventory
SELECT id, name, max_quantity, sold_quantity, available_quantity, is_available
FROM products
WHERE id = 'Unit-8x8x8-Founder';
-- Should show: max_quantity = 1000, sold_quantity = 0, available_quantity = 1000, is_available = true

-- Check unlimited inventory product
SELECT id, name, max_quantity, sold_quantity, available_quantity, is_available
FROM products
WHERE id = 'Material-8x8-V';
-- Should show: max_quantity = NULL, sold_quantity = 0, available_quantity = NULL, is_available = true
```

---

## Objectives

1. **Create Inventory API** - Lightweight endpoint for real-time data
2. **Build Polling Hook** - React hook that fetches inventory every 10s
3. **Create Stock Indicator Component** - Visual display of availability
4. **Update Product Components** - Show real-time inventory
5. **Add Low Stock Warnings** - Create urgency for limited items
6. **Handle Sold Out State** - Disable purchase for unavailable items
7. **Add Stale Data Indicator** - Show when data is old

---

## Scope

### Files to Create (6 new files)

1. `/app/api/inventory/[productId]/route.ts` - Inventory API endpoint
2. `/lib/hooks/useInventory.ts` - Polling hook for real-time updates
3. `/lib/services/inventory-service.ts` - Business logic for inventory
4. `/components/products/StockIndicator.tsx` - Stock display component
5. `/components/products/LowStockWarning.tsx` - Urgency messaging
6. `/components/products/SoldOutBadge.tsx` - Sold out indicator

### Files to Modify (6 existing files)

1. `/components/products/ProductCard.tsx` - Add stock indicator
2. `/components/products/LimitedEditionBadge.tsx` - Enhance with sold-out state
3. `/components/products/ProductAddToCart.tsx` - Use real-time data, disable when sold out
4. `/app/products/[id]/page.tsx` - Use polling hook
5. `/app/products/page.tsx` - Show sold-out on listing
6. `/lib/services/order-service.ts` - Ensure both levels increment (verify migration)

### Test Files to Create (6 new test files)

1. `/tests/unit/lib/hooks/useInventory.test.ts`
2. `/tests/unit/lib/services/inventory-service.test.ts`
3. `/tests/unit/components/products/StockIndicator.test.tsx`
4. `/tests/integration/api/inventory.test.ts`
5. `/tests/integration/inventory/real-time-updates.test.ts`
6. `/tests/smoke/inventory.spec.ts`

---

## Implementation Plan

### Step 1: Create Inventory Service (1 hour)

**File:** `/lib/services/inventory-service.ts`

```typescript
import { db } from '@/lib/db';
import { products, variants } from '@/db/schema';
import { eq } from 'drizzle-orm';

export interface ProductInventory {
  productId: string;
  maxQuantity: number | null;
  soldQuantity: number;
  availableQuantity: number | null;
  isAvailable: boolean;
  variants?: VariantInventory[];
}

export interface VariantInventory {
  variantId: string;
  variantValue: string;
  maxQuantity: number | null;
  soldQuantity: number;
  availableQuantity: number | null;
  isAvailable: boolean;
}

/**
 * Gets current inventory for a product
 */
export async function getProductInventory(
  productId: string
): Promise<ProductInventory | null> {
  // Get product inventory
  const [product] = await db
    .select({
      id: products.id,
      maxQuantity: products.maxQuantity,
      soldQuantity: products.soldQuantity,
      availableQuantity: products.availableQuantity,
      isAvailable: products.isAvailable,
      hasVariants: products.hasVariants,
    })
    .from(products)
    .where(eq(products.id, productId));

  if (!product) {
    return null;
  }

  // Get variant inventory if product has variants
  let variantInventory: VariantInventory[] | undefined;

  if (product.hasVariants) {
    const dbVariants = await db
      .select({
        id: variants.id,
        variantValue: variants.variantValue,
        maxQuantity: variants.maxQuantity,
        soldQuantity: variants.soldQuantity,
        availableQuantity: variants.availableQuantity,
        isAvailable: variants.isAvailable,
      })
      .from(variants)
      .where(eq(variants.productId, productId));

    variantInventory = dbVariants.map((v) => ({
      variantId: v.id,
      variantValue: v.variantValue,
      maxQuantity: v.maxQuantity,
      soldQuantity: v.soldQuantity,
      availableQuantity: v.availableQuantity,
      isAvailable: v.isAvailable,
    }));
  }

  return {
    productId: product.id,
    maxQuantity: product.maxQuantity,
    soldQuantity: product.soldQuantity,
    availableQuantity: product.availableQuantity,
    isAvailable: product.isAvailable,
    variants: variantInventory,
  };
}

/**
 * Checks if product or variant is available for purchase
 */
export function isInventoryAvailable(
  inventory: ProductInventory,
  variantId?: string
): boolean {
  // Check product-level availability
  if (!inventory.isAvailable) {
    return false;
  }

  // If variant specified, check variant-level availability
  if (variantId && inventory.variants) {
    const variant = inventory.variants.find((v) => v.variantId === variantId);
    return variant?.isAvailable ?? false;
  }

  return true;
}

/**
 * Checks if inventory is low (under threshold)
 */
export function isLowStock(
  availableQuantity: number | null,
  threshold: number = 10
): boolean {
  if (availableQuantity === null) {
    return false; // Unlimited stock
  }
  return availableQuantity > 0 && availableQuantity <= threshold;
}

/**
 * Formats stock message for display
 */
export function getStockMessage(
  availableQuantity: number | null,
  isAvailable: boolean
): string {
  if (!isAvailable) {
    return 'Sold Out';
  }

  if (availableQuantity === null) {
    return 'In Stock';
  }

  if (isLowStock(availableQuantity)) {
    return `Only ${availableQuantity} remaining!`;
  }

  return `${availableQuantity} available`;
}
```

---

### Step 2: Create Inventory API Route (30 minutes)

**File:** `/app/api/inventory/[productId]/route.ts`

```typescript
import { NextRequest } from 'next/server';
import { getProductInventory } from '@/lib/services/inventory-service';
import {
  successResponse,
  notFoundResponse,
  handleUnknownError,
} from '@/lib/utils/api-response';
import { HTTP_STATUS } from '@/lib/config/api';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;

    const inventory = await getProductInventory(productId);

    if (!inventory) {
      return notFoundResponse('Product');
    }

    return successResponse(inventory, HTTP_STATUS.OK);
  } catch (error) {
    return handleUnknownError(error, 'Failed to fetch inventory');
  }
}

// Optional: Batch endpoint for multiple products
export async function POST(request: NextRequest) {
  try {
    const { productIds } = await request.json();

    if (!Array.isArray(productIds)) {
      return badRequestResponse('productIds must be an array');
    }

    const inventories = await Promise.all(
      productIds.map((id) => getProductInventory(id))
    );

    const results = inventories.filter((inv) => inv !== null);

    return successResponse(results, HTTP_STATUS.OK);
  } catch (error) {
    return handleUnknownError(error, 'Failed to fetch inventories');
  }
}
```

---

### Step 3: Create Polling Hook (1 hour)

**File:** `/lib/hooks/useInventory.ts`

```typescript
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiGet } from '@/lib/utils/api-client';
import { z } from 'zod';
import type { ProductInventory } from '@/lib/services/inventory-service';

const VariantInventorySchema = z.object({
  variantId: z.string(),
  variantValue: z.string(),
  maxQuantity: z.number().nullable(),
  soldQuantity: z.number(),
  availableQuantity: z.number().nullable(),
  isAvailable: z.boolean(),
});

const ProductInventorySchema = z.object({
  productId: z.string(),
  maxQuantity: z.number().nullable(),
  soldQuantity: z.number(),
  availableQuantity: z.number().nullable(),
  isAvailable: z.boolean(),
  variants: z.array(VariantInventorySchema).optional(),
});

interface UseInventoryOptions {
  pollInterval?: number; // Milliseconds between polls (default: 10000)
  enabled?: boolean; // Enable/disable polling (default: true)
  staleThreshold?: number; // Milliseconds before data is considered stale (default: 30000)
}

interface UseInventoryResult {
  inventory: ProductInventory | null;
  isLoading: boolean;
  isStale: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  lastUpdated: Date | null;
}

export function useInventory(
  productId: string,
  options: UseInventoryOptions = {}
): UseInventoryResult {
  const {
    pollInterval = 10000, // 10 seconds
    enabled = true,
    staleThreshold = 30000, // 30 seconds
  } = options;

  const [inventory, setInventory] = useState<ProductInventory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStale, setIsStale] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const staleTimeoutRef = useRef<NodeJS.Timeout>();

  const fetchInventory = useCallback(async () => {
    if (!productId) return;

    try {
      const data = await apiGet(
        `/api/inventory/${productId}`,
        ProductInventorySchema
      );

      setInventory(data);
      setLastUpdated(new Date());
      setIsStale(false);
      setError(null);

      // Reset stale timer
      if (staleTimeoutRef.current) {
        clearTimeout(staleTimeoutRef.current);
      }

      staleTimeoutRef.current = setTimeout(() => {
        setIsStale(true);
      }, staleThreshold);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch inventory'));
      console.error('Inventory fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [productId, staleThreshold]);

  useEffect(() => {
    if (!enabled) return;

    let pollIntervalId: NodeJS.Timeout;

    // Initial fetch
    fetchInventory();

    // Set up polling
    pollIntervalId = setInterval(fetchInventory, pollInterval);

    return () => {
      clearInterval(pollIntervalId);
      if (staleTimeoutRef.current) {
        clearTimeout(staleTimeoutRef.current);
      }
    };
  }, [enabled, fetchInventory, pollInterval]);

  return {
    inventory,
    isLoading,
    isStale,
    error,
    refresh: fetchInventory,
    lastUpdated,
  };
}
```

---

### Step 4: Create Stock Indicator Components (1-2 hours)

**File:** `/components/products/StockIndicator.tsx`

```typescript
import { Badge } from '@/components/ui/Badge';

interface StockIndicatorProps {
  availableQuantity: number | null;
  isAvailable: boolean;
  isLowStock?: boolean;
  className?: string;
}

export function StockIndicator({
  availableQuantity,
  isAvailable,
  isLowStock = false,
  className = '',
}: StockIndicatorProps) {
  // Sold out
  if (!isAvailable) {
    return (
      <Badge variant="danger" className={className}>
        Sold Out
      </Badge>
    );
  }

  // Unlimited inventory
  if (availableQuantity === null) {
    return (
      <Badge variant="success" className={className}>
        In Stock
      </Badge>
    );
  }

  // Low stock
  if (isLowStock) {
    return (
      <Badge variant="warning" className={className}>
        Only {availableQuantity} remaining!
      </Badge>
    );
  }

  // Normal stock
  return (
    <Badge variant="default" className={className}>
      {availableQuantity} available
    </Badge>
  );
}
```

**File:** `/components/products/LowStockWarning.tsx`

```typescript
import { Text } from '@/components/ui/Text';

interface LowStockWarningProps {
  availableQuantity: number;
  className?: string;
}

export function LowStockWarning({
  availableQuantity,
  className = '',
}: LowStockWarningProps) {
  return (
    <div className={`bg-yellow-50 border border-yellow-200 rounded-md p-3 ${className}`}>
      <div className="flex items-start">
        <svg
          className="w-5 h-5 text-yellow-600 mt-0.5"
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
        <div className="ml-3">
          <Text className="text-sm font-medium text-yellow-800">
            Only {availableQuantity} {availableQuantity === 1 ? 'unit' : 'units'} remaining
          </Text>
          <Text className="text-sm text-yellow-700 mt-1">
            This is a limited edition item. Order soon before it sells out.
          </Text>
        </div>
      </div>
    </div>
  );
}
```

**File:** `/components/products/SoldOutBadge.tsx`

```typescript
import { Badge } from '@/components/ui/Badge';

interface SoldOutBadgeProps {
  className?: string;
}

export function SoldOutBadge({ className = '' }: SoldOutBadgeProps) {
  return (
    <Badge variant="danger" className={`absolute top-2 right-2 ${className}`}>
      Sold Out
    </Badge>
  );
}
```

---

### Step 5: Update Product Components (2-3 hours)

**File:** `/components/products/ProductCard.tsx` (UPDATE)

```typescript
'use client';

import { Card } from '@/components/ui/Card';
import { Heading } from '@/components/ui/Heading';
import { Price } from '@/components/ui/Price';
import { Badge } from '@/components/ui/Badge';
import { StockIndicator } from './StockIndicator';
import { SoldOutBadge } from './SoldOutBadge';
import { LimitedEditionBadge } from './LimitedEditionBadge';
import { useInventory } from '@/lib/hooks/useInventory';
import { isLowStock } from '@/lib/services/inventory-service';
import Link from 'next/link';
import type { Product } from '@/types/product';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  // Use real-time inventory
  const { inventory, isStale } = useInventory(product.id);

  const showSoldOut = inventory && !inventory.isAvailable;
  const showLowStock = inventory && isLowStock(inventory.availableQuantity);

  return (
    <Link href={`/products/${product.id}`}>
      <Card className="relative hover:shadow-lg transition-shadow">
        {/* Sold Out Badge */}
        {showSoldOut && <SoldOutBadge />}

        {/* Product Image */}
        <div className="aspect-square bg-gray-100 rounded-t-lg">
          {/* Image will go here */}
        </div>

        <div className="p-4 space-y-2">
          {/* Name */}
          <Heading level={3}>{product.name}</Heading>

          {/* Price */}
          <Price cents={product.basePrice} className="text-lg font-semibold" />

          {/* Badges */}
          <div className="flex gap-2 flex-wrap">
            {product.requiresAssembly && (
              <Badge variant="default">Requires Assembly</Badge>
            )}
            {product.hasVariants && (
              <LimitedEditionBadge
                variant={product.variants?.[0]}
                isAvailable={inventory?.isAvailable ?? true}
              />
            )}
          </div>

          {/* Stock Indicator */}
          {inventory && (
            <StockIndicator
              availableQuantity={inventory.availableQuantity}
              isAvailable={inventory.isAvailable}
              isLowStock={showLowStock}
            />
          )}

          {/* Stale Data Indicator */}
          {isStale && (
            <Text className="text-xs text-gray-500">
              Stock info may be outdated
            </Text>
          )}
        </div>
      </Card>
    </Link>
  );
}
```

**File:** `/components/products/ProductAddToCart.tsx` (UPDATE)

```typescript
'use client';

import { useState } from 'react';
import { useCart } from '@/components/cart/CartProvider';
import { useToast } from '@/components/toast/ToastProvider';
import { useInventory } from '@/lib/hooks/useInventory';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { LowStockWarning } from './LowStockWarning';
import { isLowStock, isInventoryAvailable } from '@/lib/services/inventory-service';
import type { Product, Variant } from '@/types/product';

interface ProductAddToCartProps {
  product: Product;
}

export function ProductAddToCart({ product }: ProductAddToCartProps) {
  const { addItem } = useCart();
  const { showSuccess, showError } = useToast();
  const { inventory } = useInventory(product.id);

  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>(
    product.variants?.[0]?.id
  );
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  // Check availability
  const isAvailable = inventory
    ? isInventoryAvailable(inventory, selectedVariantId)
    : true;

  // Get selected variant inventory
  const selectedVariant = inventory?.variants?.find(
    (v) => v.variantId === selectedVariantId
  );

  const showLowStock = selectedVariant
    ? isLowStock(selectedVariant.availableQuantity)
    : false;

  const handleAddToCart = async () => {
    if (!isAvailable) {
      showError('This item is currently sold out');
      return;
    }

    setIsAdding(true);

    try {
      // Your existing add to cart logic
      await addItem({
        productId: product.id,
        productName: product.name,
        variantId: selectedVariantId,
        quantity,
        price: product.basePrice,
      });

      showSuccess(`${product.name} added to cart`);
    } catch (error) {
      showError('Failed to add item to cart');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Variant Selector */}
      {product.hasVariants && product.variants && inventory?.variants && (
        <Select
          label="Select Color:"
          value={selectedVariantId}
          onChange={(e) => setSelectedVariantId(e.target.value)}
          options={product.variants.map((v) => {
            const variantInv = inventory.variants?.find((inv) => inv.variantId === v.id);
            const soldOut = variantInv && !variantInv.isAvailable;

            return {
              value: v.id,
              label: soldOut ? `${v.variantValue} - Sold Out` : v.variantValue,
            };
          })}
        />
      )}

      {/* Quantity Input */}
      <Input
        type="number"
        label="Quantity:"
        min={1}
        max={selectedVariant?.availableQuantity ?? 100}
        value={quantity}
        onChange={(e) => setQuantity(parseInt(e.target.value, 10))}
        disabled={!isAvailable}
      />

      {/* Low Stock Warning */}
      {showLowStock && selectedVariant && (
        <LowStockWarning availableQuantity={selectedVariant.availableQuantity!} />
      )}

      {/* Add to Cart Button */}
      <Button
        onClick={handleAddToCart}
        disabled={!isAvailable || isAdding}
        variant="primary"
        className="w-full"
      >
        {!isAvailable
          ? 'Sold Out'
          : isAdding
          ? 'Adding...'
          : 'Add to Cart'}
      </Button>
    </div>
  );
}
```

**File:** `/app/products/[id]/page.tsx` (UPDATE)

```typescript
// Just add the useInventory hook
import { useInventory } from '@/lib/hooks/useInventory';

export default function ProductDetailPage({ params }: Props) {
  const product = await getProduct(params.id);

  // Real-time inventory will be handled client-side in ProductAddToCart
  // Page itself stays as server component

  return (
    <Container>
      {/* Existing product detail UI */}
      <ProductAddToCart product={product} />
    </Container>
  );
}
```

---

### Step 6: Testing (2-3 hours)

Write comprehensive tests for:
- Inventory service functions
- Polling hook behavior
- Stock indicator rendering
- API endpoint responses
- Real-time updates
- Stale data detection

**60+ tests across 6 test files**

---

## Acceptance Criteria

### Inventory Service
- [x] `getProductInventory()` returns correct data
- [x] `isInventoryAvailable()` checks product and variant levels
- [x] `isLowStock()` detects low inventory
- [x] `getStockMessage()` formats messages correctly

### API Endpoint
- [x] GET `/api/inventory/:productId` returns inventory
- [x] Returns 404 for non-existent products
- [x] Response includes variants if product has them
- [x] Uses standardized response format

### Polling Hook
- [x] Fetches inventory on mount
- [x] Polls every 10 seconds
- [x] Marks data as stale after 30 seconds
- [x] Cleans up on unmount
- [x] Can be disabled via options

### UI Components
- [x] StockIndicator shows correct state (sold out, low stock, in stock)
- [x] LowStockWarning displays for low inventory
- [x] SoldOutBadge appears on unavailable products
- [x] ProductCard shows real-time stock status
- [x] ProductAddToCart disables for sold-out items

### Testing
- [x] 60+ new tests added
- [x] All existing tests still passing (750+ total)
- [x] Test coverage >80% for new files
- [x] Integration tests for polling behavior

### Quality Gates
- [x] TypeScript builds cleanly
- [x] Lint passes
- [x] Migration 001 applied successfully
- [x] Real-time updates work in browser
- [x] No memory leaks from polling

---

## Timeline

**Estimated: 8-12 hours (1-2 days)**

- **Hour 1-2:** Migration 001 + inventory service
- **Hour 3-4:** API endpoint + polling hook
- **Hour 5-6:** Stock indicator components
- **Hour 7-9:** Update product components
- **Hour 10-12:** Testing + QA

---

## Environment Setup

**No new environment variables needed**

All inventory data comes from existing database.

---

## Performance Considerations

### Polling Strategy

**Current:** Poll every 10 seconds per product
**Impact:** Product detail page = 1 request per 10s
**Optimization:** Shared polling for products on same page

**Future Enhancement (Phase 4):**
- Server-Sent Events (SSE) for push updates
- Redis pub/sub for inventory changes
- Only send updates when inventory actually changes

### Database Impact

**Query frequency:** Low (once per 10s per active product page)
**Query cost:** Very cheap (indexed lookups on primary keys)
**Optimization:** Already uses indexes on `is_available`

---

## Handoff to Dr. LeanDev

### Execution Order

1. **Verify Phase 2.4.5 complete** - Database schema has inventory columns
2. **Build inventory service** - Business logic
3. **Create API endpoint** - REST API
4. **Build polling hook** - Real-time updates
5. **Create UI components** - Stock indicators
6. **Update product pages** - Integrate components
7. **Write tests** - Comprehensive coverage
8. **Manual testing** - Verify in browser

### Success Indicators

- Can see "X remaining" on product pages
- Counter updates every 10 seconds
- "Sold Out" appears when unavailable
- Low stock warnings show correctly
- Add to Cart disabled for sold-out items
- Stale data indicator appears after 30s without update

### Common Pitfalls

- Verify Phase 2.4.5 is complete before starting
- Clean up polling intervals on unmount
- Handle null availableQuantity (unlimited stock)
- Test with Stripe webhooks (order completion should update counts)
- Verify both product and variant sold_quantity increment
- Product mapper must already include inventory fields (from Phase 2.4.5)

---

**Document Created:** 2025-10-28
**Status:** Ready for implementation
**Dependencies:** Phase 2.4.5 complete (product-level inventory tracking)
**Blocks:** Phase 2.6 (Testing), MVP Launch
