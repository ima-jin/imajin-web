# Logging Patterns

Structured logging guide for the Imajin Web Platform.

## Overview

We use a structured JSON logger (`lib/utils/logger.ts`) instead of `console.log/error` for:
- Consistent log formatting across the application
- Machine-readable logs (JSON) for parsing/filtering
- Metadata support for context-rich debugging
- Environment-aware logging (debug logs only in development)
- Error serialization with stack traces

## Quick Start

```typescript
import { logger } from '@/lib/utils/logger';

// Basic logging
logger.info('User logged in', { userId: '123', method: 'oauth' });
logger.error('Payment failed', error, { orderId: 'abc-123' });

// Sync operations
logger.syncStart('product_sync', { totalProducts: 10 });
logger.syncComplete('product_sync', { synced: 10, failed: 0 });
logger.syncError('stripe_sync', error, { productId: 'prod-123' });

// API operations
logger.apiRequest('POST', '/api/orders', { userId: '123' });
logger.apiResponse('POST', '/api/orders', 201, { orderId: 'abc-123' });
```

## Log Levels

### `debug(message, meta?)`

**When to use:**
- Development-only diagnostics
- Verbose debugging information
- Variable inspection during development
- Function entry/exit tracing

**Behavior:**
- Only outputs in `NODE_ENV=development`
- Suppressed in production
- Use liberally during development, remove before commit if no longer needed

**Examples:**

```typescript
// Variable inspection
logger.debug('Processing cart items', {
  itemCount: cartItems.length,
  items: cartItems
});

// Function flow
logger.debug('Entering checkout validation', { sessionId });
logger.debug('Validation complete', { isValid: true, sessionId });

// Data transformation
logger.debug('Mapping DB product to app format', {
  productId: dbProduct.id,
  hasVariants: dbProduct.hasVariants
});
```

### `info(message, meta?)`

**When to use:**
- Normal application flow
- Successful operations
- State changes
- Business events
- Audit trail events

**Examples:**

```typescript
// Successful operations
logger.info('Order created successfully', {
  orderId: order.id,
  customerId: customer.id,
  total: order.total
});

// State changes
logger.info('Product inventory updated', {
  productId: 'prod-123',
  oldQuantity: 100,
  newQuantity: 95,
  change: -5
});

// Business events
logger.info('Founder Edition variant sold out', {
  variantId: 'variant-black',
  productId: 'founder-edition',
  totalSold: 500
});

// Audit trail
logger.info('Admin updated product pricing', {
  productId: 'prod-123',
  oldPrice: 9999,
  newPrice: 10999,
  adminUserId: 'admin-456'
});
```

### `warn(message, meta?)`

**When to use:**
- Recoverable errors
- Deprecated feature usage
- Configuration issues (non-critical)
- Rate limiting
- Validation warnings
- Potential problems that don't stop execution

**Examples:**

```typescript
// Recoverable errors
logger.warn('Cloudinary upload failed, using fallback', {
  productId: 'prod-123',
  localPath: '/media/product.jpg',
  error: 'timeout'
});

// Deprecated features
logger.warn('Using deprecated API endpoint', {
  endpoint: '/api/v1/products',
  deprecatedSince: '2025-01-01',
  replacement: '/api/v2/products'
});

// Configuration issues
logger.warn('Missing optional environment variable', {
  variable: 'CLOUDINARY_FOLDER',
  using: 'default',
  impact: 'Using root folder for uploads'
});

// Rate limiting
logger.warn('Stripe API rate limit approaching', {
  currentRate: 85,
  limit: 100,
  timeWindow: '1m'
});

// Validation warnings
logger.warn('Product price outside expected range', {
  productId: 'prod-123',
  price: 999999,
  expectedMin: 100,
  expectedMax: 100000
});
```

### `error(message, error?, meta?)`

**When to use:**
- Unhandled exceptions
- Failed operations
- Data integrity issues
- External service failures
- Critical validation failures
- Anything that prevents normal operation

