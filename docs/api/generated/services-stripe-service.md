# Stripe Service

The Stripe service provides payment processing functionality for the Imajin LED Platform, handling checkout sessions, webhooks, and refunds. Built for modularity, it supports both standard purchases and the two-phase pre-sale workflow (deposits + pre-orders).

## Purpose

Stripe integration powers Imajin's e-commerce functionality with three distinct checkout flows:

1. **Standard checkout** - Direct purchases for available products
2. **Deposit checkout** - Refundable deposits that secure wholesale pricing during pre-sales
3. **Pre-order checkout** - Final payment after deposit, with automatic deposit credit application

The service abstracts Stripe's complexity while maintaining full control over payment flows and customer data.

## When to Use

- Creating checkout sessions for any purchase type
- Processing webhook events from Stripe
- Handling refunds and order modifications
- Fetching product/price data from Stripe

## Functions Reference

### getStripeInstance

**Returns the configured Stripe instance for server-side operations**

Creates a singleton Stripe client using the secret key from environment variables. All other functions in this module use this instance internally.

**Returns**
- `Stripe` - Configured Stripe client instance

**Example**
```typescript
import { getStripeInstance } from '@/lib/services/stripe-service'

const stripe = getStripeInstance()
const products = await stripe.products.list({ active: true })
```

**Error Handling**
- Throws if `STRIPE_SECRET_KEY` environment variable is missing
- Stripe SDK handles API errors with detailed error objects

**Implementation Notes**
Uses the official Stripe Node.js SDK. The instance is cached for performance—multiple calls return the same client.

---

### createCheckoutSession

**Creates a standard Stripe Checkout Session for immediate purchases**

Handles the most common purchase flow where customers pay the full amount upfront. Session metadata includes order tracking information for webhook processing.

**Parameters**
- `params` (CreateCheckoutSessionParams) - Checkout configuration object
  - `items` (Array) - Line items for checkout
    - `stripePriceId` (string) - Stripe Price ID (not Product ID)
    - `quantity` (number) - Item quantity
  - `customerEmail` (string) - Pre-filled customer email
  - `metadata?` (Record<string, string>) - Optional session metadata
  - `successUrl?` (string) - Post-payment redirect URL
  - `cancelUrl?` (string) - Cancellation redirect URL

**Returns**
- `Promise<Stripe.Checkout.Session>` - Created checkout session with payment URL

**Example**
```typescript
import { createCheckoutSession } from '@/lib/services/stripe-service'

const session = await createCheckoutSession({
  items: [
    { stripePriceId: 'price_1234567890', quantity: 1 }
  ],
  customerEmail: 'customer@example.com',
  metadata: { orderId: 'order_abc123' },
  successUrl: 'https://imajin.ca/success',
  cancelUrl: 'https://imajin.ca/cart'
})

// Redirect customer to session.url
```

**Error Handling**
- Stripe API errors bubble up with detailed messages
- Invalid price IDs fail before session creation
- Network issues result in connection error exceptions

**Implementation Notes**
Uses Stripe Checkout's hosted payment page. Session IDs double as order IDs in our system for simplicity. Payment methods are configured at the Stripe account level.

---

### createDepositCheckoutSession

**Creates a Stripe Checkout Session for pre-sale deposits**

This creates a payment session for a refundable deposit that secures wholesale pricing for the customer, gets stored with metadata linking to the target product, can be refunded if customer changes mind, and gets applied to final payment when product moves to pre-order.

**Parameters**
- `params` (CreateDepositCheckoutParams) - Deposit checkout configuration
  - `productId` (string) - Target product identifier
  - `variantId?` (string) - Optional variant specification
  - `depositAmount` (number) - Deposit amount in cents
  - `customerEmail` (string) - Customer email address
  - `successUrl?` (string) - Success redirect URL
  - `cancelUrl?` (string) - Cancellation redirect URL

**Returns**
- `Promise<Stripe.Checkout.Session>` - Deposit checkout session

