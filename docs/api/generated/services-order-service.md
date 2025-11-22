# Order Service API Reference

The order service manages the complete order lifecycle from checkout completion through fulfillment. It handles atomic order creation, inventory management for limited editions, deposit tracking for pre-sale pricing, and order status updates.

## Purpose

This service exists to bridge Stripe checkout sessions with your database, ensuring data consistency and providing the business logic needed for Imajin's unique pricing model. Every order creation runs in a transaction—if any step fails, nothing commits.

## When to Use

- **Webhook handlers** - Create orders from Stripe checkout completion
- **Order tracking** - Retrieve orders for customer service or self-service lookup  
- **Admin operations** - Update order status, add tracking numbers
- **Pricing logic** - Check deposit eligibility for conditional pricing

---

## Functions

### createOrder

**Creates order from successful Stripe checkout session with atomic inventory updates.**

#### Purpose

Converts a completed Stripe checkout into a database order with full transactional safety. The function preserves historical pricing data (snapshot), decrements limited edition inventory, and ensures no partial orders exist if any step fails.

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `params` | `CreateOrderParams` | Complete order data from checkout session |
| `params.sessionId` | `string` | Stripe Checkout Session ID (becomes order ID) |
| `params.paymentIntentId` | `string` | Stripe Payment Intent ID |
| `params.customerEmail` | `string` | Customer email address |
| `params.customerName` | `string?` | Customer name (optional) |
| `params.subtotal` | `number` | Order subtotal in cents |
| `params.tax` | `number` | Tax amount in cents |
| `params.shipping` | `number` | Shipping cost in cents |
| `params.total` | `number` | Total order amount in cents |
| `params.items` | `OrderItem[]` | Array of order items with snapshot data |
| `params.shippingAddress` | `Address?` | Shipping address object (optional) |
| `params.userId` | `string?` | User ID if customer is logged in |

#### Returns

`Promise<Order>` - Created order with all database fields populated

#### Example

```typescript
import { createOrder } from '@/lib/services/order-service'

// Called from Stripe webhook after successful checkout
const order = await createOrder({
  sessionId: 'cs_1234567890',
  paymentIntentId: 'pi_1234567890',
  customerEmail: 'customer@example.com',
  customerName: 'Alex Chen',
  subtotal: 29900, // $299.00 in cents
  tax: 2392,
  shipping: 1500,
  total: 33792,
  items: [{
    productId: 'material-8x8-v',
    variantId: 'material-8x8-v-black-founder',
    stripePriceId: 'price_founder_black',
    quantity: 2,
    unitPrice: 14950, // Founder Edition wholesale price
    productName: 'Material-8x8-V LED Panel',
    variantName: 'BLACK - Founder Edition'
  }],
  shippingAddress: {
    name: 'Alex Chen',
    line1: '123 Maker Street',
    city: 'Portland',
    state: 'OR',
    postalCode: '97201',
    country: 'US'
  }
})

console.log(`Order ${order.id} created for ${order.total / 100}`)
```

#### Error Handling

- **Insufficient inventory** - Transaction fails if limited edition stock is exhausted
- **Database errors** - All changes roll back, preventing partial orders
- **Duplicate orders** - Throws error if session ID already exists

#### Implementation Notes

The transaction flow ensures atomic operations:
1. Insert order record with checkout session data
2. Insert all order items with historical pricing preserved  
3. Decrement inventory for limited editions only (regular products have unlimited stock)
4. If any step fails, entire transaction rolls back

Limited edition inventory uses optimistic locking—concurrent checkouts for the last unit will result in one success and one failure.

---

### getOrder

**Retrieves order by ID with complete item details.**

#### Purpose

Fetches a specific order with all associated items. Used for admin order management, customer service lookups, and webhook processing where you need the full order context.

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `orderId` | `string` | Order ID (Stripe Checkout Session ID) |

#### Returns

`Promise<Order & { items: OrderItem[] } | null>` - Order with items array, or null if not found

#### Example

```typescript
const order = await getOrder('cs_1234567890')

if (!order) {
  return { error: 'Order not found' }
}

console.log(`Order ${order.id}:`)
console.log(`  Status: ${order.status}`)
console.log(`  Total: $${order.total / 100}`)
console.log(`  Items: ${order.items.length}`)

order.items.forEach(item => {
  console.log(`    ${item.quantity}x ${item.productName}`)
  if (item.variantName) {
    console.log(`      ${item.variantName}`)
  }
})
```

---

### lookupOrder

**Looks up order by email and order ID for customer self-service.**

#### Purpose

Enables customer order tracking without requiring login. Only returns the order if the provided email matches the order's customer email—this prevents order ID enumeration attacks.

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `email` | `string` | Customer email address |
| `orderId` | `string` | Order ID to look up |

#### Returns

`Promise<Order & { items: OrderItem[] } | null>` - Order if email matches, null otherwise

#### Example

```typescript
// Customer order lookup form handler
const order = await lookupOrder(
  'customer@example.com', 
  'cs_1234567890'
)

if (!order) {
  return { 
    error: 'Order not found or email does not match' 
  }
}

// Safe to show order details - email was verified
return {
  order: {
    id: order.id,
    status: order.status,
    total: order.total,
    createdAt: order.createdAt,
    trackingNumber: order.trackingNumber,
    items: order.items
  }
}
```

#### Implementation Notes

This function combines authentication and lookup in a single operation. Failed lookups don't distinguish between "order doesn't exist" and "email doesn't match" to prevent information disclosure.

---

### updateOrderStatus

