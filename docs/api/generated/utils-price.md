# utils/price Module

**Price utilities for currency handling, formatting, and calculations**

The `utils/price` module provides a comprehensive set of functions for working with prices in the Imajin LED Platform. All prices are stored and calculated as integers (cents) to avoid floating-point precision issues, then formatted for display as needed.

## Purpose

E-commerce applications require precise monetary calculations. This module solves three core problems:

1. **Precision** - Integer-based arithmetic eliminates floating-point rounding errors
2. **Consistency** - Standardized formatting across all price displays
3. **Calculations** - Tax, discount, and subtotal calculations with proper rounding

The module handles everything from basic currency formatting to complex multi-item cart calculations, supporting the platform's pricing architecture for LED products, Founder Edition variants, and pre-sale deposits.

## Validation Functions

### validatePrice

Validates a price value using Zod schema validation.

**Purpose:**
Ensures price values are valid integers before storage or calculations. Throws validation errors for invalid inputs, preventing corrupt data from entering the system.

**Parameters:**
- `price` (unknown) - Value to validate

**Returns:**
`number` - Validated price in cents

**Example:**
```typescript
import { validatePrice } from '@/lib/utils/price'

// Valid price
const validPrice = validatePrice(9999) // 9999

// Invalid inputs throw errors
try {
  validatePrice("not a number")
} catch (error) {
  console.error('Invalid price format')
}
```

**Error Handling:**
- Throws Zod validation error for non-numeric values
- Throws error for negative numbers or non-integers
- Use in API endpoints and form validation

### isValidPrice

Type guard that checks if a value is a valid price without throwing errors.

**Purpose:**
Provides safe price validation for conditional logic and user input processing. Returns boolean instead of throwing errors, making it suitable for validation UI and optional price fields.

**Parameters:**
- `price` (unknown) - Value to check

**Returns:**
`boolean` - True if valid price, false otherwise

**Example:**
```typescript
import { isValidPrice } from '@/lib/utils/price'

const userInput = "99.99" // String input from form

if (isValidPrice(Number(userInput) * 100)) {
  // Process valid price
  const cents = Number(userInput) * 100
} else {
  // Show validation error
  showError("Invalid price format")
}
```

**Implementation Notes:**
Uses the same validation schema as `validatePrice` but catches errors internally. Ideal for form validation and conditional rendering.

## Conversion Functions

### centsToDollars

Converts cents to dollars for display purposes.

**Purpose:**
Transforms stored integer prices (cents) into decimal values (dollars) for user interfaces and display components. Maintains precision while providing human-readable format.

**Parameters:**
- `cents` (number) - Price in cents (integer)

**Returns:**
`number` - Price in dollars (float)

**Example:**
```typescript
import { centsToDollars } from '@/lib/utils/price'

const storedPrice = 9999 // $99.99 in cents
const displayPrice = centsToDollars(storedPrice) // 99.99

console.log(`Price: $${displayPrice}`) // "Price: $99.99"
```

### dollarsToCents

Converts dollars to cents for storage and calculations.

**Purpose:**
Transforms user-friendly dollar amounts into precise integer values for database storage and monetary arithmetic. Essential for processing form inputs and API data.

**Parameters:**
- `dollars` (number) - Price in dollars (float)

**Returns:**
`number` - Price in cents (integer)

**Example:**
```typescript
import { dollarsToCents } from '@/lib/utils/price'

const userPrice = 99.99 // From form input
const storagePrice = dollarsToCents(userPrice) // 9999

// Safe for database storage and calculations
await db.products.update({ price: storagePrice })
```

**Implementation Notes:**
Uses `Math.round()` to handle floating-point precision issues. Always returns integers suitable for database storage.

## Formatting Functions

### formatCurrency

Formats a price in cents as a localized currency string with full customization options.

**Purpose:**
Provides consistent currency formatting across the entire application. Handles internationalization, currency symbols, and decimal precision with extensive customization for different display contexts.

