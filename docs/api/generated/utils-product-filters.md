# Product Filters

**Core utilities for product visibility and status management in the Imajin e-commerce platform.**

## Module Overview

The `utils/product-filters` module handles the business logic for determining which products appear in public listings and how they're displayed to customers. It consolidates the product lifecycle management—from development through sale to sold-out status.

This module exists because products flow through multiple states (development, live, for-sale, pre-order, sold-out, internal) and the platform needs consistent rules for what customers see and can purchase. Rather than scatter this logic across components, these utilities provide a single source of truth for product visibility decisions.

Use this module whenever you're displaying products to customers, building product listings, or determining purchase availability.

## Type Definitions

### SellStatus

Valid sell_status values from the database schema.

```typescript
type SellStatus = "for-sale" | "pre-order" | "sold-out" | "internal"
```

### ProductDisplayStatus

Product display status result returned by `getProductDisplayStatus`.

```typescript
interface ProductDisplayStatus {
  label: string        // Human-readable status (e.g., "In Stock", "Pre-Order")
  canPurchase: boolean // Whether add-to-cart should be enabled
  note?: string        // Optional explanation (e.g., "Ships in 4-6 weeks")
}
```

## Functions Reference

### shouldShowProduct

**Determines if a product should appear in public listings.**

### Purpose

Products go through development phases and various availability states. This function implements the business rule: only show products that are both live and publicly available. Products marked as internal or still in development stay hidden from customers.

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `isLive` | `boolean` | The `is_live` flag from the database |
| `sellStatus` | `SellStatus \| null \| undefined` | The `sell_status` value from the database |

### Returns

`boolean` - `true` if the product should appear in public listings

### Example

```typescript
import { shouldShowProduct } from '@/lib/utils/product-filters'

// Product ready for public display
const publicProduct = shouldShowProduct(true, "for-sale") // true

// Still in development
const devProduct = shouldShowProduct(false, "for-sale") // false

// Internal use only
const internalProduct = shouldShowProduct(true, "internal") // false

// Filter products in a listing
const visibleProducts = allProducts.filter(product => 
  shouldShowProduct(product.is_live, product.sell_status)
)
```

### Error Handling

Returns `false` for any null or undefined `sellStatus` values. No exceptions thrown—this function is designed to be safe for use in filter operations.

### Implementation Notes

The function uses an allowlist approach: only `"for-sale"`, `"pre-order"`, and `"sold-out"` products are considered showable. This ensures new status values default to hidden until explicitly handled.

---

### getProductDisplayStatus

**Maps internal sell status to customer-facing display information.**

### Purpose

Customers shouldn't see raw database values like "for-sale" or "internal". This function translates internal status codes into human-readable labels and determines whether the add-to-cart button should be enabled. It also handles optional status notes that explain timing or availability details.

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `sellStatus` | `SellStatus \| null \| undefined` | The `sell_status` value from the database |
| `sellStatusNote` | `string \| null` | *(optional)* Explanation text for the status |

### Returns

`ProductDisplayStatus` - Object with display label, purchase flag, and optional note

### Example

```typescript
import { getProductDisplayStatus } from '@/lib/utils/product-filters'

// In-stock product
const inStock = getProductDisplayStatus("for-sale")
// { label: "In Stock", canPurchase: true }

// Pre-order with timing note
const preOrder = getProductDisplayStatus("pre-order", "Ships Q2 2024")
// { label: "Pre-Order", canPurchase: true, note: "Ships Q2 2024" }

// Sold out item
const soldOut = getProductDisplayStatus("sold-out")
// { label: "Sold Out", canPurchase: false }

// Use in a product component
function ProductCard({ product }) {
  const status = getProductDisplayStatus(product.sell_status, product.sell_status_note)
  
  return (
    <div>
      <h3>{product.name}</h3>
      <span className={status.canPurchase ? "text-green-600" : "text-gray-500"}>
        {status.label}
      </span>
      {status.note && <p className="text-sm text-gray-600">{status.note}</p>}
      <button disabled={!status.canPurchase}>
        {status.canPurchase ? "Add to Cart" : status.label}
      </button>
    </div>
  )
}
```

### Error Handling

Returns `"Not Available"` with `canPurchase: false` for any null, undefined, or unrecognized status values. This ensures the UI always has a safe fallback.

### Implementation Notes

The status mapping is centralized here to maintain consistency across the platform. If you need to add new status types, update this function rather than handling them in individual components.

