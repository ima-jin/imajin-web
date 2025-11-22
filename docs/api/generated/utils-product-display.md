# Product Display Utils

Control how products appear to customers based on status, availability, and user context.

## Purpose

The product display system determines what customers see when browsing the catalog. Products have complex states—pre-sale deposits, limited editions, development status, inventory tracking—and this module translates those states into clear visual signals and purchasing options.

## Core Functions

### shouldShowProduct

**Filters products to only show customer-ready items**

#### Purpose
Products in the database exist at various development stages and sales states. This function enforces the business rule: only show products that are live, production-ready (dev_status = 5), active, and in a sellable state.

#### Parameters
- `product` (Product) - The product to evaluate

#### Returns
`boolean` - True if product should appear in customer-facing views

#### Example
```typescript
import { shouldShowProduct } from '@/lib/utils/product-display'

// Filter product catalog for homepage
const visibleProducts = allProducts.filter(shouldShowProduct)

// Check individual product in component
if (!shouldShowProduct(product)) {
  return <div>Product not available</div>
}
```

#### Business Logic
Products are shown when ALL conditions are met:
- `isLive` = true
- `sellStatus` ∈ ['for-sale', 'pre-order', 'pre-sale']
- `devStatus` = 5 (production ready)
- `isActive` = true

#### Implementation Notes
This is the primary visibility gate. Use this consistently across all customer-facing product lists to avoid showing incomplete or discontinued items.

---

### getProductDisplayStatus

**Analyzes product state and returns display configuration with badges and messaging**

#### Purpose
Products need visual indicators—limited edition badges, pre-sale notifications, out-of-stock warnings. This function examines the product's complete state and returns structured display data.

#### Parameters
- `product` (Product) - The product to analyze

#### Returns
`ProductDisplayStatus` - Object containing:
- `shouldShow` (boolean) - Whether to display the product
- `badge` (optional) - Badge configuration with text and variant
- `message` (optional) - Additional context message

#### Example
```typescript
import { getProductDisplayStatus } from '@/lib/utils/product-display'

function ProductCard({ product }) {
  const status = getProductDisplayStatus(product)
  
  if (!status.shouldShow) return null
  
  return (
    <div className="product-card">
      <h3>{product.name}</h3>
      {status.badge && (
        <Badge variant={status.badge.variant}>
          {status.badge.text}
        </Badge>
      )}
      {status.message && (
        <p className="text-sm text-gray-600">{status.message}</p>
      )}
    </div>
  )
}
```

#### Badge Logic
- **Limited Edition**: Products with inventory tracking and low stock
- **Pre-Sale**: `sellStatus = 'pre-sale'` 
- **Pre-Order**: `sellStatus = 'pre-order'`
- **Sold Out**: Zero inventory on tracked products
- **Discontinued**: `sellStatus = 'discontinued'`

#### Implementation Notes
The badge system uses semantic variants that map to design system colors. Limited edition detection triggers at ≤10 units remaining for tracked inventory.

---

### canAddToCart

**Determines if a product can be purchased right now**

#### Purpose
Not all visible products can be added to cart immediately. This function checks purchasing eligibility based on sell status and inventory.

#### Parameters
- `product` (Product) - The product to check

#### Returns
`boolean` - True if "Add to Cart" functionality should be enabled

#### Example
```typescript
import { canAddToCart } from '@/lib/utils/product-display'

function AddToCartButton({ product }) {
  const canPurchase = canAddToCart(product)
  
  return (
    <button 
      disabled={!canPurchase}
      className={!canPurchase ? 'opacity-50 cursor-not-allowed' : ''}
    >
      {canPurchase ? 'Add to Cart' : 'Not Available'}
    </button>
  )
}
```

#### Business Rules
Products can be added to cart when:
- Product passes `shouldShowProduct` check
- `sellStatus` ∈ ['for-sale', 'pre-order', 'pre-sale']
- If inventory is tracked: `availableQuantity > 0`

#### Error Handling
Always check this before showing purchase UI. Cart operations will fail server-side if attempted on non-purchasable products.

---

### getDisplayPrice

**Returns appropriate pricing based on product state and user deposit status**

#### Purpose
Pricing display varies by sales phase and user context. Pre-sale products hide pricing until deposits are paid. Pre-order products show wholesale pricing to deposit holders.

#### Parameters
- `product` (Product) - The product
- `variant` (Variant | undefined) - Selected variant for variant-specific pricing
- `userHasPaidDeposit` (boolean) - Whether user has paid deposit for this product

#### Returns
`{ price: number, type: 'base' | 'wholesale' } | null` - Price info or null to hide pricing

