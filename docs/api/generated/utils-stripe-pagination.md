# Stripe Pagination Utilities

**Comprehensive pagination handling for Stripe's list endpoints**

The `utils/stripe-pagination` module provides robust pagination utilities for Stripe API list operations. Stripe returns paginated results for large datasets—this module automatically handles the iteration, preserving your query parameters across all requests.

## Purpose

Stripe's list endpoints (products, prices, customers, etc.) return paginated results with a `has_more` flag and cursor-based pagination. Instead of manually managing multiple API calls, this utility fetches all results in a single function call.

**Key benefits:**
- **Complete datasets** - Never miss items due to pagination limits
- **Filter preservation** - Query parameters persist across all pages
- **Type safety** - Full TypeScript support with generic constraints
- **Error handling** - Robust error propagation from Stripe API

## Functions Reference

### paginateStripeList

**Automatically paginate through all results from any Stripe list endpoint**

Iterates through paginated Stripe API responses, collecting all items across multiple pages while preserving filters and query parameters.

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `listFn` | `StripeListFunction<T>` | Stripe list function to paginate (e.g., `stripe.products.list`) |
| `params` | `StripeListParams` | Initial query parameters including filters, limit, etc. |

#### Returns

`Promise<T[]>` - Complete array of all results across all pages

#### Example

```typescript
import { stripe } from '@/lib/stripe'
import { paginateStripeList } from '@/lib/utils/stripe-pagination'

// Get all active products (across all pages)
const allProducts = await paginateStripeList(
  stripe.products.list.bind(stripe.products),
  {
    active: true,
    limit: 100 // Stripe's max per page
  }
)

// Get all prices for a specific product
const allPrices = await paginateStripeList(
  stripe.prices.list.bind(stripe.prices),
  {
    product: 'prod_ABC123',
    active: true
  }
)

// Get customers with complex filtering
const recentCustomers = await paginateStripeList(
  stripe.customers.list.bind(stripe.customers),
  {
    created: { gte: Math.floor(Date.now() / 1000) - 86400 }, // Last 24h
    limit: 50
  }
)
```

#### Error Handling

- **API failures** - Stripe API errors propagate directly (network issues, rate limits, auth failures)
- **Malformed responses** - Throws if response lacks expected `data` array or `has_more` field
- **Type safety** - TypeScript ensures the list function returns compatible response structure

```typescript
try {
  const products = await paginateStripeList(
    stripe.products.list.bind(stripe.products),
    { active: true }
  )
} catch (error) {
  if (error.type === 'StripeConnectionError') {
    // Handle network issues
  } else if (error.type === 'StripeAuthenticationError') {
    // Handle API key problems
  }
  // Other Stripe errors...
}
```

#### Implementation Notes

- **Cursor pagination** - Uses `starting_after` parameter with the last item's ID from each page
- **Parameter preservation** - All original query parameters are maintained across paginated requests
- **Memory efficient** - Accumulates results in a single array, but loads one page at a time
- **Rate limiting** - No built-in delays; relies on Stripe's SDK rate limit handling

## Type Definitions

### StripeListResponse<T>

Standard Stripe list response structure used across all list endpoints.

```typescript
interface StripeListResponse<T> {
  data: T[]        // Array of results for current page
  has_more: boolean // Whether more pages exist
}
```

### StripeListParams

Parameters for Stripe list operations, extending common pagination options.

```typescript
type StripeListParams = {
  limit?: number         // Items per page (max 100)
  starting_after?: string // Cursor for pagination
  [key: string]: unknown // Endpoint-specific filters
}
```

### StripeListFunction<T>

Function signature for Stripe list operations.

```typescript
type StripeListFunction<T> = (
  params: StripeListParams
) => Promise<StripeListResponse<T>>
```

## Common Patterns

### Product Catalog Synchronization

```typescript
// Sync all Stripe products to local database
async function syncStripeProducts() {
  const allProducts = await paginateStripeList(
    stripe.products.list.bind(stripe.products),
    { active: true }
  )
  
  for (const product of allProducts) {
    await upsertProduct({
      stripeId: product.id,
      name: product.name,
      description: product.description,
      // ... other fields
    })
  }
}
```

### Reporting and Analytics

```typescript
// Get all payments from last month for reporting
const lastMonth = Math.floor(
  new Date().setMonth(new Date().getMonth() - 1) / 1000
)

const allCharges = await paginateStripeList(
  stripe.charges.list.bind(stripe.charges),
  {
    created: { gte: lastMonth },
    limit: 100
  }
)

const totalRevenue = allCharges
  .filter(charge => charge.paid)
  .reduce((sum, charge) => sum + charge.amount, 0)
```

### Customer Migration

```typescript
// Bulk update customer metadata
async function updateAllCustomerMetadata(newMetadata: Record<string, string>) {
  const allCustomers = await paginateStripeList(
    stripe.customers.list.bind(stripe.customers),
    { limit: 100 }
  )
  
  // Process in batches to avoid rate limits
  const batches = chunk(allCustomers, 10)
  
  for (const batch of batches) {
    await Promise.all(
      batch.map(customer =>
        stripe.customers.update(customer.id, {
          metadata: { ...customer.metadata, ...newMetadata }
        })
      )
    )
  }
}
```

## Best Practices

### Function Binding

Always bind Stripe methods to preserve their context:

```typescript
// ✅ Correct - maintains 'this' context
const products = await paginateStripeList(
  stripe.products.list.bind(stripe.products),
  params
)

// ❌ Incorrect - loses context, will throw errors
const products = await paginateStripeList(
  stripe.products.list,
  params
)
```

### Limit Configuration

Use Stripe's maximum limit for efficiency:

```typescript
// ✅ Efficient - fewer API calls
const results = await paginateStripeList(listFn, {
  limit: 100, // Stripe's maximum
  active: true
})

// ❌ Inefficient - many small requests
const results = await paginateStripeList(listFn, {
  limit: 10,
  active: true
})
```

### Error Recovery

Handle network issues gracefully:

```typescript
async function robustPagination(listFn, params, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await paginateStripeList(listFn, params)
    } catch (error) {
      if (i === maxRetries - 1) throw error
      
      // Exponential backoff for retries
      await new Promise(resolve => 
        setTimeout(resolve, Math.pow(2, i) * 1000)
      )
    }
  }
}
```

## Related Modules

- **`lib/stripe`** - Stripe client configuration and initialization
- **`lib/services/stripe-sync`** - Product and price synchronization using these utilities
- **`lib/services/orders`** - Order processing with Stripe data fetching
- **`app/api/webhooks/stripe`** - Webhook handlers for real-time updates

## Architecture Context

This utility is part of Imajin's **self-hosted commerce architecture**. Unlike SaaS platforms that abstract pagination, we handle it explicitly to:

- **Control data flow** - Complete visibility into what data we're processing
- **Optimize performance** - Batch operations across full datasets
- **Enable federation** - Future trust hub architecture needs complete dataset access
- **Maintain ownership** - No hidden pagination limits or restrictions

The pagination utility supports Imajin's philosophy of **true ownership**—your commerce platform, your data, your control over how it's processed.