---

### isProductReady

**Checks if a product has completed development and is ready for sale.**

### Purpose

The Imajin platform uses a `dev_status` scale (1-5) to track product development progress. Only products that reach status 5 are ready for customer purchase. This function enforces that business rule and is typically used in database queries to filter the product catalog.

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `devStatus` | `number` | The `dev_status` value from the database |

### Returns

`boolean` - `true` if product is ready for sale (`dev_status === 5`)

### Example

```typescript
import { isProductReady } from '@/lib/utils/product-filters'

// Ready for sale
const ready = isProductReady(5) // true

// Still in development
const prototype = isProductReady(3) // false

// Filter ready products in a database query
const readyProducts = await db
  .select()
  .from(products)
  .where(sql`dev_status = 5`) // Equivalent to isProductReady check

// Or filter after fetching
const saleableProducts = allProducts.filter(p => isProductReady(p.dev_status))
```

### Error Handling

No error handling needed—this is a simple equality check. Non-numeric values will return `false`.

### Implementation Notes

While you could write `devStatus === 5` inline, using this function makes the intent clear and provides a single place to update the logic if the "ready" threshold ever changes.

## Common Patterns

### Complete Product Filtering

Most product listings need to apply both development status and visibility rules:

```typescript
import { shouldShowProduct, isProductReady } from '@/lib/utils/product-filters'

// In a database query
const publicProducts = await db
  .select()
  .from(products)
  .where(sql`dev_status = 5`) // Only ready products
  .filter(product => shouldShowProduct(product.is_live, product.sell_status))

// Or as a combined utility
function isProductVisible(product: { 
  dev_status: number
  is_live: boolean
  sell_status: string | null 
}) {
  return isProductReady(product.dev_status) && 
         shouldShowProduct(product.is_live, product.sell_status)
}
```

### Product Card Status Display

Combine status and display logic for consistent product cards:

```typescript
import { shouldShowProduct, getProductDisplayStatus } from '@/lib/utils/product-filters'

function ProductCard({ product }) {
  // Don't render cards for non-visible products
  if (!shouldShowProduct(product.is_live, product.sell_status)) {
    return null
  }
  
  const status = getProductDisplayStatus(product.sell_status, product.sell_status_note)
  
  return (
    <article className="product-card">
      <img src={product.image_url} alt={product.name} />
      <h3>{product.name}</h3>
      <p>${product.price}</p>
      <div className="status">
        <span className={`badge ${status.canPurchase ? 'available' : 'unavailable'}`}>
          {status.label}
        </span>
        {status.note && <small>{status.note}</small>}
      </div>
      <button disabled={!status.canPurchase}>
        {status.canPurchase ? 'Add to Cart' : status.label}
      </button>
    </article>
  )
}
```

## Best Practices

### Use in Database Queries

Apply `dev_status` filtering at the database level for performance:

```typescript
// ✅ Good - Filter early
const products = await db.select()
  .from(products)
  .where(eq(products.dev_status, 5))

// ❌ Avoid - Fetching unnecessary data
const allProducts = await db.select().from(products)
const readyProducts = allProducts.filter(p => isProductReady(p.dev_status))
```

### Consistent Status Display

Always use `getProductDisplayStatus` rather than hardcoding status labels:

```typescript
// ✅ Good - Consistent, translatable
const status = getProductDisplayStatus(product.sell_status)
return <span>{status.label}</span>

// ❌ Avoid - Inconsistent, hard to maintain
return <span>{product.sell_status === 'for-sale' ? 'Available' : 'Not Available'}</span>
```

### Handle Edge Cases

These functions are designed to be safe with null/undefined data:

```typescript
// ✅ Safe - Functions handle null gracefully
const visible = shouldShowProduct(product.is_live, product.sell_status) // Won't crash

// ❌ Risky - Could throw on null data
const visible = product.sell_status === 'for-sale' // TypeError if null
```

## Related Modules

- **Database Schema** (`db/schema/products.ts`) - Defines the `dev_status`, `is_live`, and `sell_status` fields these functions operate on
- **Product Queries** (`lib/db/products.ts`) - Uses these filters in database queries for public product listings
- **Cart System** (`lib/cart/`) - Uses `getProductDisplayStatus` to determine if items can be added to cart
- **Admin Tools** (Phase 4.5) - Will use these utilities to preview how products appear to customers