**Parameters:**
- `cents` (number) - Price in cents (integer)
- `options` (FormatCurrencyOptions) - Formatting configuration

**Options:**
- `currency` (string, optional) - Currency code (default: "USD")
- `locale` (string, optional) - Locale for formatting (default: "en-US")
- `showCurrency` (boolean, optional) - Include currency symbol (default: true)
- `minimumFractionDigits` (number, optional) - Minimum decimal places (default: 2)
- `maximumFractionDigits` (number, optional) - Maximum decimal places (default: 2)

**Returns:**
`string` - Formatted currency string

**Example:**
```typescript
import { formatCurrency } from '@/lib/utils/price'

// Basic formatting
const basic = formatCurrency(9999) // "$99.99"

// Custom options
const custom = formatCurrency(10000, {
  currency: "CAD",
  locale: "en-CA",
  minimumFractionDigits: 0
}) // "CA$100"

// No currency symbol
const plain = formatCurrency(5000, {
  showCurrency: false
}) // "50.00"
```

**Implementation Notes:**
Uses `Intl.NumberFormat` for proper localization. Converts cents to dollars internally before formatting. Respects user's browser locale when no locale specified.

### formatPriceRange

Formats a price range for product variants or price brackets.

**Purpose:**
Displays price ranges for products with multiple variants or pricing tiers. Common for LED products with different configurations or bulk pricing structures.

**Parameters:**
- `minCents` (number) - Minimum price in cents
- `maxCents` (number) - Maximum price in cents
- `options` (FormatCurrencyOptions, optional) - Formatting options

**Returns:**
`string` - Formatted price range (e.g., "$50.00 - $100.00")

**Example:**
```typescript
import { formatPriceRange } from '@/lib/utils/price'

// LED panel variants: BLACK ($99), WHITE ($129), RED ($159)
const variantRange = formatPriceRange(9900, 15900) // "$99.00 - $159.00"

// Bulk pricing tiers
const bulkRange = formatPriceRange(8500, 12000, {
  minimumFractionDigits: 0
}) // "$85 - $120"
```

**Implementation Notes:**
Returns single price format if min equals max. Uses same formatting options for both prices to ensure consistency.

### formatPriceWithDiscount

Formats original and discounted prices with savings calculation.

**Purpose:**
Displays promotional pricing with clear savings indication. Essential for pre-sale campaigns, Founder Edition promotions, and volume discounts in the LED marketplace.

**Parameters:**
- `originalCents` (number) - Original price in cents
- `discountedCents` (number, optional) - Discounted price in cents

**Returns:**
Object with formatted pricing information:
- `original` (string) - Formatted original price
- `discounted` (string, optional) - Formatted discounted price
- `savings` (string, optional) - Formatted savings amount
- `savingsPercent` (number, optional) - Savings percentage

**Example:**
```typescript
import { formatPriceWithDiscount } from '@/lib/utils/price'

// Founder Edition pre-sale discount
const promoPrice = formatPriceWithDiscount(15900, 12900)
// {
//   original: "$159.00",
//   discounted: "$129.00", 
//   savings: "$30.00",
//   savingsPercent: 18.87
// }

// No discount case
const regularPrice = formatPriceWithDiscount(9900)
// {
//   original: "$99.00"
// }
```

**Implementation Notes:**
Only calculates savings when discounted price is provided and less than original. Percentage is rounded to two decimal places.

## Calculation Functions

### calculateSubtotal

Calculates subtotal for multiple cart items with quantity handling.

**Purpose:**
Computes order totals for shopping cart functionality. Handles multiple items with different quantities, essential for LED kit bundles and component orders.

**Parameters:**
- `items` (Array) - Items with price and quantity properties
  - `price` (number) - Item price in cents
  - `quantity` (number) - Item quantity

**Returns:**
`number` - Subtotal in cents

