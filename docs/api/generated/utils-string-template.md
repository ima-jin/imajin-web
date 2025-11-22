# String Template Utilities

Template string interpolation functions for dynamic content generation. This module handles variable substitution in user-facing messages, content templates, and dynamic UI text.

## Purpose

Replaces placeholders in template strings with dynamic values. Built for inventory messages ("Only {quantity} remaining"), product descriptions, and copyright notices. Handles type conversion and null safety automatically—no runtime errors from missing variables.

**Why not template literals?** Template strings are evaluated at compile time. These functions work with runtime data from databases, user input, and configuration files.

## Functions Reference

### interpolate

**Replaces variables in template strings using {variable} syntax**

#### Purpose
Core string interpolation function. Takes a template with `{variable}` placeholders and replaces them with values from an object. Used throughout the platform for dynamic messaging.

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `template` | `string` | String containing `{variable}` placeholders |
| `vars` | `Record<string, string \| number \| boolean \| null \| undefined>` | Object with variable names and replacement values |

#### Returns

`string` - Template with all matching placeholders replaced. Unmatched placeholders remain unchanged.

#### Example

```typescript
import { interpolate } from '@/lib/utils/string-template';

// Inventory warnings
const stockMessage = interpolate(
  "Only {quantity} remaining", 
  { quantity: 5 }
);
// Result: "Only 5 remaining"

// Product alerts
const soldOutMessage = interpolate(
  "{product_name} is sold out", 
  { product_name: "Material-8x8-V BLACK" }
);
// Result: "Material-8x8-V BLACK is sold out"

// Mixed types
const orderSummary = interpolate(
  "Order {order_id}: {item_count} items for {total}",
  { 
    order_id: "ORD-12345", 
    item_count: 3, 
    total: "$299.99" 
  }
);
// Result: "Order ORD-12345: 3 items for $299.99"
```

#### Error Handling

**No runtime errors.** Missing variables remain as placeholders:

```typescript
const message = interpolate(
  "Hello {name}, you have {count} items",
  { name: "John" }
  // Missing 'count' variable
);
// Result: "Hello John, you have {count} items"
```

**Type conversion is automatic:**

```typescript
const message = interpolate(
  "Price: {amount}",
  { amount: 299.99 }  // Number becomes string
);
// Result: "Price: 299.99"
```

#### Implementation Notes

Uses regex replacement (`/{(\w+)}/g`) to find placeholders. Only matches word characters (letters, numbers, underscore). Case-sensitive matching—`{Name}` and `{name}` are different variables.

---

### interpolateWithYear

**Template interpolation with automatic year injection**

#### Purpose
Extends `interpolate` with special handling for `{year}` placeholder. Automatically injects current year—perfect for copyright notices, date stamps, and time-sensitive content that updates annually.

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `template` | `string` | String containing placeholders including optional `{year}` |
| `vars` | `Record<string, string \| number \| boolean \| null \| undefined>` | Variable object (defaults to empty object) |

#### Returns

`string` - Interpolated string with `{year}` replaced by current year

#### Example

```typescript
import { interpolateWithYear } from '@/lib/utils/string-template';

// Copyright notices
const copyright = interpolateWithYear("© {year} Imajin");
// Result: "© 2025 Imajin"

// Combined with other variables
const footer = interpolateWithYear(
  "© {year} {company}. Version {version}",
  { company: "Imajin", version: "1.2.0" }
);
// Result: "© 2025 Imajin. Version 1.2.0"

// Year override (if needed)
const historical = interpolateWithYear(
  "Founded in {year}",
  { year: 2023 }  // Explicit year overrides current year
);
// Result: "Founded in 2023"
```

#### Error Handling

Same as `interpolate`—no runtime errors, graceful handling of missing variables. If `{year}` isn't in the template, behaves exactly like `interpolate`.

#### Implementation Notes

Calls `interpolate` after injecting current year via `new Date().getFullYear()`. User-provided `year` variable takes precedence over automatic injection.

## Common Patterns

### Inventory Messaging

```typescript
function getStockMessage(variant: ProductVariant) {
  if (variant.inventory_count === 0) {
    return interpolate("{name} is sold out", { 
      name: variant.display_name 
    });
  }
  
  if (variant.inventory_count <= 5) {
    return interpolate("Only {count} {name} remaining", {
      count: variant.inventory_count,
      name: variant.display_name
    });
  }
  
  return "In stock";
}
```

### Configuration-Driven Content

```typescript
// config/messages.json
{
  "checkout": {
    "success": "Order {order_id} confirmed! Check {email} for details.",
    "error": "Payment failed for {amount}. Try again or contact support."
  }
}

// Usage in components
function OrderConfirmation({ orderId, email }: Props) {
  const message = interpolate(
    config.messages.checkout.success,
    { order_id: orderId, email }
  );
  
  return <p>{message}</p>;
}
```

### Multi-Language Templates

```typescript
const messages = {
  en: "Welcome {name}! You have {count} items in your cart.",
  fr: "Bienvenue {name}! Vous avez {count} articles dans votre panier."
};

function getLocalizedMessage(locale: string, vars: Record<string, any>) {
  return interpolate(messages[locale] || messages.en, vars);
}
```

## Best Practices

**Use descriptive variable names:** `{product_name}` not `{p}`, `{order_total}` not `{total}`

**Keep templates in configuration:** Don't hardcode templates in components. Use JSON configs or constants files.

**Validate critical variables:** Check for required data before interpolation:

```typescript
function createOrderMessage(order: Order) {
  if (!order.id || !order.total) {
    throw new Error("Order missing required fields for message generation");
  }
  
  return interpolate("Order {id}: {total}", {
    id: order.id,
    total: formatCurrency(order.total)
  });
}
```

**Format values before interpolation:** Handle currency, dates, and numbers in your data layer:

```typescript
const vars = {
  total: formatCurrency(order.total),      // "$299.99" not 29999
  date: formatDate(order.created_at),      // "Dec 15, 2025" not ISO string
  count: order.items.length.toString()     // "3" not 3
};
```

## Related Modules

- **`lib/utils/format`** - Currency, date, and number formatting for template variables
- **`lib/config/messages`** - Centralized message templates
- **`components/ui/Alert`** - UI components that consume interpolated messages

These utilities integrate with the broader content management system—templates stored as configuration, variables from database queries, output rendered in React components.