**Example**
```typescript
import { createDepositCheckoutSession } from '@/lib/services/stripe-service'

const session = await createDepositCheckoutSession({
  productId: 'material-8x8-v',
  variantId: 'founder-black',
  depositAmount: 5000, // $50.00 in cents
  customerEmail: 'maker@example.com',
  successUrl: 'https://imajin.ca/deposit-success'
})
```

**Error Handling**
- Validates deposit amount is positive
- Product/variant validation happens in calling code
- Standard Stripe API error handling applies

**Implementation Notes**
Creates a dynamic price for the exact deposit amount. Metadata links the deposit to the target product for later pre-order processing. The session ID becomes the deposit order ID.

---

### createPreOrderCheckoutSession

**Creates a Stripe Checkout Session for pre-order with deposit application**

This creates a payment session for the final payment that charges the remaining balance after deposit, links to the original deposit order, and marks deposit as 'applied' after successful payment.

**Parameters**
- `params` (CreatePreOrderCheckoutParams) - Pre-order checkout configuration
  - `items` (Array) - Final order line items
    - `stripePriceId` (string) - Product price ID
    - `quantity` (number) - Item quantity
  - `customerEmail` (string) - Customer email (must match deposit)
  - `depositOrderId?` (string) - Original deposit order ID for credit application
  - `successUrl?` (string) - Success redirect URL
  - `cancelUrl?` (string) - Cancellation redirect URL

**Returns**
- `Promise<Stripe.Checkout.Session>` - Pre-order checkout session

**Example**
```typescript
import { createPreOrderCheckoutSession } from '@/lib/services/stripe-service'

const session = await createPreOrderCheckoutSession({
  items: [
    { stripePriceId: 'price_founder_edition_black', quantity: 1 }
  ],
  customerEmail: 'maker@example.com',
  depositOrderId: 'cs_deposit_abc123',
  successUrl: 'https://imajin.ca/preorder-success'
})
```

**Error Handling**
- Validates deposit order exists and is unused
- Email must match original deposit
- Standard checkout validation applies

**Implementation Notes**
Webhooks handle the deposit credit logic after successful payment. The system prevents double-application of deposits through order status tracking.

---

### getCheckoutSession

**Retrieves a checkout session with expanded data**

Fetches session details including line items and payment intent information. Used by webhooks and order confirmation pages to process completed payments.

**Parameters**
- `sessionId` (string) - Stripe Checkout Session ID

**Returns**
- `Promise<Stripe.Checkout.Session>` - Session with expanded line items and payment intent

**Example**
```typescript
import { getCheckoutSession } from '@/lib/services/stripe-service'

const session = await getCheckoutSession('cs_1234567890')
console.log(session.payment_status) // 'paid'
console.log(session.line_items?.data) // Array of purchased items
```

**Error Handling**
- Throws if session ID doesn't exist
- Returns expired sessions (check `expires_at` field)
- Network timeouts result in connection errors

**Implementation Notes**
Expands `line_items` and `payment_intent` by default to avoid additional API calls. Sessions expire 24 hours after creation.

---

### verifyWebhookSignature

**Verifies Stripe webhook signature for security**

Validates that webhook requests actually come from Stripe using cryptographic signatures. Essential for preventing webhook spoofing attacks.

**Parameters**
- `payload` (string | Buffer) - Raw request body (must be unchanged)
- `signature` (string) - Stripe signature from request headers
- `secret` (string) - Webhook endpoint secret from Stripe dashboard

**Returns**
- `Stripe.Event` - Verified webhook event object

**Example**
```typescript
import { verifyWebhookSignature } from '@/lib/services/stripe-service'

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!
  
  try {
    const event = verifyWebhookSignature(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
    
    // Process verified event
    console.log(`Verified event: ${event.type}`)
  } catch (error) {
    return new Response('Invalid signature', { status: 400 })
  }
}
```

**Error Handling**
- Throws detailed errors for signature verification failures
- Invalid timestamps cause rejection (prevents replay attacks)
- Malformed signatures are rejected immediately

**Implementation Notes**
**Critical**: Never skip signature verification in production. Attackers can send fake webhook events without proper verification. Always use the raw request body—JSON parsing invalidates signatures.

---

### createRefund

**Processes a refund through Stripe**

