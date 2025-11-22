# API Client Module

The `utils/api-client` module provides type-safe HTTP utilities for communicating with Imajin's internal APIs. Built on fetch with Zod validation, it ensures runtime type safety and consistent error handling across the platform.

## Purpose

Internal API calls need three guarantees: type safety, validation, and consistent error handling. This module wraps the native fetch API with Zod schema validation, transforming raw HTTP responses into typed data or structured errors.

Use this for all internal API communication—products, cart operations, checkout flows, and future user management. It handles the boilerplate so your components focus on business logic.

## Functions Reference

### buildApiUrl

**Constructs full API URLs from endpoint paths**

Normalizes API endpoint construction by prepending the base URL and handling path joining. Ensures consistent URL formatting across the application.

**Parameters:**
- `endpoint` (string) - API endpoint path (e.g., "/products", "checkout/session")

**Returns:**
string - Complete API URL ready for fetch requests

**Example:**
```typescript
import { buildApiUrl } from '@/lib/utils/api-client'

const url = buildApiUrl('/products')
// Returns: "https://imajin.ca/api/products" (production)
// Returns: "http://localhost:3000/api/products" (development)

const checkoutUrl = buildApiUrl('checkout/session')
// Handles path normalization automatically
```

**Implementation Notes:**
Uses `process.env.NODE_ENV` and `window.location.origin` to determine the base URL. Automatically handles trailing slashes and path joining edge cases.

---

### fetchApi

**Core HTTP client with automatic validation and error handling**

The foundation function that all other API methods build on. Handles the fetch-validate-parse cycle with structured error handling. Transforms raw HTTP responses into typed data or throws `ApiClientError` instances.

**Parameters:**
- `endpoint` (string) - API endpoint path
- `schema` (ZodType<T>) - Zod schema for response validation
- `options` (RequestInit, optional) - Standard fetch options (headers, method, body, etc.)

**Returns:**
Promise<T> - Validated, typed response data

**Example:**
```typescript
import { fetchApi } from '@/lib/utils/api-client'
import { z } from 'zod'

const ProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number(),
})

try {
  const product = await fetchApi(
    '/api/products/123',
    ProductSchema,
    {
      headers: { 'Authorization': 'Bearer token' },
      cache: 'no-store'
    }
  )
  // product is fully typed as { id: string, name: string, price: number }
} catch (error) {
  if (error instanceof ApiClientError) {
    console.error(`API Error ${error.statusCode}: ${error.message}`)
    // Access structured error details
    console.error('Error code:', error.errorCode)
    console.error('Details:', error.details)
  }
}
```

**Error Handling:**
- **Network failures** - Throws `ApiClientError` with status 0
- **HTTP errors (4xx/5xx)** - Parses error response and throws `ApiClientError` with actual status
- **Validation failures** - Throws `ApiClientError` with status 422 and Zod error details
- **Non-JSON responses** - Throws `ApiClientError` with parse error details

**Implementation Notes:**
Always expects JSON responses. Sets `Content-Type: application/json` by default. Preserves all standard fetch options while adding validation layer.

---

### apiGet

**Type-safe GET requests with automatic validation**

Convenience wrapper around `fetchApi` specifically for GET requests. Removes method and body options to prevent misuse while preserving all other fetch capabilities.

**Parameters:**
- `endpoint` (string) - API endpoint path  
- `schema` (ZodType<T>) - Zod schema for response validation
- `options` (Omit<RequestInit, 'method' | 'body'>, optional) - Fetch options excluding method/body

**Returns:**
Promise<T> - Validated, typed response data

**Example:**
```typescript
import { apiGet } from '@/lib/utils/api-client'
import { ProductsResponseSchema } from '@/lib/schemas/api'

// Fetch all products with caching
const products = await apiGet(
  '/api/products',
  ProductsResponseSchema,
  { 
    cache: 'force-cache',
    next: { revalidate: 3600 } // ISR: 1 hour
  }
)

// products.data is fully typed based on ProductsResponseSchema
console.log(`Found ${products.data.length} products`)
```

**Error Handling:**
Inherits all error handling from `fetchApi`. Most common errors are 404 (endpoint not found) and validation failures if the API response doesn't match the schema.

---

### apiPost

**Type-safe POST requests with automatic JSON encoding**

Convenience wrapper for POST requests with automatic JSON body serialization. Handles the common pattern of sending structured data to APIs.

**Parameters:**
- `endpoint` (string) - API endpoint path
- `schema` (ZodType<T>) - Zod schema for response validation  
- `body` (unknown, optional) - Request payload (automatically JSON-serialized)
- `options` (Omit<RequestInit, 'method' | 'body'>, optional) - Fetch options excluding method/body

**Returns:**
Promise<T> - Validated, typed response data

