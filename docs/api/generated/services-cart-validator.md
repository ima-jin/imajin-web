# Cart Validator Service

**Real-time cart validation with inventory checks and compatibility enforcement.**

The cart validator ensures customers never reach checkout with invalid items—out-of-stock Founder Editions, incompatible voltage combinations, or discontinued products. It runs before every checkout attempt and provides detailed feedback for cart corrections.

## Purpose

E-commerce carts can become stale quickly. Products get discontinued, limited editions sell out, and customers mix incompatible components. The cart validator catches these issues early with specific, actionable error messages that help customers fix their carts instead of abandoning them.

**Key validation rules:**
- Inventory checks (Founder Edition stock levels)
- Voltage compatibility (5v and 24v systems cannot mix)
- Product availability (dev_status filtering)
- Quantity limits (prevent overselling)

## Functions Reference

### validateCart

**Validates cart items against current inventory and compatibility rules.**

Runs comprehensive validation checks on cart items before checkout processing. Returns detailed results with specific errors for each invalid item, allowing the UI to highlight problems and suggest fixes.

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `items` | `CartItem[]` | Array of cart items to validate |

#### Returns

`Promise<CartValidationResult>` - Validation results with success status and detailed error information.

#### CartValidationResult Structure

```typescript
interface CartValidationResult {
  isValid: boolean;           // Overall validation status
  errors: CartValidationError[]; // Specific validation failures
  warnings: CartValidationWarning[]; // Non-blocking issues
  totalValue: number;         // Validated cart total in cents
}
```

#### Example Usage

```typescript
import { validateCart } from '@/lib/services/cart-validator';

// Validate cart before checkout
async function handleCheckout(cartItems: CartItem[]) {
  const validation = await validateCart(cartItems);
  
  if (!validation.isValid) {
    // Show specific errors to user
    validation.errors.forEach(error => {
      console.log(`Item ${error.itemId}: ${error.message}`);
    });
    return;
  }
  
  // Proceed to Stripe checkout
  proceedToCheckout(cartItems, validation.totalValue);
}
```

#### Error Handling

**Common validation failures:**

- **Insufficient inventory** - Founder Edition sold out since adding to cart
- **Voltage mismatch** - 5v and 24v components in same order
- **Product unavailable** - Item no longer available for sale
- **Invalid quantity** - Exceeds maximum allowed per order

```typescript
// Handle specific error types
validation.errors.forEach(error => {
  switch (error.type) {
    case 'INSUFFICIENT_INVENTORY':
      showInventoryError(error.itemId, error.availableQuantity);
      break;
    case 'VOLTAGE_MISMATCH':
      showCompatibilityWarning(error.conflictingItems);
      break;
    case 'PRODUCT_UNAVAILABLE':
      removeItemFromCart(error.itemId);
      break;
  }
});
```

#### Implementation Notes

**Database queries:** The validator runs fresh inventory queries to prevent race conditions between cart storage and checkout. Cart items include snapshot data for pricing, but inventory is always checked in real-time.

**Voltage compatibility:** The system enforces strict voltage separation. 5v systems (USB-powered, portable) and 24v systems (permanent installations) use different controllers and cannot be mixed in a single order.

**Founder Edition tracking:** Limited edition variants have strict inventory limits (BLACK: 500, WHITE: 300, RED: 200). The validator prevents overselling by checking available quantities at validation time, not just at payment processing.

**Performance considerations:** Validation runs on every checkout attempt, so queries are optimized for speed. Consider caching product availability data for high-traffic scenarios.

## Common Patterns

### Pre-Checkout Validation

```typescript
// Typical checkout flow
export async function initiateCheckout(sessionId: string) {
  const cartItems = await getCartItems(sessionId);
  
  // Always validate before Stripe
  const validation = await validateCart(cartItems);
  if (!validation.isValid) {
    return { success: false, errors: validation.errors };
  }
  
  return await createStripeCheckoutSession(cartItems);
}
```

### Real-Time Cart Updates

```typescript
// Validate when cart changes
export async function addToCart(productId: string, quantity: number) {
  const updatedCart = await updateCartItems(productId, quantity);
  
  // Immediate feedback on compatibility
  const validation = await validateCart(updatedCart);
  return {
    cart: updatedCart,
    validation: validation
  };
}
```

### Inventory Warnings

```typescript
// Show warnings before errors occur
if (validation.warnings.length > 0) {
  validation.warnings.forEach(warning => {
    if (warning.type === 'LOW_INVENTORY') {
      showNotification(`Only ${warning.remaining} left in stock!`);
    }
  });
}
```

## Error Types Reference

### INSUFFICIENT_INVENTORY
Item quantity exceeds available stock. Includes `availableQuantity` field with current stock level.

### VOLTAGE_MISMATCH  
Cart contains both 5v and 24v components. Includes `conflictingItems` array with incompatible product IDs.

### PRODUCT_UNAVAILABLE
Product no longer available for sale (dev_status changed). Item should be removed from cart.

### INVALID_QUANTITY
Quantity exceeds per-order limits or is less than minimum order quantity.

### PRICE_CHANGED
Product price changed since adding to cart. Includes `currentPrice` field with updated pricing.

## Related Modules

- **[Cart Management](/docs/api/cart-management.md)** - Cart CRUD operations and session handling
- **[Inventory Service](/docs/api/inventory-service.md)** - Stock tracking and Founder Edition limits  
- **[Product Compatibility](/docs/api/product-compatibility.md)** - Voltage and component compatibility rules
- **[Checkout Service](/docs/api/checkout-service.md)** - Stripe integration and order processing

The cart validator sits between cart management and checkout processing, ensuring only valid carts reach payment processing while providing clear feedback for invalid states.