**Signature:**
```typescript
error(message: string, error?: Error, meta?: LogMeta): void
```

**Examples:**

```typescript
// Unhandled exceptions
try {
  await createOrder(orderData);
} catch (error) {
  logger.error('Failed to create order', error as Error, {
    customerId: orderData.customerId,
    itemCount: orderData.items.length
  });
  throw error; // Re-throw after logging
}

// External service failures
logger.error('Stripe API call failed', error as Error, {
  operation: 'createCheckoutSession',
  productIds: ['prod-123', 'prod-456'],
  attempt: 3,
  maxRetries: 3
});

// Data integrity issues
logger.error('Product variant missing required data', undefined, {
  variantId: 'variant-123',
  productId: 'prod-456',
  missingFields: ['stripeProductId', 'maxQuantity']
});

// Critical validation
logger.error('Database constraint violation', error as Error, {
  table: 'orders',
  constraint: 'orders_payment_intent_unique',
  paymentIntentId: 'pi_123'
});
```

## Specialized Helpers

### Sync Operations

Use these for any synchronization operations (Stripe, Cloudinary, database sync):

```typescript
// Starting sync
logger.syncStart('cloudinary_upload', {
  productId: 'prod-123',
  fileCount: 5
});

// Successful completion
logger.syncComplete('cloudinary_upload', {
  productId: 'prod-123',
  uploaded: 5,
  skipped: 0,
  duration: '2.3s'
});

// Sync failure
logger.syncError('stripe_product_sync', error, {
  productId: 'prod-123',
  operation: 'update',
  stripeProductId: 'prod_stripe_123'
});
```

**Why use these?**
- Consistent sync logging across all operations
- Automatic `syncPhase` metadata (start/complete/error)
- Easy to filter sync operations in logs
- Operation name standardization

### API Operations

Use these in API route handlers:

```typescript
export async function POST(request: NextRequest) {
  logger.apiRequest('POST', '/api/orders', {
    userId: session?.userId
  });

  try {
    const order = await createOrder(data);
    logger.apiResponse('POST', '/api/orders', 201, {
      orderId: order.id
    });
    return successResponse(order, HTTP_STATUS.CREATED);
  } catch (error) {
    logger.error('Order creation failed', error as Error, {
      customerId: data.customerId
    });
    logger.apiResponse('POST', '/api/orders', 500);
    return errorResponse(ERROR_CODES.INTERNAL_ERROR, 'Failed to create order');
  }
}
```

**Why use these?**
- Automatic HTTP method/path tracking
- Status code logging
- Easy to trace request/response pairs
- Standardized API logging format

## Metadata Best Practices

### Always Include Context

```typescript
// ❌ BAD - No context
logger.error('Failed to update', error);

// ✅ GOOD - Rich context
logger.error('Failed to update product inventory', error as Error, {
  productId: 'prod-123',
  variantId: 'variant-black',
  attemptedChange: -5,
  currentQuantity: 10
});
```

### Use Consistent Keys

```typescript
// Standard metadata keys
{
  productId: string,      // Always use productId (not product_id or id)
  variantId: string,      // Always use variantId
  userId: string,         // Always use userId
  orderId: string,        // Always use orderId
  sessionId: string,      // Always use sessionId
  customerId: string,     // Always use customerId
  operation: string,      // Sync/API operation name
  duration: string,       // Time duration (with unit: '2.3s', '150ms')
  count: number,          // Generic count
  total: number,          // Total amount
}
```

### Avoid Sensitive Data

```typescript
// ❌ BAD - Logging sensitive data
logger.info('Payment processed', {
  cardNumber: '4242424242424242',
  cvv: '123',
  customerEmail: 'user@example.com'
});

// ✅ GOOD - Log identifiers only
logger.info('Payment processed', {
  paymentIntentId: 'pi_123',
  customerId: 'cus_456',
  last4: '4242'  // Only last 4 digits if needed
});
```

### Keep Metadata Flat