**Example:**
```typescript
import { apiPost } from '@/lib/utils/api-client'
import { CheckoutSessionSchema } from '@/lib/schemas/stripe'

// Create Stripe checkout session
const session = await apiPost(
  '/api/checkout/create-session',
  CheckoutSessionSchema,
  {
    cartItems: [
      { productId: 'material-8x8-v', variantId: 'black', quantity: 2 }
    ],
    metadata: { source: 'product-page' }
  }
)

// Redirect to Stripe checkout
window.location.href = session.url
```

**Error Handling:**
Common errors include 400 (validation errors), 409 (inventory conflicts), and 422 (schema validation failures). The structured error format includes field-level validation details for form handling.

**Implementation Notes:**
Automatically stringifies the body parameter and sets `Content-Type: application/json`. Pass `undefined` or omit the body parameter for POST requests without payloads.

---

## ApiClientError Class

**Structured error class for API communication failures**

Extends the native Error class with additional context for API-specific error handling. Provides structured access to HTTP status codes, application error codes, and detailed error information.

**Properties:**
- `statusCode` (number) - HTTP status code (404, 500, etc.)
- `errorCode` (string, optional) - Application-specific error code (INSUFFICIENT_INVENTORY, VALIDATION_FAILED)
- `details` (unknown, optional) - Additional error context (validation errors, debug info)

**Example:**
```typescript
import { ApiClientError, apiGet } from '@/lib/utils/api-client'

try {
  const product = await apiGet('/api/products/invalid', ProductSchema)
} catch (error) {
  if (error instanceof ApiClientError) {
    // Handle different error types
    switch (error.statusCode) {
      case 404:
        showNotification('Product not found', 'error')
        break
      case 422:
        console.error('Validation errors:', error.details)
        break  
      case 500:
        showNotification('Server error, please try again', 'error')
        break
    }
    
    // Log structured error for debugging
    console.error({
      message: error.message,
      statusCode: error.statusCode,
      errorCode: error.errorCode,
      details: error.details
    })
  }
}
```

## Common Patterns

### Product Catalog Fetching

```typescript
import { apiGet } from '@/lib/utils/api-client'
import { ProductsResponseSchema } from '@/lib/schemas/api'

// Server-side: ISR with hourly revalidation
export async function getProducts() {
  return apiGet('/api/products', ProductsResponseSchema, {
    next: { revalidate: 3600 }
  })
}

// Client-side: Fresh data for interactive features
export async function refreshProducts() {
  return apiGet('/api/products', ProductsResponseSchema, {
    cache: 'no-store'
  })
}
```

### Cart Operations

```typescript
import { apiPost } from '@/lib/utils/api-client'
import { CartResponseSchema } from '@/lib/schemas/cart'

export async function addToCart(productId: string, variantId: string, quantity: number) {
  try {
    return await apiPost('/api/cart/add', CartResponseSchema, {
      productId,
      variantId, 
      quantity
    })
  } catch (error) {
    if (error instanceof ApiClientError && error.errorCode === 'INSUFFICIENT_INVENTORY') {
      throw new Error(`Only ${error.details.available} units available`)
    }
    throw error
  }
}
```

### Error Boundary Integration

```typescript
import { ApiClientError } from '@/lib/utils/api-client'

export function handleApiError(error: unknown) {
  if (error instanceof ApiClientError) {
    // User-friendly error messages
    const userMessage = {
      400: 'Invalid request. Please check your input.',
      401: 'Please sign in to continue.',
      403: 'You don\'t have permission for this action.',
      404: 'The requested resource was not found.',
      409: 'This action conflicts with current state.',
      422: 'Please correct the highlighted fields.',
      500: 'Server error. Our team has been notified.'
    }[error.statusCode] || 'Something went wrong. Please try again.'
    
    return { userMessage, shouldRetry: error.statusCode >= 500 }
  }
  
  // Network/unknown errors
  return { 
    userMessage: 'Network error. Please check your connection.',
    shouldRetry: true 
  }
}
```

## Best Practices

**Schema Definition:** Define response schemas in `lib/schemas/` and import them. This centralizes type definitions and enables schema reuse across components.

**Error Handling:** Always catch `ApiClientError` instances. Use the `statusCode` for user-facing messages and `errorCode` for application logic decisions.

**Caching Strategy:** Use Next.js caching options appropriately:
- `{ next: { revalidate: 3600 } }` for product catalogs (ISR)
- `{ cache: 'no-store' }` for user-specific data (cart, orders)
- `{ cache: 'force-cache' }` for static content (policies, about pages)

**Request Deduplication:** Next.js automatically deduplicates identical requests within the same render cycle. Leverage this by calling the same API function from multiple components.

## Related Modules

- **`lib/schemas/`** - Zod schemas for API response validation
- **`app/api/`** - Server-side API routes that this client communicates with
- **`lib/stripe/`** - Stripe-specific API integrations
- **`components/ui/error-boundary`** - Error handling components that work with ApiClientError

This module forms the foundation of all client-server communication in the Imajin platform. As we add user authentication (Phase 4.4) and federated commerce (Phase 5+), new API endpoints will use these same patterns for consistency and type safety.