Issues full or partial refunds for completed payments. Commonly used for deposit refunds when customers change their mind before pre-order.

**Parameters**
- `paymentIntentId` (string) - Stripe Payment Intent ID from completed payment
- `amount?` (number) - Optional refund amount in cents (defaults to full refund)

**Returns**
- `Promise<Stripe.Refund>` - Created refund object with status and timing

**Example**
```typescript
import { createRefund } from '@/lib/services/stripe-service'

// Full refund
const refund = await createRefund('pi_1234567890')

// Partial refund ($25.00)
const partialRefund = await createRefund('pi_1234567890', 2500)

console.log(`Refund status: ${refund.status}`) // 'succeeded'
```

**Error Handling**
- Fails if payment intent doesn't exist or wasn't captured
- Partial refunds can't exceed remaining refundable amount
- Some payment methods have longer refund processing times

**Implementation Notes**
Refunds appear in customer's account according to their payment method timeline (typically 5-10 business days for cards). Stripe handles the complexity of different payment method refund flows.

---

### fetchStripeProducts

**Fetches all active products from Stripe**

Retrieves the complete list of products marked as active in Stripe. Used during product catalog synchronization or admin operations.

**Returns**
- `Promise<Stripe.Product[]>` - Array of active Stripe products

**Example**
```typescript
import { fetchStripeProducts } from '@/lib/services/stripe-service'

const products = await fetchStripeProducts()
console.log(`Found ${products.length} active products`)

products.forEach(product => {
  console.log(`${product.name}: ${product.id}`)
})
```

**Error Handling**
- Standard Stripe API error handling
- Large product catalogs are automatically paginated
- Network issues bubble up as connection errors

**Implementation Notes**
Only returns products with `active: true`. Stripe automatically handles pagination for large catalogs. Consider caching results for frequently accessed data.

---

### fetchStripeProduct

**Fetches a single product from Stripe by ID**

Retrieves detailed information for a specific product, including metadata and configuration.

**Parameters**
- `productId` (string) - Stripe Product ID

**Returns**
- `Promise<Stripe.Product>` - Product details

**Example**
```typescript
import { fetchStripeProduct } from '@/lib/services/stripe-service'

const product = await fetchStripeProduct('prod_1234567890')
console.log(`Product: ${product.name}`)
console.log(`Description: ${product.description}`)
console.log(`Metadata:`, product.metadata)
```

**Error Handling**
- Throws if product ID doesn't exist
- Returns inactive products (check `active` field)
- Invalid ID format causes immediate rejection

**Implementation Notes**
Returns both active and inactive products. Check the `active` field if you need to filter. Product metadata contains custom fields set during product creation.

---

### fetchStripePrices

**Fetches all active prices from Stripe**

Retrieves the complete price list for building dynamic product catalogs or pricing analysis.

**Returns**
- `Promise<Stripe.Price[]>` - Array of active Stripe prices

**Example**
```typescript
import { fetchStripePrices } from '@/lib/services/stripe-service'

const prices = await fetchStripePrices()
const usdPrices = prices.filter(price => price.currency === 'usd')

console.log(`Found ${usdPrices.length} USD prices`)
```

**Error Handling**
- Standard Stripe API error handling
- Automatic pagination for large price lists
- Network timeouts result in connection errors

**Implementation Notes**
Returns prices for all products and currencies. Filter by `product` field to get prices for specific products. Prices are immutable—updates create new price objects.

---

### fetchPricesForProduct

**Fetches prices for a specific product**

Retrieves all pricing options (variants, currencies, billing periods) for a single product.

**Parameters**
- `productId` (string) - Stripe Product ID

**Returns**
- `Promise<Stripe.Price[]>` - Array of prices for the specified product

**Example**
```typescript
import { fetchPricesForProduct } from '@/lib/services/stripe-service'

const prices = await fetchPricesForProduct('prod_founder_edition')
const oneTimePrices = prices.filter(price => price.type === 'one_time')

oneTimePrices.forEach(price => {
  console.log(`${price.nickname}: $${price.unit_amount! / 100}`)
})
```

**Error Handling**
- Returns empty array if product has no prices
- Invalid product IDs cause API errors
- Includes both active and inactive prices

