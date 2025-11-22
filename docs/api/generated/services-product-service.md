# Product Service API Reference

**Core service for managing LED fixture products, variants, and specifications in the Imajin platform.**

## Overview

The product service handles all product data retrieval operations, from basic product listings to complex queries with variants and technical specifications. Built for the modular LED fixture system where each product can have multiple color variants, voltage configurations, and availability states.

### Purpose

Every LED fixture in the Imajin catalog follows a structured hierarchy: base products contain variants (color options), each with specific Stripe pricing and inventory tracking. This service abstracts the database complexity and provides clean interfaces for e-commerce operations.

**Key responsibilities:**
- Product catalog filtering and retrieval
- Variant-specific data for checkout operations  
- Development status filtering (only show products ready for sale)
- Technical specifications for compatibility checking

### When to Use This

Use the product service whenever you need product data in your application:
- Product catalog pages and search results
- Product detail pages with variant selection
- Cart operations requiring variant validation
- Admin tools for inventory management

---

## Functions Reference

## getAllProducts

**Retrieve all products with optional filtering capabilities.**

### Purpose
Fetches the complete product catalog with support for filtering by development status, category, or other criteria. This is the primary function for building product listing pages and search results. Only returns products marked as ready for sale unless explicitly filtered otherwise.

### Parameters
- `filters` (ProductFilters, optional) - Filtering criteria for products

### Returns
`Promise<Product[]>` - Array of product objects matching the filter criteria

### Example
```typescript
import { getAllProducts } from '@/lib/services/product-service'

// Get all products ready for sale (dev_status = 5)
const products = await getAllProducts()

// Get products with specific filters
const filteredProducts = await getAllProducts({
  category: 'led-panels',
  voltage: '24v'
})
```

### Error Handling
Database connection failures will throw standard database errors. The function returns an empty array if no products match the filter criteria - this is not considered an error condition.

### Implementation Notes
The function automatically excludes products with `dev_status` less than 5 unless explicitly overridden in filters. This prevents prototype or discontinued products from appearing in the public catalog.

---

## getProductById

**Retrieve a single product by its unique identifier.**

### Purpose
Fetches detailed information for a specific product. Used primarily for product detail pages where you need comprehensive product information but not necessarily all variants. Returns null if the product doesn't exist or isn't ready for sale.

### Parameters
- `id` (string) - Unique product identifier

### Returns
`Promise<Product | null>` - Product object or null if not found

### Example
```typescript
import { getProductById } from '@/lib/services/product-service'

const product = await getProductById('material-8x8-v1')

if (!product) {
  // Handle product not found
  return notFound()
}

// Use product data for rendering
console.log(product.name) // "Material-8x8-V LED Panel"
```

### Error Handling
Returns `null` for non-existent products rather than throwing errors. This allows for clean conditional rendering in UI components. Database connection errors will still throw exceptions.

### Implementation Notes
This function only returns the base product data without variants or specifications. Use `getProductWithVariants()` or `getProductWithSpecs()` if you need related data in a single query.

---

## getProductsByStatus

**Filter products by their development status level.**

### Purpose
Retrieves products based on their development lifecycle stage. Essential for admin interfaces where you need to see products in development, or for preview modes showing upcoming releases. Status levels range from 1 (concept) to 5 (ready for sale).

### Parameters
- `status` (number) - Development status level (1-5)

### Returns
`Promise<Product[]>` - Array of products matching the specified status

### Example
```typescript
import { getProductsByStatus } from '@/lib/services/product-service'

// Get all products ready for sale
const liveProducts = await getProductsByStatus(5)

// Get prototypes for admin review
const prototypes = await getProductsByStatus(3)

// Development status levels:
// 1 = Concept
// 2 = Design
// 3 = Prototype  
// 4 = Testing
// 5 = Ready for sale
```

### Error Handling
Invalid status numbers return an empty array. The function doesn't validate status ranges - this allows for future expansion of the status system without breaking changes.

### Implementation Notes
This function bypasses the default dev_status filtering that other product queries use. It's primarily intended for admin and development workflows where you need visibility into the entire product pipeline.

---

## getProductWithVariants

**Retrieve a product with all associated variants and specifications.**

### Purpose
Fetches complete product information including all color variants, pricing tiers, and inventory levels. This is the primary function for product detail pages where customers need to select variants and see real-time availability. Each variant includes Stripe price IDs for direct checkout integration.

### Parameters
- `id` (string) - Unique product identifier

### Returns
`Promise<ProductWithVariants | null>` - Product with nested variants array, or null if not found

### Example
```typescript
import { getProductWithVariants } from '@/lib/services/product-service'

const product = await getProductWithVariants('material-8x8-v1')

if (product) {
  // Access product variants
  product.variants.forEach(variant => {
    console.log(`${variant.color}: ${variant.price_display}`)
    console.log(`Stripe ID: ${variant.stripe_price_id}`)
    console.log(`In stock: ${variant.inventory_count || 'unlimited'}`)
  })
  
  // Access technical specs
  if (product.specs) {
    console.log(`Voltage: ${product.specs.voltage}`)
    console.log(`Power: ${product.specs.power_consumption}W`)
  }
}
```

### Error Handling
Returns `null` if the product doesn't exist or isn't ready for sale. Variants are always included if they exist - empty variants array indicates a product configuration issue that should be investigated.

