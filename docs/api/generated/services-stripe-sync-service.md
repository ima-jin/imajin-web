# Stripe Sync Service

**Synchronizes product data between the Imajin database and Stripe's payment platform.**

The Stripe Sync Service handles the critical task of keeping product information consistent across systems. When products are updated locally, this service ensures Stripe has the correct pricing, availability, and metadata for checkout sessions.

## Purpose

E-commerce platforms need payment processors to know about products before customers can buy them. This service bridges that gap by:

- **Creating Stripe products** from local product data
- **Updating existing products** when details change
- **Archiving products** that are no longer for sale
- **Managing variant pricing** for products with multiple options (colors, configurations)

Built for Imajin's philosophy of true ownership—your product data lives in your database, and Stripe mirrors what you define.

## Functions

### syncProductToStripe

**Synchronizes a single product with Stripe, handling creation, updates, and archival based on current status.**

#### Purpose

The core synchronization function that handles all product lifecycle states. Compares local product data against Stripe's records and takes the appropriate action to maintain consistency.

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `product` | `ProductSyncInput` | Product data to sync (ID, name, description, pricing, sell status) |
| `variants` | `VariantSyncInput[]` | Optional variants that create multiple prices under one Stripe product |

#### Returns

`Promise<StripeSyncResult>` - Detailed result indicating what action was taken, including Stripe IDs and any variant prices created.

#### Example

```typescript
import { syncProductToStripe } from '@/lib/services/stripe-sync-service';

// Sync a simple product
const result = await syncProductToStripe({
  id: 'material-8x8-v1',
  name: 'Material-8x8-V LED Panel',
  description: 'Modular 64-pixel LED panel for installations',
  price_usd: 12000, // $120.00 in cents
  sell_status: 'available'
});

console.log(result.action); // 'created', 'updated', 'archived', or 'skipped'
console.log(result.stripeProductId); // 'prod_...'
console.log(result.stripePriceId); // 'price_...'
```

```typescript
// Sync product with color variants
const result = await syncProductToStripe({
  id: 'material-8x8-v1',
  name: 'Material-8x8-V LED Panel',
  description: 'Modular LED panel with color options',
  price_usd: 12000,
  sell_status: 'available'
}, [
  {
    id: 'material-8x8-v1-black',
    color: 'BLACK',
    price_usd: 12000,
    inventory_count: 500
  },
  {
    id: 'material-8x8-v1-white', 
    color: 'WHITE',
    price_usd: 12000,
    inventory_count: 300
  }
]);

console.log(result.variantPrices); 
// [{ variantId: '...', stripePriceId: 'price_...' }, ...]
```

#### Error Handling

- **Network failures**: Function throws on Stripe API errors
- **Invalid product data**: Validation errors include field-specific messages
- **Rate limiting**: Stripe SDK handles retry logic automatically
- **Partial failures**: If variant creation fails, the base product still syncs

Handle errors by wrapping in try-catch:

```typescript
try {
  const result = await syncProductToStripe(productData);
  
  if (result.error) {
    console.error(`Sync failed: ${result.error}`);
    return;
  }
  
  // Update local database with Stripe IDs
  await updateProductStripeIds(result);
  
} catch (error) {
  console.error('Stripe sync error:', error);
  // Implement retry logic or alert administrators
}
```

#### Implementation Notes

**Sync Logic Flow:**
1. Check if Stripe product exists by searching for product ID in metadata
2. Compare local data with Stripe data (name, description, price)
3. Take appropriate action: create, update, archive, or skip

**Archival Behavior:**
Products with `sell_status: 'internal'` are archived in Stripe but not deleted. This preserves historical order data while preventing new purchases.

**Variant Handling:**
Variants create multiple Stripe prices under a single product. Each variant gets its own price ID, enabling proper inventory tracking for limited editions like Founder Series.

**Idempotency:**
Safe to run multiple times—detects existing products and only updates when data differs. Essential for bulk sync operations and automated workflows.

### resetStripeClient

**Clears the internal Stripe client cache, forcing re-initialization on next API call.**

#### Purpose

Development and testing utility that ensures a fresh Stripe client connection. Useful when switching between test and live modes, or when API keys change during runtime.

#### Parameters

None.

#### Returns

`void` - No return value, performs cache clearing side effect.

#### Example

