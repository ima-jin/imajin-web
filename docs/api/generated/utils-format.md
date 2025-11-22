# utils/format Module

**Centralized formatting utilities for consistent data presentation across the Imajin LED Platform.**

## Module Overview

The `utils/format` module provides standardized formatting functions for common data types like currency. This module acts as a re-export hub for specialized formatting utilities, ensuring consistent presentation of financial data throughout the platform.

**Why it exists:** E-commerce platforms need consistent currency formatting across product pages, checkout flows, and order confirmations. Rather than scattering formatting logic throughout components, this module centralizes these utilities with proper locale support and customization options.

**When to use it:** Any time you need to display currency values, especially for product prices, order totals, or payment amounts. The module handles edge cases like zero amounts, different currencies, and locale-specific formatting rules.

## Functions Reference

### formatCurrency

**Formats numeric values as localized currency strings with full customization control.**

#### Purpose

Converts raw numeric values (typically from Stripe amounts in cents) into properly formatted currency strings that respect user locale preferences. Handles the common e-commerce pattern where backend systems store currency as integers (cents) but frontend needs to display formatted dollar amounts.

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `amount` | `number` | Amount in cents (e.g., 2999 for $29.99) |
| `options` | `FormatCurrencyOptions` | Optional formatting configuration |

#### Returns

`string` - Formatted currency string (e.g., "$29.99", "CA$45.00")

#### Example

```typescript
import { formatCurrency } from '@/lib/utils/format';

// Basic usage - USD cents to formatted string
const price = formatCurrency(2999); // "$29.99"

// Custom currency
const cadPrice = formatCurrency(4500, { 
  currency: 'CAD',
  locale: 'en-CA' 
}); // "CA$45.00"

// Component usage
function ProductCard({ variant }: { variant: ProductVariant }) {
  return (
    <div className="product-card">
      <h3>{variant.name}</h3>
      <p className="price">{formatCurrency(variant.price)}</p>
    </div>
  );
}
```

#### Error Handling

- **Invalid amounts:** Non-numeric values return "$0.00" to prevent UI breaks
- **Unsupported locales:** Falls back to 'en-US' formatting
- **Missing currency:** Defaults to USD when currency option not provided

#### Implementation Notes

The function assumes input amounts are in cents (Stripe's standard format) and automatically converts to major currency units. This prevents floating-point precision issues common in financial calculations. The underlying implementation uses `Intl.NumberFormat` for proper internationalization support.

## Types Reference

### FormatCurrencyOptions

**Configuration interface for customizing currency formatting behavior.**

```typescript
interface FormatCurrencyOptions {
  currency?: string;     // ISO 4217 currency code (default: 'USD')
  locale?: string;       // BCP 47 locale tag (default: 'en-US')  
  minimumFractionDigits?: number; // Decimal places (default: 2)
  maximumFractionDigits?: number; // Max decimals (default: 2)
}
```

## Common Patterns

### Product Display

```typescript
// Product grid with consistent pricing
function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {products.map(product => (
        <ProductCard 
          key={product.id}
          name={product.name}
          price={formatCurrency(product.priceInCents)}
        />
      ))}
    </div>
  );
}
```

### Order Summaries

```typescript
// Checkout totals with multiple currency values
function OrderSummary({ order }: { order: Order }) {
  return (
    <div className="order-summary">
      <div className="subtotal">
        Subtotal: {formatCurrency(order.subtotalCents)}
      </div>
      <div className="shipping">
        Shipping: {formatCurrency(order.shippingCents)}
      </div>
      <div className="total font-bold">
        Total: {formatCurrency(order.totalCents)}
      </div>
    </div>
  );
}
```

### International Commerce

```typescript
// Multi-currency support for global customers
function InternationalPricing({ priceData }: { priceData: PriceData }) {
  return (
    <div className="pricing-options">
      <div>US: {formatCurrency(priceData.usdCents, { currency: 'USD' })}</div>
      <div>CA: {formatCurrency(priceData.cadCents, { currency: 'CAD', locale: 'en-CA' })}</div>
      <div>EU: {formatCurrency(priceData.eurCents, { currency: 'EUR', locale: 'de-DE' })}</div>
    </div>
  );
}
```

## Best Practices

### Always Format at Display Time

Don't store formatted currency strings in state or pass them through props. Keep amounts as numbers until the final display moment:

```typescript
// ✅ Good - format at display time
const ProductPrice = ({ priceCents }: { priceCents: number }) => (
  <span className="price">{formatCurrency(priceCents)}</span>
);

// ❌ Bad - pre-formatted strings lose flexibility
const ProductPrice = ({ formattedPrice }: { formattedPrice: string }) => (
  <span className="price">{formattedPrice}</span>
);
```

### Handle Zero Amounts Gracefully

The formatter handles zero amounts, but consider your UX for free products:

```typescript
function ProductPrice({ priceCents }: { priceCents: number }) {
  if (priceCents === 0) {
    return <span className="price-free">Free</span>;
  }
  return <span className="price">{formatCurrency(priceCents)}</span>;
}
```

## Related Modules

- **`lib/stripe/config`** - Stripe integration where currency amounts originate
- **`lib/db/schema`** - Database schemas defining price fields (stored as integers)
- **`components/ui/product-card`** - UI components consuming formatted currency
- **`app/checkout/components`** - Checkout flows requiring consistent price display

This module fits into the data flow: Database (cents) → Business Logic (cents) → Display Layer (formatted strings). It's the final step in presenting financial data to users with proper localization and formatting.