### Implementation Notes
This function performs a complex join across products, variants, and specifications tables. The query is optimized for single-product lookups and shouldn't be used in loops. For bulk operations, use separate queries and cache appropriately.

---

## getVariantById

**Retrieve a specific product variant by its unique identifier.**

### Purpose
Fetches detailed variant information needed for cart operations, checkout processes, and inventory validation. Each variant represents a specific color/configuration combination with its own Stripe pricing and inventory tracking.

### Parameters
- `variantId` (string) - Unique variant identifier

### Returns
`Promise<Variant | null>` - Variant object with pricing and inventory data, or null if not found

### Example
```typescript
import { getVariantById } from '@/lib/services/product-service'

const variant = await getVariantById('material-8x8-v1-black-diy')

if (variant) {
  console.log(`${variant.color} ${variant.edition}`)
  console.log(`Price: ${variant.price_display}`)
  console.log(`Stripe Price ID: ${variant.stripe_price_id}`)
  
  // Check inventory for limited editions
  if (variant.inventory_count !== null) {
    console.log(`Remaining: ${variant.inventory_count}`)
  }
}
```

### Error Handling
Returns `null` for non-existent variants. This is common during cart validation when variants may become unavailable between page loads. Always check for null before using variant data.

### Implementation Notes
Variant IDs follow the pattern: `{product-id}-{color}-{edition}`. This function is critical for cart and checkout operations where you need to validate variant availability and fetch current pricing before processing payments.

---

## getProductWithSpecs

**Retrieve a product with its technical specifications.**

### Purpose
Fetches product information along with detailed technical specifications needed for compatibility checking and installation planning. Specifications include voltage requirements, power consumption, physical dimensions, and mounting details.

### Parameters
- `id` (string) - Unique product identifier

### Returns
`Promise<ProductWithSpecs | null>` - Product with nested specifications object, or null if not found

### Example
```typescript
import { getProductWithSpecs } from '@/lib/services/product-service'

const product = await getProductWithSpecs('material-8x8-v1')

if (product?.specs) {
  const { voltage, power_consumption, dimensions } = product.specs
  
  console.log(`Voltage: ${voltage}`) // "24v"
  console.log(`Power: ${power_consumption}W`) // "15W"
  console.log(`Size: ${dimensions}`) // "200x200x25mm"
  
  // Check compatibility
  if (voltage === '24v') {
    console.log('Compatible with 24v power supplies')
  }
}
```

### Error Handling
Returns `null` if the product doesn't exist. The `specs` property may be `null` even for valid products if specifications haven't been entered yet. Always check both the product and specs objects before accessing specification data.

### Implementation Notes
Technical specifications are stored separately from base product data to allow for complex specification schemas without cluttering the main products table. This function is optimized for single-product lookups where technical details are required.

---

## Common Patterns

### Product Catalog Loading
```typescript
// Standard catalog page pattern
const products = await getAllProducts()

// Filter for specific category
const ledPanels = await getAllProducts({ 
  category: 'led-panels',
  voltage: '24v' 
})
```

### Product Detail Page Data
```typescript
// Get complete product information
const product = await getProductWithVariants(productId)

if (!product) {
  return notFound()
}

// Product detail page now has everything needed:
// - Base product info
// - All color variants with pricing
// - Technical specifications
// - Inventory levels
```

### Cart Validation
```typescript
// Validate variant exists and is available
const variant = await getVariantById(cartItem.variantId)

if (!variant) {
  // Remove invalid item from cart
  removeCartItem(cartItem.id)
  continue
}

// Check inventory for limited editions
if (variant.inventory_count !== null && variant.inventory_count < cartItem.quantity) {
  // Adjust quantity or show availability message
  showInventoryWarning(variant, cartItem.quantity)
}
```

### Best Practices

**Cache aggressively** - Product data changes infrequently. Cache at the CDN level and use revalidation strategies rather than real-time queries.

**Validate variant IDs** - Always check that variants exist and are available before cart operations. Variants can become unavailable between page loads.

**Handle nulls gracefully** - All product queries can return null. Design UI components to handle missing products without breaking.

**Use appropriate query depth** - Don't use `getProductWithVariants()` if you only need basic product info. Choose the minimal data set for your use case.

### Things to Watch Out For

**Development status filtering** - Most functions automatically filter by `dev_status = 5`. Use `getProductsByStatus()` if you need products in other development stages.

**Founder Edition inventory** - Limited edition variants have finite inventory. Always check `inventory_count` before allowing purchases.

**Voltage compatibility** - 5V and 24V systems are incompatible. Use specification data to prevent invalid product combinations in cart.

**Stripe price synchronization** - Variant pricing comes from the database, not Stripe directly. Ensure price updates are synchronized between systems.

---

## Related Modules

**Cart Service** - Uses variant data for cart validation and pricing calculations  
**Order Service** - Fetches variant information during order creation and inventory updates  
**Stripe Integration** - Relies on variant Stripe price IDs for checkout session creation

### Architecture Context

The product service sits at the core of the e-commerce data layer. It abstracts the complexity of the product-variant-specification relationship and provides clean interfaces for UI components and business logic operations.

Products flow through a development lifecycle (concept → design → prototype → testing → ready for sale) with only status 5 products visible in the public catalog. This allows continuous product development without affecting the customer experience.

The variant system supports both unlimited inventory (DIY kits) and finite inventory (Founder Edition) through nullable inventory counts, enabling flexible business models without architectural changes.