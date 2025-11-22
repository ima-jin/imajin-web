# Product Validator Service

**Validates product configurations and variant availability for the Imajin LED platform.**

## Module Overview

The Product Validator service ensures data integrity and business rule compliance across the e-commerce system. It validates JSON product configurations against schema requirements and provides real-time availability checks for product variants.

This module exists because product configurations drive everything from pricing to inventory management. Invalid data breaks the ordering system, and customers need accurate availability information before they add items to their cart.

Use this service when loading product configurations from JSON files, checking variant availability in the UI, or validating inventory levels during checkout processing.

## Functions Reference

### validateProductJson

**Validates product JSON configuration against the schema.**

#### Purpose

Ensures product JSON files conform to the expected schema before they're used throughout the system. Catches configuration errors early rather than letting them surface as runtime failures in the checkout flow or product display logic.

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `data` | `unknown` | Raw product data to validate (typically from JSON file) |

#### Returns

`ZodSafeParseResult<Product>` - Validation result with parsed product data on success, or error details on failure

#### Example

```typescript
import { validateProductJson } from '@/lib/services/product-validator'

// Load and validate product configuration
const rawProductData = JSON.parse(productJsonString)
const result = validateProductJson(rawProductData)

if (result.success) {
  // Use validated product data
  const product = result.data
  console.log(`Validated product: ${product.name}`)
} else {
  // Handle validation errors
  console.error('Product validation failed:', result.error.issues)
  result.error.issues.forEach(issue => {
    console.error(`- ${issue.path.join('.')}: ${issue.message}`)
  })
}
```

#### Error Handling

Returns a `ZodSafeParseResult` object. Check the `success` property:
- `true`: Validation passed, access data via `result.data`
- `false`: Validation failed, error details in `result.error.issues`

Each error issue includes:
- `path`: Array showing which field failed (e.g., `['variants', 0, 'price_cents']`)
- `message`: Human-readable error description
- `code`: Zod error code for programmatic handling

#### Implementation Notes

Uses Zod schema validation for type safety and detailed error reporting. The schema enforces required fields, data types, and business constraints (like valid category values and price formats). Validation happens at the data loading layer to fail fast on configuration issues.

### validateVariantAvailability

**Validates variant availability and returns purchase eligibility information.**

#### Purpose

Determines whether a product variant can be purchased based on current inventory levels, sell status, and business rules. Provides structured availability information that drives UI states (buy buttons, stock warnings, sold-out badges).

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `variant` | `Variant` | Product variant to check availability for |

#### Returns

`VariantAvailability` - Availability status with purchase eligibility and display messaging

#### Example

```typescript
import { validateVariantAvailability } from '@/lib/services/product-validator'

// Check if a Founder Edition variant is available
const founderVariant = product.variants.find(v => v.edition === 'founder')
const availability = validateVariantAvailability(founderVariant)

if (availability.canPurchase) {
  // Show buy button
  if (availability.isLowStock) {
    showStockWarning(`Only ${availability.availableQuantity} left!`)
  }
} else {
  // Show unavailable state
  showSoldOutBadge(availability.message)
}

// Handle different availability states
switch (availability.status) {
  case 'available':
    enablePurchase()
    break
  case 'low-stock':
    enablePurchaseWithWarning()
    break
  case 'sold-out':
    disablePurchaseShowWaitlist()
    break
  case 'pre-sale':
    showDepositOption()
    break
}
```

#### Error Handling

This function doesn't throw errors—it returns availability information for any variant state. If a variant is misconfigured (missing required fields), it defaults to unavailable with an appropriate message.

#### Implementation Notes

Availability logic considers multiple factors: variant inventory levels, product sell status, and edition constraints (Founder Editions have fixed quantities). The returned object provides both programmatic flags (`canPurchase`, `isLowStock`) and user-facing messaging for consistent UI behavior.

### isLowStock

**Checks if a variant has low stock relative to a threshold.**

#### Purpose

Provides early warning when variant inventory drops below specified levels. Used to trigger low-stock UI indicators and administrative alerts before items sell out completely.

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `variant` | `Variant` | Product variant to check stock levels for |
| `threshold` | `number` | Stock level threshold (defaults to 10 or 10% of max_quantity) |

#### Returns

`boolean` - `true` if available quantity is below the threshold

#### Example