#### Example
```typescript
import { getDisplayPrice } from '@/lib/utils/product-display'

function PriceDisplay({ product, variant, userHasPaidDeposit }) {
  const priceInfo = getDisplayPrice(product, variant, userHasPaidDeposit)
  
  if (!priceInfo) {
    return <div>Pricing available after deposit</div>
  }
  
  return (
    <div>
      <span>${(priceInfo.price / 100).toFixed(2)}</span>
      {priceInfo.type === 'wholesale' && (
        <span className="text-green-600 ml-2">Wholesale Price</span>
      )}
    </div>
  )
}
```

#### Pricing Logic
- **Pre-sale**: Returns `null` (hide all pricing)
- **Pre-order + deposit paid**: Wholesale price (if available), else base price
- **Pre-order + no deposit**: Base price only
- **For-sale**: Always base price

#### Implementation Notes
Variant pricing overrides product pricing when available. The `type` field helps UI communicate pricing context to users.

---

### getDepositAmount

**Calculates required deposit for pre-sale products**

#### Purpose
Pre-sale products require upfront deposits to secure wholesale pricing. This function extracts the deposit amount from product or variant configuration.

#### Parameters
- `product` (Product) - The product
- `variant` (Variant, optional) - Selected variant

#### Returns
`number | null` - Deposit amount in cents, or null if not applicable

#### Example
```typescript
import { getDepositAmount } from '@/lib/utils/product-display'

function DepositButton({ product, selectedVariant }) {
  const depositAmount = getDepositAmount(product, selectedVariant)
  
  if (!depositAmount) return null
  
  return (
    <button className="bg-blue-600 text-white">
      Pay Deposit: ${(depositAmount / 100).toFixed(2)}
    </button>
  )
}
```

#### Business Logic
- Returns `null` for non-pre-sale products
- Variant deposit overrides product deposit when available
- Used for Stripe checkout session creation

---

## Utility Functions

### getSellStatusLabel

**Converts enum values to human-readable labels**

```typescript
getSellStatusLabel('pre-sale') // "Pre-Sale"
getSellStatusLabel('for-sale') // "Available"
```

### getSellStatusBadgeVariant

**Maps sell status to badge styling variants**

```typescript
getSellStatusBadgeVariant('pre-sale') // "warning"
getSellStatusBadgeVariant('discontinued') // "danger"
```

### getAvailabilityMessage

**Generates inventory status messages for limited items**

```typescript
getAvailabilityMessage(product) // "Only 3 left" or undefined
```

### filterVisibleProducts

**Array filter helper for product lists**

```typescript
const visibleProducts = filterVisibleProducts(allProducts)
// Equivalent to: allProducts.filter(shouldShowProduct)
```

## Common Patterns

### Product List Component
```typescript
function ProductGrid({ products }) {
  const visibleProducts = filterVisibleProducts(products)
  
  return (
    <div className="grid grid-cols-3 gap-4">
      {visibleProducts.map(product => {
        const status = getProductDisplayStatus(product)
        const priceInfo = getDisplayPrice(product, undefined, false)
        
        return (
          <div key={product.id} className="product-card">
            <h3>{product.name}</h3>
            
            {status.badge && (
              <Badge variant={status.badge.variant}>
                {status.badge.text}
              </Badge>
            )}
            
            {priceInfo && (
              <div>${(priceInfo.price / 100).toFixed(2)}</div>
            )}
            
            {canAddToCart(product) && (
              <AddToCartButton product={product} />
            )}
          </div>
        )
      })}
    </div>
  )
}
```

### Conditional Pricing with User Context
```typescript
// In component with user authentication
const { user } = useAuth()
const userDeposits = useUserDeposits(user?.id)

const priceInfo = getDisplayPrice(
  product, 
  selectedVariant,
  userDeposits.includes(product.id)
)
```

## Architecture Notes

### Status Hierarchy
Product visibility follows a strict hierarchy:
1. **Database flags**: `isLive`, `isActive`, `devStatus`
2. **Business status**: `sellStatus` enum
3. **Inventory constraints**: `availableQuantity` for tracked items
4. **User context**: Deposit payments, authentication state

### Badge System Integration
Badge variants align with the design system's semantic color scheme:
- `limited` → Gold/amber (scarcity)
- `warning` → Yellow (attention needed)
- `success` → Green (positive status)
- `danger` → Red (problems/sold out)

### Performance Considerations
These functions are pure and safe to call frequently. Consider memoizing results in components that render many products, especially `getProductDisplayStatus` which performs multiple condition checks.

## Related Modules

- **[Product Types](../types/product.md)** - Type definitions and enums
- **[Cart Utils](./cart.md)** - Shopping cart operations
- **[Pricing Utils](./pricing.md)** - Price calculations and formatting
- **[Inventory Management](../services/inventory.md)** - Stock tracking and updates