**Updates order status with optional tracking information.**

#### Purpose

Admin function for order lifecycle management. Updates status and optionally adds tracking numbers. Automatically sets `shippedAt` timestamp when status changes to 'shipped'.

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `orderId` | `string` | Order ID to update |
| `status` | `string` | New status ('pending', 'processing', 'shipped', 'delivered') |
| `trackingNumber` | `string?` | Tracking number (for shipped orders) |

#### Returns

`Promise<Order[]>` - Array containing updated order record

#### Example

```typescript
// Mark order as shipped with tracking
const [updatedOrder] = await updateOrderStatus(
  'cs_1234567890',
  'shipped',
  '1Z999AA1234567890'
)

console.log(`Order ${updatedOrder.id} shipped`)
console.log(`Tracking: ${updatedOrder.trackingNumber}`)
console.log(`Shipped at: ${updatedOrder.shippedAt}`)

// Status update without tracking
await updateOrderStatus('cs_0987654321', 'processing')
```

---

### userHasPaidDeposit

**Checks if user has active deposit for conditional pricing logic.**

#### Purpose

Core function for Imajin's pre-sale pricing model. Deposit holders see wholesale prices during pre-order periods, while public customers see base prices. This function determines pricing eligibility by checking for paid, non-applied deposits.

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `userEmail` | `string \| null` | Customer email (null if not logged in) |
| `productId` | `string` | Product ID to check deposit for |

#### Returns

`Promise<boolean>` - True if user has active deposit for this product

#### Example

```typescript
// In product pricing logic
const userEmail = await getCurrentUserEmail() // null if not logged in
const hasDeposit = await userHasPaidDeposit(userEmail, 'material-8x8-v')

const pricing = hasDeposit 
  ? product.wholesalePricing  // Deposit holder sees $149.50
  : product.basePricing       // Public sees $199.00

return {
  price: pricing.price,
  originalPrice: hasDeposit ? product.basePricing.price : null,
  depositApplied: hasDeposit
}
```

#### Implementation Notes

Query logic finds orders where:
- `productId` = 'pre-sale-deposit' 
- `customerEmail` matches provided email
- `metadata.target_product_id` matches requested product
- `status` = 'paid' (not 'applied' or 'refunded')

Returns false for null emails (anonymous users can't have deposits).

---

### getDepositOrder

**Retrieves deposit order for balance calculation and deposit management.**

#### Purpose

Fetches the specific deposit order for a customer and product. Used during pre-order checkout to calculate remaining balance, during refund processing, and when marking deposits as applied after final payment.

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `userEmail` | `string` | Customer email address |
| `productId` | `string` | Product ID to get deposit for |

#### Returns

`Promise<Order | null>` - Deposit order record, or null if not found

#### Example

```typescript
// Calculate pre-order balance during checkout
const depositOrder = await getDepositOrder(
  'customer@example.com',
  'material-8x8-v'
)

if (!depositOrder) {
  throw new Error('No deposit found - not eligible for pre-order pricing')
}

const productPrice = 19900 // $199.00 wholesale
const depositAmount = depositOrder.total // $5000 ($50.00)
const remainingBalance = productPrice - depositAmount // $149.00

console.log(`Remaining balance: $${remainingBalance / 100}`)

// After successful pre-order, mark deposit as applied
await updateOrderStatus(depositOrder.id, 'applied')
```

#### Implementation Notes

Same query logic as `userHasPaidDeposit` but returns the full order record instead of a boolean. Used when you need deposit amount, order ID, or other deposit details for business logic.

---

## Common Patterns

### Order Creation Workflow

```typescript
// 1. Stripe webhook receives checkout.session.completed
// 2. Extract order data from session
// 3. Create order atomically
try {
  const order = await createOrder(checkoutData)
  console.log(`Order ${order.id} created successfully`)
} catch (error) {
  // Handle inventory exhaustion, duplicate orders, etc.
  console.error('Order creation failed:', error.message)
}
```

### Customer Order Tracking

```typescript
// 1. Customer provides email + order ID
// 2. Lookup with email verification
// 3. Return order details or generic error
const order = await lookupOrder(email, orderId)
if (order) {
  // Show order status, items, tracking
} else {
  // Generic "not found" message
}
```

### Pre-Sale Pricing Flow

```typescript
// 1. Check deposit status
const hasDeposit = await userHasPaidDeposit(userEmail, productId)

// 2. Show appropriate pricing
const price = hasDeposit ? wholesalePrice : publicPrice

// 3. If pre-ordering, get deposit for balance calculation
if (hasDeposit && isPreOrder) {
  const deposit = await getDepositOrder(userEmail, productId)
  const balance = price - deposit.total
}
```

## Error Handling

### Transaction Failures

Order creation can fail due to:
- **Inventory exhaustion** - Limited edition sold out during checkout
- **Duplicate session** - Webhook replay or race condition  
- **Database constraints** - Invalid foreign keys, data validation

All failures roll back completely—no partial orders exist.

### Lookup Failures

- `getOrder` returns `null` for missing orders
- `lookupOrder` returns `null` for both missing orders and email mismatches
- Never expose whether an order ID exists to unauthorized users

## Related Modules

- **`/lib/services/product-service`** - Product data and inventory management
- **`/lib/services/cart-service`** - Shopping cart operations
- **`/api/webhooks/stripe`** - Stripe webhook handlers that call `createOrder`
- **`/app/orders/[id]/page`** - Order detail pages using `getOrder`
- **`/app/track-order/page`** - Customer lookup using `lookupOrder`