```typescript
import { resetStripeClient } from '@/lib/services/stripe-sync-service';

// Clear Stripe client cache
resetStripeClient();

// Next sync operation will use fresh client
const result = await syncProductToStripe(productData);
```

#### Implementation Notes

The service maintains a singleton Stripe client for performance. This function forces re-instantiation, which picks up any environment variable changes or configuration updates.

Primarily used in test suites and development scenarios. Production applications rarely need explicit client resets.

## Types

### StripeSyncResult

Result object returned by sync operations, providing detailed information about what occurred.

```typescript
interface StripeSyncResult {
  productId: string;           // Local product ID
  action: 'created' | 'updated' | 'archived' | 'skipped';
  stripeProductId?: string;    // Stripe product ID (if created/updated)
  stripePriceId?: string;      // Primary price ID (if created/updated)
  variantPrices?: Array<{      // Variant-specific price IDs
    variantId: string;
    stripePriceId: string;
  }>;
  error?: string;              // Error message (if sync failed)
}
```

## Common Patterns

### Bulk Product Sync

Synchronize multiple products efficiently:

```typescript
const products = await getProductsReadyForSync();
const results = [];

for (const product of products) {
  try {
    const result = await syncProductToStripe(product, product.variants);
    results.push(result);
    
    // Update local database with Stripe IDs
    await updateProductStripeData(result);
    
  } catch (error) {
    console.error(`Failed to sync ${product.id}:`, error);
    results.push({ 
      productId: product.id, 
      action: 'skipped', 
      error: error.message 
    });
  }
}

console.log(`Synced ${results.length} products`);
```

### Pre-Sale to Live Transition

Handle product status changes during launch:

```typescript
// Product moves from pre-sale to live availability
const product = await getProduct('founder-edition-black');
product.sell_status = 'available';  // Was 'pre-sale'
product.price_usd = 49900;          // Full price (was deposit)

const result = await syncProductToStripe(product);

if (result.action === 'updated') {
  console.log('Product is now live for purchase');
  // Trigger inventory management, notifications, etc.
}
```

### Development Workflow

Set up reliable testing patterns:

```typescript
// Test setup
beforeEach(() => {
  resetStripeClient(); // Fresh client for each test
});

// Mock Stripe for unit tests
jest.mock('stripe', () => ({
  products: {
    create: jest.fn(),
    update: jest.fn(),
    search: jest.fn()
  },
  prices: {
    create: jest.fn()
  }
}));
```

## Architecture Context

### Trust Hub Federation

This service operates within Imajin's decentralized commerce vision:

- **Today**: Centralized sync to Stripe from imajin.ca
- **Phase 5+**: Each hub manages its own Stripe account
- **Future**: Federated commerce with cross-hub transactions

The sync service is hub-agnostic—it syncs whatever products exist in the local database, regardless of which trust hub is running it.

### E-commerce Integration

Works alongside other platform services:

- **Product Management**: Syncs products marked as `dev_status = 5` (ready to sell)
- **Checkout Service**: Uses Stripe price IDs created by this service
- **Inventory Management**: Updates reflect in Stripe product metadata
- **Order Processing**: Relies on consistent Stripe product data

### Performance Considerations

- **Rate Limiting**: Stripe allows 100 requests/second—suitable for typical product catalogs
- **Caching**: Internal client caching reduces connection overhead
- **Batch Operations**: Process multiple products sequentially to avoid overwhelming the API
- **Idempotency**: Safe to retry operations without creating duplicates

## Error Recovery

### Common Failure Scenarios

1. **Network timeouts**: Retry with exponential backoff
2. **Invalid product data**: Fix validation errors and re-sync
3. **Stripe account issues**: Check API key permissions and account status
4. **Rate limiting**: Implement queue-based processing for large catalogs

### Monitoring Recommendations

Track sync operations for operational insight:

```typescript
const syncMetrics = {
  created: 0,
  updated: 0, 
  archived: 0,
  skipped: 0,
  errors: 0
};

// Process results and update metrics
results.forEach(result => {
  if (result.error) {
    syncMetrics.errors++;
  } else {
    syncMetrics[result.action]++;
  }
});

console.log('Sync summary:', syncMetrics);
```

This service forms the foundation of Imajin's payment infrastructure—keeping local product authority while enabling seamless Stripe integration for makers and customers worldwide.