```typescript
import { isLowStock } from '@/lib/services/product-validator'

// Check with default threshold (10 units or 10% of max)
if (isLowStock(variant)) {
  showLowStockWarning()
}

// Check with custom threshold
const customThreshold = 25
if (isLowStock(variant, customThreshold)) {
  triggerRestockAlert(variant.id, variant.available_quantity)
}

// Display appropriate stock messaging
const stockLevel = variant.available_quantity
if (isLowStock(variant)) {
  return `Only ${stockLevel} left in stock!`
} else {
  return `${stockLevel} available`
}
```

#### Error Handling

Returns `false` for variants without quantity tracking (unlimited inventory) or when availability data is missing. This ensures UI components gracefully handle edge cases without breaking.

#### Implementation Notes

For limited editions (like Founder Editions), the threshold calculation uses 10% of `max_quantity` when it's lower than the default threshold. This provides proportional low-stock warnings for different inventory scales.

### isSoldOut

**Checks if a variant is completely sold out.**

#### Purpose

Determines if a variant has zero available inventory, triggering sold-out UI states and preventing purchase attempts. Used throughout the UI to disable buy buttons and show appropriate messaging.

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `variant` | `Variant` | Product variant to check for sold-out status |

#### Returns

`boolean` - `true` if the variant is sold out (available quantity is 0 or negative)

#### Example

```typescript
import { isSoldOut } from '@/lib/services/product-validator'

// Conditional UI rendering based on stock status
const renderPurchaseButton = (variant) => {
  if (isSoldOut(variant)) {
    return <Button disabled>Sold Out</Button>
  }
  
  return <Button onClick={() => addToCart(variant)}>Add to Cart</Button>
}

// Check multiple variants for product page display
const availableVariants = product.variants.filter(v => !isSoldOut(v))
const soldOutVariants = product.variants.filter(v => isSoldOut(v))

if (availableVariants.length === 0) {
  showProductSoldOut()
} else if (soldOutVariants.length > 0) {
  showMixedAvailability(availableVariants, soldOutVariants)
}
```

#### Error Handling

Returns `false` for variants without quantity tracking (unlimited inventory). This ensures products with unlimited availability never show as sold out due to missing data.

#### Implementation Notes

Checks `available_quantity` against zero. For variants with quantity tracking disabled (`max_quantity` is null), this always returns `false` since those variants represent unlimited inventory.

## Common Patterns

### Product Configuration Loading

```typescript
// Typical pattern for loading and validating product configs
const loadProductConfig = async (productId: string) => {
  try {
    const rawData = await fs.readFile(`config/products/${productId}.json`, 'utf8')
    const parsed = JSON.parse(rawData)
    const validation = validateProductJson(parsed)
    
    if (!validation.success) {
      throw new Error(`Invalid product config: ${productId}`)
    }
    
    return validation.data
  } catch (error) {
    console.error(`Failed to load product ${productId}:`, error)
    throw error
  }
}
```

### Availability-Driven UI

```typescript
// Pattern for variant selection UI
const VariantSelector = ({ variants }) => {
  return variants.map(variant => {
    const availability = validateVariantAvailability(variant)
    
    return (
      <button
        key={variant.id}
        disabled={!availability.canPurchase}
        className={availability.isLowStock ? 'low-stock' : ''}
        onClick={() => selectVariant(variant)}
      >
        {variant.name}
        {isSoldOut(variant) && <span className="sold-out">Sold Out</span>}
        {isLowStock(variant) && !isSoldOut(variant) && 
          <span className="low-stock">Low Stock</span>
        }
      </button>
    )
  })
}
```

### Best Practices

- **Validate early**: Run `validateProductJson` during build time or data loading, not in user-facing code paths
- **Cache availability results**: Variant availability checks are computationally light but should be memoized for frequently-updated UI components
- **Handle edge cases gracefully**: Use the boolean helper functions (`isLowStock`, `isSoldOut`) rather than checking raw values directly

### Things to Watch Out For

- **Founder Edition inventory**: These have fixed `max_quantity` values that can't be restocked—once sold out, they're gone forever
- **Validation errors in production**: Invalid product configurations break the entire product display system. Validate configurations in development and staging environments
- **Race conditions**: Variant availability can change between page load and checkout. The checkout system performs final validation to prevent overselling

## Related Modules

This validator service integrates with several other platform components:

- **Product Service** (`services/product-service`) - Uses validation results for product loading and display
- **Cart Service** (`services/cart-service`) - Validates availability before allowing items to be added
- **Inventory Service** (`services/inventory-service`) - Provides real-time quantity data for availability checks
- **Checkout API** (`app/api/checkout`) - Performs final availability validation before payment processing

The validation layer ensures data consistency across all these touch points, preventing invalid configurations from causing runtime errors in the ordering system.