# Cart Service API Reference

**Client-side cart management utilities for the Imajin LED Platform.**

The cart service provides pure functions for managing shopping cart state. All operations are immutable—they return new cart arrays rather than modifying existing ones. This design keeps cart state predictable and makes debugging straightforward.

## Purpose

Shopping carts need consistent behavior across product variants, quantity limits, and pricing tiers. The cart service handles the complexity of Founder Edition inventory tracking, voltage compatibility warnings, and variant-specific pricing while keeping the API simple for components.

Built for client-side state management (localStorage, React Context, Zustand), these functions handle cart logic without touching databases or external services.

## Functions Reference

### addItemToCart

**Adds an item to cart or updates quantity if already exists**

Handles the common "add to cart" flow where clicking multiple times should increment quantity rather than create duplicate entries. Uses product ID and variant ID to determine uniqueness.

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `cart` | `CartItem[]` | Current cart state array |
| `item` | `CartItem` | Item to add with all required properties |

#### Returns

`CartItem[]` - New cart array with the item added or quantity updated

#### Example

```typescript
import { addItemToCart } from '@/lib/services/cart-service';

const currentCart: CartItem[] = [
  {
    productId: 'material-8x8-v',
    variantId: 'black',
    name: 'Material-8x8-V LED Panel',
    price: 15900, // $159.00 in cents
    stripePriceId: 'price_abc123',
    image: '/images/material-8x8-v-black.jpg',
    quantity: 1,
    voltage: '5v',
    isLimitedEdition: true,
    remainingQuantity: 499,
    variantName: 'BLACK'
  }
];

const newItem: CartItem = {
  productId: 'material-8x8-v',
  variantId: 'black', // Same product+variant
  name: 'Material-8x8-V LED Panel',
  price: 15900,
  stripePriceId: 'price_abc123',
  image: '/images/material-8x8-v-black.jpg',
  quantity: 2, // Adding 2 more
  voltage: '5v',
  isLimitedEdition: true,
  remainingQuantity: 499,
  variantName: 'BLACK'
};

const updatedCart = addItemToCart(currentCart, newItem);
// Result: Same item with quantity = 3 (1 + 2)
```

#### Implementation Notes

The function combines quantities when the same product+variant combination is added multiple times. For products without variants, only `productId` determines uniqueness. This prevents cart UI confusion where users see duplicate entries for the same item.

---

### removeItemFromCart

**Removes an item from cart**

Completely removes an item regardless of quantity. For quantity adjustments, use `updateItemQuantity` instead.

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `cart` | `CartItem[]` | Current cart state array |
| `productId` | `string` | Product identifier to remove |
| `variantId` | `string?` | Variant identifier (if applicable) |

#### Returns

`CartItem[]` - New cart array with the item removed

#### Example

```typescript
const cartWithItems = [
  { productId: 'panel-1', variantId: 'black', quantity: 5, /* ... */ },
  { productId: 'panel-2', quantity: 2, /* ... */ }
];

// Remove specific variant
const withoutBlack = removeItemFromCart(cartWithItems, 'panel-1', 'black');
// Result: Only panel-2 remains

// Remove product without variants
const empty = removeItemFromCart(withoutBlack, 'panel-2');
// Result: Empty cart
```

#### Error Handling

If the specified item doesn't exist in the cart, the function returns the original cart unchanged. No exceptions are thrown.

---

### updateItemQuantity

**Updates quantity for an item in cart**

Changes quantity for an existing cart item. If quantity reaches zero, the item is removed from cart automatically.

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `cart` | `CartItem[]` | Current cart state array |
| `productId` | `string` | Product identifier to update |
| `quantity` | `number` | New quantity (must be >= 0) |
| `variantId` | `string?` | Variant identifier (if applicable) |

#### Returns

`CartItem[]` - New cart array with updated quantity or item removed

#### Example

```typescript
const cart = [
  { productId: 'panel-1', variantId: 'white', quantity: 3, /* ... */ }
];

// Update quantity
const updated = updateItemQuantity(cart, 'panel-1', 5, 'white');
// Result: Same item with quantity = 5

// Remove by setting quantity to 0
const removed = updateItemQuantity(cart, 'panel-1', 0, 'white');
// Result: Empty cart
```

#### Implementation Notes

Negative quantities are treated as zero and remove the item. This prevents invalid cart states while providing intuitive behavior for UI components.

---

### clearCart

**Clears all items from cart**

Returns an empty cart array. Useful for post-purchase cleanup or "start over" functionality.

#### Returns

`CartItem[]` - Empty array

#### Example

```typescript
const fullCart = [/* multiple items */];
const empty = clearCart();
// Result: []
```

---

### getCartItemCount

**Gets cart item count (total quantities)**

Calculates the total number of items across all products and variants. This is the number typically shown in cart badges or navigation indicators.

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `cart` | `CartItem[]` | Cart state array to count |

#### Returns

`number` - Sum of all item quantities

#### Example