**Example:**
```typescript
import { calculateSubtotal } from '@/lib/utils/price'

const cartItems = [
  { price: 9900, quantity: 2 }, // 2x LED panels
  { price: 2500, quantity: 4 }, // 4x mounting brackets
  { price: 5000, quantity: 1 }  // 1x controller
]

const subtotal = calculateSubtotal(cartItems) // 34800 ($348.00)
```

**Error Handling:**
- Returns 0 for empty arrays
- Validates that price and quantity are numbers
- Handles zero quantities gracefully

### calculateTax

Calculates tax amount with proper rounding.

**Purpose:**
Computes tax for order processing with precise rounding. Supports various tax rates for different jurisdictions and product types in the LED marketplace.

**Parameters:**
- `subtotalCents` (number) - Subtotal in cents
- `taxRate` (number) - Tax rate as decimal (e.g., 0.13 for 13%)

**Returns:**
`number` - Tax amount in cents

**Example:**
```typescript
import { calculateTax } from '@/lib/utils/price'

const orderSubtotal = 10000 // $100.00
const ontarioHST = 0.13     // 13% HST

const taxAmount = calculateTax(orderSubtotal, ontarioHST) // 1300 ($13.00)
```

**Implementation Notes:**
Uses `Math.round()` for banker's rounding. Tax calculated before any additional fees or shipping.

### calculateDiscount

Calculates discount amount from percentage.

**Purpose:**
Computes discount amounts for promotional pricing, volume discounts, and early-bird campaigns. Used in Founder Edition pre-sales and bulk order processing.

**Parameters:**
- `priceCents` (number) - Original price in cents  
- `discountPercent` (number) - Discount percentage (e.g., 20 for 20% off)

**Returns:**
`number` - Discount amount in cents

**Example:**
```typescript
import { calculateDiscount } from '@/lib/utils/price'

const founderEditionPrice = 15900 // $159.00
const earlyBirdDiscount = 20      // 20% off

const discountAmount = calculateDiscount(founderEditionPrice, earlyBirdDiscount) // 3180 ($31.80)
```

### applyDiscount

Applies percentage discount to price and returns final amount.

**Purpose:**
Computes final discounted price in a single operation. Combines discount calculation and application for streamlined pricing logic.

**Parameters:**
- `priceCents` (number) - Original price in cents
- `discountPercent` (number) - Discount percentage (e.g., 20 for 20% off)

**Returns:**
`number` - Discounted price in cents

**Example:**
```typescript
import { applyDiscount } from '@/lib/utils/price'

const listPrice = 12000      // $120.00
const volumeDiscount = 15    // 15% volume discount

const finalPrice = applyDiscount(listPrice, volumeDiscount) // 10200 ($102.00)
```

## Comparison Functions

### priceDifference

Compares two prices and returns the absolute difference.

**Purpose:**
Calculates price differences for variant comparisons, price change notifications, and savings displays. Essential for showing price deltas in product configurations.

**Parameters:**
- `price1Cents` (number) - First price in cents
- `price2Cents` (number) - Second price in cents

**Returns:**
`number` - Difference in cents (positive if price1 > price2)

**Example:**
```typescript
import { priceDifference } from '@/lib/utils/price'

const blackVariant = 9900  // $99.00
const redVariant = 15900   // $159.00

const difference = priceDifference(redVariant, blackVariant) // 6000 ($60.00)
```

### priceChangePercent

Calculates percentage change between old and new prices.

**Purpose:**
Computes percentage changes for price updates, promotional analysis, and savings calculations. Returns positive values for increases, negative for decreases.

**Parameters:**
- `oldPriceCents` (number) - Original price in cents
- `newPriceCents` (number) - New price in cents

**Returns:**
`number` - Percentage change (positive for increase, negative for decrease)

**Example:**
```typescript
import { priceChangePercent } from '@/lib/utils/price'

const originalPrice = 10000  // $100.00
const salePrice = 8500       // $85.00

const changePercent = priceChangePercent(originalPrice, salePrice) // -15.0 (15% decrease)
```

