# utils/logger

**Structured logging utility for consistent, JSON-formatted application logs.**

## Overview

The logger module provides a unified logging interface across the Imajin platform. Instead of scattered `console.log` statements, it outputs structured JSON logs with timestamps, levels, and metadata—essential for debugging production issues and monitoring application health.

### Purpose

Every application needs logging, but most logging is inconsistent and hard to parse. This utility enforces structure: every log entry includes a timestamp, level, message, and optional metadata. The JSON format makes logs machine-readable for monitoring tools and log aggregators.

### When to Use

- **API routes** - Request/response logging with timing and metadata
- **Database operations** - Transaction success/failure with context
- **External service calls** - Stripe webhooks, Cloudinary uploads, email sends
- **Sync operations** - Data imports, inventory updates, batch processing
- **Error tracking** - Structured error context instead of bare exceptions

## API Reference

### LogLevel

```typescript
type LogLevel = 'debug' | 'info' | 'warn' | 'error'
```

Defines the severity hierarchy. Debug logs only appear in development; production logs start at info level.

### LogMeta

```typescript
type LogMeta = Record<string, unknown>
```

Arbitrary metadata object for additional context. Common fields: `userId`, `operation`, `duration`, `itemCount`.

### LogEntry

```typescript
interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  meta?: LogMeta
  error?: {
    message: string
    stack?: string
    name: string
  }
}
```

The structured log format. Every entry includes these fields, serialized as JSON for consistent parsing.

## Logger Class

### debug(message, meta?)

**Debug-level logging for development traces**

Use for detailed execution flow that clutters production logs. Automatically filtered out in production environments.

**Parameters:**
- `message` (string) - Human-readable description
- `meta` (LogMeta, optional) - Additional context data

**Example:**
```typescript
logger.debug('Cart validation started', { 
  sessionId: 'cs_123',
  itemCount: 3 
})
```

### info(message, meta?)

**Info-level logging for normal operations**

The workhorse method for tracking application flow. Use for successful operations, milestones, and status updates.

**Parameters:**
- `message` (string) - Clear, actionable description
- `meta` (LogMeta, optional) - Context for debugging

**Example:**
```typescript
logger.info('Order created successfully', {
  orderId: 'ord_456',
  total: 29900,
  variantsSold: ['BLACK', 'WHITE']
})
```

### warn(message, meta?)

**Warning-level logging for recoverable issues**

Use for situations that aren't errors but need attention: deprecated API usage, fallback behaviors, or unusual conditions.

**Parameters:**
- `message` (string) - What happened and why it matters
- `meta` (LogMeta, optional) - Context for investigation

**Example:**
```typescript
logger.warn('Stripe webhook retried', {
  webhookId: 'whsec_789',
  attempt: 3,
  lastError: 'Connection timeout'
})
```

### error(message, error?, meta?)

**Error-level logging for failures requiring attention**

Log actual failures: API errors, database constraints, external service timeouts. Always investigate error-level logs.

**Parameters:**
- `message` (string) - What operation failed
- `error` (Error, optional) - Exception object with stack trace
- `meta` (LogMeta, optional) - Operation context

**Example:**
```typescript
try {
  await stripe.createPaymentIntent(params)
} catch (error) {
  logger.error('Payment intent creation failed', error, {
    customerId: 'cus_123',
    amount: 29900,
    currency: 'cad'
  })
  throw error
}
```

**Error Handling:**
The error object is automatically serialized with `message`, `stack`, and `name` fields. Stack traces help pinpoint the failure location.

### syncStart(operation, meta?)

**Log synchronization operation start**

Specialized method for data sync operations like Stripe product imports, inventory updates, or batch processing jobs.

**Parameters:**
- `operation` (string) - Sync operation identifier
- `meta` (LogMeta, optional) - Initial state context

**Example:**
```typescript
logger.syncStart('stripe_products', {
  expectedCount: 15,
  lastSync: '2024-01-15T10:30:00Z'
})
```

### syncComplete(operation, meta?)

**Log synchronization operation completion**

Records successful sync completion with timing and result metrics. Pair with `syncStart` for operation duration tracking.

**Parameters:**
- `operation` (string) - Same identifier from `syncStart`
- `meta` (LogMeta, optional) - Results and metrics

**Example:**
```typescript
logger.syncComplete('stripe_products', {
  processed: 15,
  created: 2,
  updated: 13,
  duration: '1.2s'
})
```

### syncError(operation, error, meta?)

**Log synchronization operation failure**

Records sync failures with error context. Critical for monitoring automated processes that might fail silently.

**Parameters:**
- `operation` (string) - Failed operation identifier
- `error` (Error) - Exception that caused the failure
- `meta` (LogMeta, optional) - State when failure occurred