```typescript
const cart = [
  { productId: 'panel-1', quantity: 3, /* ... */ },
  { productId: 'panel-2', quantity: 1, /* ... */ },
  { productId: 'panel-1', variantId: 'red', quantity: 2, /* ... */ }
];

const count = getCartItemCount(cart);
// Result: 6 (3 + 1 + 2)
```

---

### getCartSubtotal

**Gets cart subtotal (in cents)**

Calculates the pre-tax total for all cart items. Returns value in cents to avoid floating-point precision issues common in currency calculations.

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `cart` | `CartItem[]` | Cart state array to total |

#### Returns

`number` - Subtotal in cents (divide by 100 for display)

#### Example

```typescript
const cart = [
  { productId: 'panel-1', price: 15900, quantity: 2, /* ... */ }, // $159 × 2
  { productId: 'accessory', price: 2500, quantity: 1, /* ... */ }  // $25 × 1
];

const subtotal = getCartSubtotal(cart);
// Result: 34300 (318.00 + 25.00 = $343.00)

// For display
const displayPrice = `$${(subtotal / 100).toFixed(2)}`;
// Result: "$343.00"
```

#### Implementation Notes

Prices are stored in cents throughout the system to match Stripe's requirements and avoid decimal math errors. The cart service maintains this convention consistently.

---

### getCartItemKey

**Generates unique key for cart item**

Creates a stable identifier for cart items, combining product ID and variant ID. Essential for React keys and cart item lookups.

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `productId` | `string` | Product identifier |
| `variantId` | `string?` | Variant identifier (optional) |

#### Returns

`string` - Unique key combining both identifiers

#### Example

```typescript
// Product with variant
const key1 = getCartItemKey('material-8x8-v', 'black');
// Result: "material-8x8-v-black"

// Product without variant
const key2 = getCartItemKey('power-supply-5v');
// Result: "power-supply-5v"
```

---

### findCartItem

**Finds item in cart**

Locates a cart item by product ID and optional variant ID. Returns the item if found, `undefined` if not present.

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `cart` | `CartItem[]` | Cart state array to search |
| `productId` | `string` | Product identifier to find |
| `variantId` | `string?` | Variant identifier (if applicable) |

#### Returns

`CartItem | undefined` - Found item or undefined

#### Example

```typescript
const cart = [
  { productId: 'panel-1', variantId: 'white', quantity: 2, /* ... */ }
];

const found = findCartItem(cart, 'panel-1', 'white');
// Result: CartItem object

const notFound = findCartItem(cart, 'panel-1', 'black');
// Result: undefined
```

## Common Patterns

### Basic Cart Operations

```typescript
// Initialize empty cart
let cart: CartItem[] = [];

// Add first item
cart = addItemToCart(cart, newItem);

// Check if item exists before conditional logic
const existingItem = findCartItem(cart, productId, variantId);
if (existingItem && existingItem.quantity >= 10) {
  // Show bulk discount UI
}

// Update quantities
cart = updateItemQuantity(cart, productId, newQuantity, variantId);

// Calculate totals for display
const itemCount = getCartItemCount(cart);
const subtotal = getCartSubtotal(cart);
```

### Voltage Compatibility Checking

```typescript
// Check for voltage mixing (5v and 24v systems are incompatible)
function hasVoltageMixing(cart: CartItem[]): boolean {
  const voltages = cart
    .filter(item => item.voltage)
    .map(item => item.voltage);
  
  return voltages.includes('5v') && voltages.includes('24v');
}

// Show warning before adding incompatible items
if (hasVoltageMixing([...cart, newItem])) {
  // Display compatibility warning
  return;
}
```

### Limited Edition Inventory

```typescript
// Check remaining inventory before adding
const item = findCartItem(cart, productId, variantId);
const requestedQuantity = newQuantity;
const currentQuantity = item?.quantity || 0;
const additionalNeeded = requestedQuantity - currentQuantity;

if (item?.isLimitedEdition && 
    item?.remainingQuantity < additionalNeeded) {
  // Show "limited stock" warning
  return;
}
```

## Type Reference

### CartItem

```typescript
interface CartItem {
  productId: string;              // Database product ID
  variantId?: string;             // Variant ID (color, config)
  name: string;                   // Display name
  price: number;                  // Price in cents
  stripePriceId: string;          // Stripe Price ID for checkout
  image: string;                  // Product image URL
  quantity: number;               // Item count
  voltage?: '5v' | '24v';         // System voltage
  isLimitedEdition?: boolean;     // Founder Edition flag
  remainingQuantity?: number;     // Available inventory
  variantName?: string;           // Display name for variant
}
```

## Related Modules

- **[Stripe Service](/docs/api/stripe-service.md)** - Processes cart contents for payment
- **[Product Service](/docs/api/product-service.md)** - Fetches product data for cart items  
- **[Order Service](/docs/api/order-service.md)** - Converts completed checkouts to orders
- **[Cart Context](/docs/components/cart-context.md)** - React hooks and providers using these functions

The cart service handles pure cart logic while other modules manage persistence, payment processing, and UI state.