## Parsing Functions

### parseCurrencyString

Parses currency strings into cents for form processing and data import.

**Purpose:**
Converts user-entered currency strings into precise integer values. Handles common formats including currency symbols, commas, and various decimal notations.

**Parameters:**
- `currencyString` (string) - Currency string to parse

**Returns:**
`number | null` - Price in cents, or null if invalid

**Example:**
```typescript
import { parseCurrencyString } from '@/lib/utils/price'

// Various input formats
const price1 = parseCurrencyString("$99.99")   // 9999
const price2 = parseCurrencyString("99.99")    // 9999  
const price3 = parseCurrencyString("$100")     // 10000
const price4 = parseCurrencyString("invalid")  // null

// Form processing
const userInput = document.getElementById('price').value
const cents = parseCurrencyString(userInput)

if (cents !== null) {
  await saveProductPrice(cents)
} else {
  showError("Invalid price format")
}
```

**Error Handling:**
- Returns `null` for invalid formats
- Handles empty strings and undefined values
- Strips common currency symbols and whitespace
- Validates final numeric conversion

**Implementation Notes:**
Uses regex to extract numeric values and decimal points. Supports dollar signs, commas, and whitespace. Always validates final conversion to ensure integer result.

## Common Patterns

### Cart Calculations
```typescript
import { calculateSubtotal, calculateTax, formatCurrency } from '@/lib/utils/price'

function processCart(items, taxRate = 0.13) {
  const subtotal = calculateSubtotal(items)
  const tax = calculateTax(subtotal, taxRate)
  const total = subtotal + tax
  
  return {
    subtotal: formatCurrency(subtotal),
    tax: formatCurrency(tax),
    total: formatCurrency(total)
  }
}
```

### Product Pricing Display
```typescript
import { formatPriceWithDiscount } from '@/lib/utils/price'

function ProductPrice({ originalPrice, discountedPrice }) {
  const pricing = formatPriceWithDiscount(originalPrice, discountedPrice)
  
  if (pricing.discounted) {
    return (
      <div>
        <span className="line-through text-gray-500">{pricing.original}</span>
        <span className="text-red-600 font-bold">{pricing.discounted}</span>
        <span className="text-green-600">Save {pricing.savings}!</span>
      </div>
    )
  }
  
  return <span>{pricing.original}</span>
}
```

### Form Input Processing
```typescript
import { parseCurrencyString, isValidPrice } from '@/lib/utils/price'

function handlePriceInput(inputValue) {
  const cents = parseCurrencyString(inputValue)
  
  if (cents === null || !isValidPrice(cents)) {
    throw new Error('Invalid price format')
  }
  
  return cents
}
```

## Best Practices

### Always Store Cents
Store prices as integers (cents) in databases to avoid floating-point precision issues. Only convert to dollars for display.

### Validate Early
Use `validatePrice` or `isValidPrice` at system boundaries (APIs, forms) to prevent invalid data propagation.

### Consistent Formatting
Use `formatCurrency` with consistent options across your application. Consider creating app-specific wrapper functions for common formats.

### Handle Edge Cases
Price parsing and calculations can fail with invalid inputs. Always handle null returns and validation errors gracefully.

## Implementation Notes

### Precision Architecture
All monetary calculations use integer arithmetic to eliminate floating-point rounding errors. This approach ensures accurate tax calculations, discount applications, and order totals.

### Internationalization Ready
Currency formatting uses `Intl.NumberFormat` for proper localization support. Easy to extend for multiple currencies and regional formats as the platform scales internationally.

### Stripe Integration
Price values align with Stripe's API expectations (cents/smallest currency unit). Direct compatibility with Stripe Checkout and Price objects without additional conversion.

## Related Modules

- **`lib/stripe`** - Stripe integration using these price utilities
- **`components/ui/price`** - React components built on these functions  
- **`app/api/orders`** - Order processing with price calculations
- **`app/api/products`** - Product management with price validation