**Example:**
```typescript
logger.syncError('stripe_products', error, {
  processed: 8,
  remaining: 7,
  lastSuccessful: 'prod_abc123'
})
```

### apiRequest(method, path, meta?)

**Log incoming API requests**

Standardized request logging for all API endpoints. Captures method, path, and request context for debugging and monitoring.

**Parameters:**
- `method` (string) - HTTP method (GET, POST, etc.)
- `path` (string) - Request path without query parameters
- `meta` (LogMeta, optional) - Request context (user ID, session, etc.)

**Example:**
```typescript
logger.apiRequest('POST', '/api/orders', {
  sessionId: 'cs_123',
  userAgent: 'Mozilla/5.0...',
  ip: '192.168.1.1'
})
```

### apiResponse(method, path, status, meta?)

**Log API response completion**

Records response status and timing. Pair with `apiRequest` for complete request lifecycle tracking.

**Parameters:**
- `method` (string) - HTTP method from request
- `path` (string) - Request path from request
- `status` (number) - HTTP status code
- `meta` (LogMeta, optional) - Response metrics and context

**Example:**
```typescript
logger.apiResponse('POST', '/api/orders', 201, {
  orderId: 'ord_456',
  duration: '245ms',
  responseSize: 1024
})
```

## Usage Patterns

### API Route Logging

```typescript
export async function POST(request: Request) {
  const startTime = Date.now()
  
  logger.apiRequest('POST', '/api/checkout', {
    contentType: request.headers.get('content-type')
  })
  
  try {
    const result = await processCheckout(request)
    
    logger.apiResponse('POST', '/api/checkout', 201, {
      orderId: result.orderId,
      duration: `${Date.now() - startTime}ms`
    })
    
    return NextResponse.json(result)
  } catch (error) {
    logger.error('Checkout processing failed', error, {
      duration: `${Date.now() - startTime}ms`
    })
    
    logger.apiResponse('POST', '/api/checkout', 500, {
      error: error.message,
      duration: `${Date.now() - startTime}ms`
    })
    
    throw error
  }
}
```

### Sync Operation Tracking

```typescript
export async function syncStripeProducts() {
  logger.syncStart('stripe_products')
  
  try {
    const products = await stripe.products.list({ limit: 100 })
    let processed = 0
    
    for (const product of products.data) {
      await upsertProduct(product)
      processed++
      
      if (processed % 10 === 0) {
        logger.info('Sync progress', {
          operation: 'stripe_products',
          processed,
          remaining: products.data.length - processed
        })
      }
    }
    
    logger.syncComplete('stripe_products', {
      processed,
      duration: '2.1s'
    })
    
  } catch (error) {
    logger.syncError('stripe_products', error, {
      processed: processed || 0
    })
    throw error
  }
}
```

### Database Transaction Logging

```typescript
export async function createOrder(sessionId: string, items: CartItem[]) {
  logger.info('Creating order', { sessionId, itemCount: items.length })
  
  return await db.transaction(async (tx) => {
    try {
      const order = await tx.insert(orders).values({
        sessionId,
        status: 'pending'
      }).returning()
      
      logger.debug('Order record created', { 
        orderId: order.id,
        status: order.status 
      })
      
      for (const item of items) {
        await tx.insert(orderItems).values({
          orderId: order.id,
          variantId: item.variantId,
          quantity: item.quantity
        })
      }
      
      logger.info('Order completed', {
        orderId: order.id,
        itemCount: items.length,
        total: items.reduce((sum, item) => sum + item.price, 0)
      })
      
      return order
      
    } catch (error) {
      logger.error('Order creation failed', error, {
        sessionId,
        itemCount: items.length
      })
      throw error
    }
  })
}
```

## Implementation Notes

### Environment-Based Filtering

Debug logs automatically filter out in production (`NODE_ENV=production`). This keeps production logs focused on actionable information while preserving detailed traces in development.

### JSON Serialization

All log entries serialize as single-line JSON for easy parsing by log aggregation tools. Timestamps use ISO 8601 format for consistent timezone handling.

### Error Object Handling

JavaScript Error objects don't serialize well to JSON. The logger extracts `message`, `stack`, and `name` properties into a plain object for consistent error logging.

### Singleton Pattern

The module exports a single logger instance to ensure consistent configuration across the application. No need to instantiate multiple loggers or pass logger instances between modules.

## Related Modules

- **Database utilities** - Transaction logging and query debugging
- **API routes** - Request/response lifecycle tracking
- **Sync operations** - External service integration monitoring
- **Error boundaries** - Structured error context for debugging