```typescript
// ❌ BAD - Nested metadata (hard to search)
logger.info('Order created', {
  order: {
    id: 'order-123',
    items: [{ id: 'item-1' }]
  }
});

// ✅ GOOD - Flat metadata (easy to search)
logger.info('Order created', {
  orderId: 'order-123',
  itemCount: 1,
  firstItemId: 'item-1'
});
```

## Common Patterns

### Error Handling

```typescript
async function syncProduct(productId: string) {
  try {
    logger.syncStart('product_sync', { productId });

    const product = await getProduct(productId);
    const stripeProduct = await createStripeProduct(product);

    logger.syncComplete('product_sync', {
      productId,
      stripeProductId: stripeProduct.id
    });

    return stripeProduct;
  } catch (error) {
    logger.syncError('product_sync', error as Error, { productId });
    throw error;
  }
}
```

### Transaction Operations

```typescript
async function createOrderWithItems(orderData: OrderData) {
  const tx = await db.transaction();

  try {
    logger.info('Starting order transaction', {
      customerId: orderData.customerId,
      itemCount: orderData.items.length
    });

    const order = await tx.insert(orders).values(orderData);
    logger.debug('Order record created', { orderId: order.id });

    const items = await tx.insert(orderItems).values(orderData.items);
    logger.debug('Order items created', { count: items.length });

    await tx.commit();
    logger.info('Order transaction committed', {
      orderId: order.id,
      itemCount: items.length
    });

    return order;
  } catch (error) {
    await tx.rollback();
    logger.error('Order transaction failed, rolled back', error as Error, {
      customerId: orderData.customerId,
      itemCount: orderData.items.length
    });
    throw error;
  }
}
```

### Batch Operations

```typescript
async function syncAllProducts(products: Product[]) {
  logger.syncStart('batch_product_sync', {
    totalProducts: products.length
  });

  let synced = 0;
  let failed = 0;

  for (const product of products) {
    try {
      await syncProduct(product.id);
      synced++;
      logger.debug('Product synced', {
        productId: product.id,
        progress: `${synced}/${products.length}`
      });
    } catch (error) {
      failed++;
      logger.error('Product sync failed', error as Error, {
        productId: product.id
      });
      // Continue with other products
    }
  }

  if (failed > 0) {
    logger.syncError('batch_product_sync',
      new Error(`${failed} products failed to sync`), {
      totalProducts: products.length,
      synced,
      failed
    });
  } else {
    logger.syncComplete('batch_product_sync', {
      totalProducts: products.length,
      synced,
      failed
    });
  }
}
```

### Webhook Handlers

```typescript
export async function POST(request: NextRequest) {
  logger.apiRequest('POST', '/api/webhooks/stripe');

  try {
    const body = await request.text();
    const signature = headers().get('stripe-signature');

    if (!signature) {
      logger.warn('Webhook missing signature', {
        source: 'stripe'
      });
      logger.apiResponse('POST', '/api/webhooks/stripe', 400);
      return errorResponse(ERROR_CODES.BAD_REQUEST, 'Missing signature');
    }

    const event = verifyWebhookSignature(body, signature);
    logger.info('Webhook verified', {
      eventType: event.type,
      eventId: event.id
    });

    // Handle event...

    logger.apiResponse('POST', '/api/webhooks/stripe', 200);
    return successResponse({ received: true });
  } catch (error) {
    logger.error('Webhook processing failed', error as Error);
    logger.apiResponse('POST', '/api/webhooks/stripe', 500);
    return errorResponse(ERROR_CODES.INTERNAL_ERROR, 'Webhook failed');
  }
}
```

## Log Output Format

All logs are output as JSON with this structure:

```typescript
interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: string;  // ISO 8601 format
  meta?: {            // Optional metadata object
    [key: string]: unknown;
  };
  error?: {           // Optional error details
    message: string;
    stack?: string;
    name: string;
  };
}
```

### Example Output

```json
{
  "level": "info",
  "message": "Order created successfully",
  "timestamp": "2025-10-28T14:32:15.123Z",
  "meta": {
    "orderId": "order-abc-123",
    "customerId": "cus-456",
    "total": 10999,
    "itemCount": 3
  }
}
```