**Implementation Notes**
More efficient than fetching all prices and filtering. Results include all price types (one-time, recurring) and currencies. Use `active` field to filter current pricing.

---

### fetchStripePrice

**Fetches a single price from Stripe by ID**

Retrieves detailed pricing information including amount, currency, and billing configuration.

**Parameters**
- `priceId` (string) - Stripe Price ID

**Returns**
- `Promise<Stripe.Price>` - Price details

**Example**
```typescript
import { fetchStripePrice } from '@/lib/services/stripe-service'

const price = await fetchStripePrice('price_1234567890')
console.log(`Price: $${price.unit_amount! / 100} ${price.currency.toUpperCase()}`)
console.log(`Product: ${price.product}`)
console.log(`Active: ${price.active}`)
```

**Error Handling**
- Throws if price ID doesn't exist
- Returns inactive prices (check `active` field)
- Invalid ID format causes immediate rejection

**Implementation Notes**
Price amounts are in cents (or smallest currency unit). The `product` field contains the associated product ID. Prices are immutable—changes require creating new price objects.

## Common Patterns

### Standard Purchase Flow

```typescript
// 1. Create checkout session
const session = await createCheckoutSession({
  items: [{ stripePriceId: 'price_123', quantity: 1 }],
  customerEmail: 'customer@example.com',
  successUrl: 'https://imajin.ca/success',
  cancelUrl: 'https://imajin.ca/cart'
})

// 2. Redirect customer to session.url
// 3. Handle webhook on payment completion
```

### Pre-sale Deposit + Pre-order Flow

```typescript
// Phase 1: Collect deposit
const depositSession = await createDepositCheckoutSession({
  productId: 'material-8x8-v',
  variantId: 'founder-black',
  depositAmount: 5000, // $50
  customerEmail: 'maker@example.com'
})

// Phase 2: Later, when product is ready
const preorderSession = await createPreOrderCheckoutSession({
  items: [{ stripePriceId: 'price_founder_black', quantity: 1 }],
  customerEmail: 'maker@example.com', // Must match deposit
  depositOrderId: 'cs_deposit_abc123' // Links to original deposit
})
```

### Webhook Processing

```typescript
export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!
  
  // Always verify webhooks
  const event = verifyWebhookSignature(body, signature, webhookSecret)
  
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object
      await processCompletedOrder(session.id)
      break
    
    case 'payment_intent.succeeded':
      // Handle successful payment
      break
  }
  
  return new Response('OK')
}
```

## Best Practices

### Security
- **Always verify webhook signatures** - Never process unverified webhook events
- **Use environment variables** - Keep Stripe keys out of source code
- **Validate amounts** - Double-check payment amounts against expected values

### Error Handling
- **Expect API failures** - Stripe API calls can timeout or fail
- **Log payment events** - Essential for debugging payment issues
- **Handle edge cases** - Expired sessions, insufficient funds, etc.

### Performance
- **Cache product/price data** - Avoid repeated API calls for static data
- **Use webhook endpoints** - More reliable than polling for payment status
- **Implement retry logic** - For handling temporary API failures

## Things to Watch Out For

### Price vs Product IDs
Stripe has separate concepts for products (items) and prices (cost). Always use **Price IDs** for checkout sessions, not Product IDs.

### Currency Precision
All amounts are in cents (or smallest currency unit). A $49.99 item is represented as `4999`, not `49.99`.

### Webhook Timing
Webhooks can arrive out of order or be delayed. Design your webhook handlers to be idempotent and handle duplicate events.

### Session Expiration
Checkout sessions expire after 24 hours. Don't store session URLs for later use—create fresh sessions for each purchase attempt.

## Related Modules

- **Order Service** - Processes completed payments from Stripe webhooks
- **Cart Service** - Prepares line items for Stripe checkout sessions
- **Inventory Service** - Handles stock decrements after successful payments
- **Email Service** - Sends order confirmations triggered by payment events

This service forms the payment processing core of Imajin's e-commerce platform, handling everything from simple purchases to complex pre-sale workflows while maintaining the flexibility needed for future trust hub federation.