```json
{
  "level": "error",
  "message": "Failed to sync product to Stripe",
  "timestamp": "2025-10-28T14:32:16.456Z",
  "meta": {
    "productId": "prod-123",
    "operation": "update",
    "syncPhase": "error"
  },
  "error": {
    "message": "Rate limit exceeded",
    "name": "StripeRateLimitError",
    "stack": "Error: Rate limit exceeded\n    at StripeClient.request..."
  }
}
```

## Migration Guide

### Replacing console.log/error

```typescript
// ❌ BEFORE
console.log('Syncing products...');
console.log(`Total products: ${products.length}`);

// ✅ AFTER
logger.syncStart('product_sync', { totalProducts: products.length });

// ❌ BEFORE
console.error('Failed to create order:', error);
console.error('Order data:', orderData);

// ✅ AFTER
logger.error('Failed to create order', error as Error, {
  customerId: orderData.customerId,
  itemCount: orderData.items.length
});

// ❌ BEFORE
console.log('✅ Sync complete!');
console.log(`Synced: ${synced}, Failed: ${failed}`);

// ✅ AFTER
logger.syncComplete('product_sync', { synced, failed });
```

### Already Migrated Files

These files have been updated to use structured logging:

1. **scripts/sync-products.ts** - Product sync script
2. **lib/mappers/product-mapper.ts** - Product data mapper
3. **lib/mappers/variant-mapper.ts** - Variant data mapper
4. **app/api/webhooks/stripe/route.ts** - Stripe webhook handler

Use these as reference examples for consistent logging patterns.

## When NOT to Use Logger

### Test Files

```typescript
// ❌ DON'T use logger in test files
test('should create order', async () => {
  logger.info('Running test...');  // No!
  const order = await createOrder(data);
  expect(order.id).toBeDefined();
});

// ✅ Tests should be silent unless debugging
test('should create order', async () => {
  const order = await createOrder(data);
  expect(order.id).toBeDefined();
});
```

**Why:** Tests should be silent by default. Use test framework output for debugging.

### UI Components

```typescript
// ❌ DON'T use logger in client components
'use client';
export function Button({ onClick }: ButtonProps) {
  const handleClick = () => {
    logger.info('Button clicked');  // No!
    onClick();
  };
  return <button onClick={handleClick}>Click</button>;
}

// ✅ Server-side logging only
export async function serverAction() {
  logger.info('Server action called');
  // ...
}
```

**Why:** Client-side logging exposes internals and bloats bundle size. Use browser DevTools for client debugging.

## Performance Considerations

### JSON Serialization Cost

The logger serializes all logs to JSON. For high-frequency operations:

```typescript
// ❌ BAD - Logging inside tight loop
for (const item of items) {
  logger.debug('Processing item', { item });  // Expensive!
  processItem(item);
}

// ✅ GOOD - Log batch summary
logger.debug('Processing items', { count: items.length });
for (const item of items) {
  processItem(item);
}
logger.debug('Items processed', { count: items.length });
```

### Debug Logs in Production

Debug logs are automatically suppressed in production, so it's safe to leave them:

```typescript
// This ONLY runs in development
logger.debug('Expensive debug info', {
  largeObject: someBigData
});
```

## Summary

**Quick Reference:**
- `debug()` - Development diagnostics (dev only)
- `info()` - Normal operations and events
- `warn()` - Recoverable issues
- `error()` - Failures requiring attention
- `syncStart/Complete/Error()` - Sync operations
- `apiRequest/Response()` - API handlers

**Golden Rules:**
1. Always include context in metadata
2. Never log sensitive data
3. Use consistent metadata keys
4. Keep metadata flat
5. Use specialized helpers for common patterns
6. Replace all console.log/error with logger
7. Don't use logger in tests or client components

**Next Steps:**
- Use logger in all new code
- Migrate remaining console.log/error usage as files are touched
- Filter production logs by level/metadata for debugging
