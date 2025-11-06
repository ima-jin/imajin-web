# Phase 2.3.7-A: API Infrastructure & Error Handling

**Type:** Technical Debt Elimination - Critical Foundation
**Priority:** CRITICAL - Must complete before Phase 2.4 (Checkout)
**Estimated Effort:** 4-6 hours
**Dependencies:** None (can start immediately)
**Blocks:** Phase 2.4 (Checkout)

---

## Context

### The Problem

API routes across the application use inconsistent error handling patterns, making it impossible for clients to reliably parse errors. This will become a major issue in Phase 2.4 (Checkout) which will add 5+ new API routes for payment processing, order creation, and shipping calculations.

**Current Issues:**
1. Mixed use of `NextResponse.json()` vs `Response.json()`
2. Inconsistent error response structures (some include `message`, some don't)
3. Base URL construction duplicated across 3+ files
4. No standardized error object shape
5. Type casting of query parameters without validation
6. Unvalidated JSON responses from API calls

**Examples of Inconsistency:**

```typescript
// app/api/products/route.ts
return NextResponse.json(
  { error: "Database error", message: error.message },
  { status: 500 }
);

// app/api/cart/validate/route.ts
return Response.json(
  { error: 'Cart validation failed' },  // No message field
  { status: 500 }
);
```

### Impact on Phase 2.4

Checkout will require:
- Payment processing API routes (Stripe integration)
- Order creation endpoints
- Shipping calculation API
- Tax calculation API (possibly)
- Inventory reservation endpoints

Without standardized error handling:
- Client can't reliably detect/parse errors
- Inconsistent user experience
- Difficult to debug production issues
- Test assertions become fragile

---

## Objectives

1. **Standardize API Response Format** - Single consistent shape for all API responses
2. **Create API Utilities** - Reusable helpers for success/error responses
3. **Centralize Configuration** - Extract repeated values to constants
4. **Add Input Validation** - Runtime validation for query parameters
5. **Add Response Validation** - Zod validation for API responses
6. **Refactor Existing Routes** - Update all API routes to use new patterns
7. **Update Client Code** - Update fetch calls to use new utilities

---

## Scope

### Files to Create (4 new files)

1. `/lib/config/api.ts` - API configuration constants
2. `/lib/utils/api-response.ts` - Standardized response utilities
3. `/lib/utils/api-client.ts` - Client-side fetch wrapper with validation
4. `/lib/validation/query-params.ts` - Query parameter validation schemas

### Files to Modify (7 existing files)

**API Routes:**
1. `/app/api/products/route.ts` - Standardize error handling
2. `/app/api/products/[id]/route.ts` - Standardize error handling
3. `/app/api/cart/validate/route.ts` - Standardize error handling
4. `/app/api/health/route.ts` - Standardize error handling

**Pages (fetch calls):**
5. `/app/page.tsx` - Use new API client
6. `/app/products/page.tsx` - Use new API client
7. `/app/products/[id]/page.tsx` - Use new API client

### Test Files to Create (4 new test files)

1. `/tests/unit/lib/utils/api-response.test.ts`
2. `/tests/unit/lib/utils/api-client.test.ts`
3. `/tests/unit/lib/validation/query-params.test.ts`
4. `/tests/integration/api/error-handling.test.ts`

---

## Implementation Plan

### Step 1: Create API Configuration Constants

**File:** `/lib/config/api.ts`

```typescript
/**
 * API Configuration
 *
 * Centralizes API-related constants and configuration.
 */

// Base URL for API calls
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ||
  (process.env.NODE_ENV === 'production'
    ? 'https://www.imajin.ca'
    : 'http://localhost:3000');

// API endpoint paths
export const API_ENDPOINTS = {
  PRODUCTS: '/api/products',
  PRODUCT_BY_ID: (id: string) => `/api/products/${id}`,
  CART_VALIDATE: '/api/cart/validate',
  HEALTH: '/api/health',
} as const;

// API fetch configuration
export const API_CONFIG = {
  // Default cache strategy
  defaultCache: 'no-store' as RequestCache,

  // Request timeout (ms)
  timeout: 30000,

  // Retry configuration
  retry: {
    maxAttempts: 3,
    delayMs: 1000,
    backoffMultiplier: 2,
  },
} as const;

// HTTP status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// Error codes (for structured error responses)
export const ERROR_CODES = {
  // Generic errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  BAD_REQUEST: 'BAD_REQUEST',
  VALIDATION_ERROR: 'VALIDATION_ERROR',

  // Database errors
  DATABASE_ERROR: 'DATABASE_ERROR',
  DATABASE_CONNECTION_ERROR: 'DATABASE_CONNECTION_ERROR',

  // Product errors
  PRODUCT_NOT_FOUND: 'PRODUCT_NOT_FOUND',
  PRODUCTS_FETCH_ERROR: 'PRODUCTS_FETCH_ERROR',

  // Cart errors
  CART_VALIDATION_ERROR: 'CART_VALIDATION_ERROR',
  CART_EMPTY: 'CART_EMPTY',

  // Future: Payment errors (for Phase 2.4)
  PAYMENT_ERROR: 'PAYMENT_ERROR',
  STRIPE_ERROR: 'STRIPE_ERROR',

  // Future: Order errors (for Phase 2.4)
  ORDER_CREATION_ERROR: 'ORDER_CREATION_ERROR',
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];
```

**Tests:** `/tests/unit/lib/config/api.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { API_BASE_URL, API_ENDPOINTS, ERROR_CODES, HTTP_STATUS } from '@/lib/config/api';

describe('API Configuration', () => {
  describe('API_BASE_URL', () => {
    it('should have a valid base URL', () => {
      expect(API_BASE_URL).toBeTruthy();
      expect(typeof API_BASE_URL).toBe('string');
    });
  });

  describe('API_ENDPOINTS', () => {
    it('should have all required endpoints', () => {
      expect(API_ENDPOINTS.PRODUCTS).toBe('/api/products');
      expect(API_ENDPOINTS.CART_VALIDATE).toBe('/api/cart/validate');
      expect(API_ENDPOINTS.HEALTH).toBe('/api/health');
    });

    it('should generate product detail endpoint', () => {
      expect(API_ENDPOINTS.PRODUCT_BY_ID('test-id')).toBe('/api/products/test-id');
    });
  });

  describe('ERROR_CODES', () => {
    it('should have standard error codes', () => {
      expect(ERROR_CODES.INTERNAL_ERROR).toBe('INTERNAL_ERROR');
      expect(ERROR_CODES.NOT_FOUND).toBe('NOT_FOUND');
      expect(ERROR_CODES.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
    });
  });

  describe('HTTP_STATUS', () => {
    it('should have common HTTP status codes', () => {
      expect(HTTP_STATUS.OK).toBe(200);
      expect(HTTP_STATUS.NOT_FOUND).toBe(404);
      expect(HTTP_STATUS.INTERNAL_SERVER_ERROR).toBe(500);
    });
  });
});
```

---

### Step 2: Create Standardized API Response Utilities

**File:** `/lib/utils/api-response.ts`

```typescript
/**
 * API Response Utilities
 *
 * Standardizes API response formats across all route handlers.
 * Ensures consistent error handling and response structure.
 */

import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { ERROR_CODES, HTTP_STATUS, type ErrorCode } from '@/lib/config/api';

/**
 * Standard API success response shape
 */
export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  meta?: {
    timestamp: string;
    requestId?: string;
  };
}

/**
 * Standard API error response shape
 */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    details?: unknown;
    timestamp: string;
  };
}

/**
 * Type guard for error responses
 */
export function isApiError(response: unknown): response is ApiErrorResponse {
  return (
    typeof response === 'object' &&
    response !== null &&
    'success' in response &&
    response.success === false &&
    'error' in response
  );
}

/**
 * Creates a standardized success response
 */
export function successResponse<T>(
  data: T,
  status: number = HTTP_STATUS.OK
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
      },
    },
    { status }
  );
}

/**
 * Creates a standardized error response
 */
export function errorResponse(
  code: ErrorCode,
  message: string,
  status: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
  details?: unknown
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        ...(details && { details }),
        timestamp: new Date().toISOString(),
      },
    },
    { status }
  );
}

/**
 * Handles Zod validation errors
 */
export function validationErrorResponse(
  error: ZodError
): NextResponse<ApiErrorResponse> {
  return errorResponse(
    ERROR_CODES.VALIDATION_ERROR,
    'Validation failed',
    HTTP_STATUS.BAD_REQUEST,
    {
      issues: error.errors.map(err => ({
        path: err.path.join('.'),
        message: err.message,
        code: err.code,
      })),
    }
  );
}

/**
 * Handles unknown errors with safe fallback
 */
export function handleUnknownError(
  error: unknown,
  context: string = 'Unknown error'
): NextResponse<ApiErrorResponse> {
  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return validationErrorResponse(error);
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    return errorResponse(
      ERROR_CODES.INTERNAL_ERROR,
      `${context}: ${error.message}`,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      {
        name: error.name,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      }
    );
  }

  // Handle unknown error types
  return errorResponse(
    ERROR_CODES.INTERNAL_ERROR,
    context,
    HTTP_STATUS.INTERNAL_SERVER_ERROR,
    {
      error: String(error),
    }
  );
}

/**
 * Creates a 404 Not Found response
 */
export function notFoundResponse(
  resource: string
): NextResponse<ApiErrorResponse> {
  return errorResponse(
    ERROR_CODES.NOT_FOUND,
    `${resource} not found`,
    HTTP_STATUS.NOT_FOUND
  );
}

/**
 * Creates a 400 Bad Request response
 */
export function badRequestResponse(
  message: string
): NextResponse<ApiErrorResponse> {
  return errorResponse(
    ERROR_CODES.BAD_REQUEST,
    message,
    HTTP_STATUS.BAD_REQUEST
  );
}
```

**Tests:** `/tests/unit/lib/utils/api-response.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
  handleUnknownError,
  notFoundResponse,
  badRequestResponse,
  isApiError,
} from '@/lib/utils/api-response';
import { ERROR_CODES, HTTP_STATUS } from '@/lib/config/api';

describe('API Response Utilities', () => {
  describe('successResponse', () => {
    it('should create success response with data', async () => {
      const response = successResponse({ id: 1, name: 'Test' });
      const json = await response.json();

      expect(json.success).toBe(true);
      expect(json.data).toEqual({ id: 1, name: 'Test' });
      expect(json.meta.timestamp).toBeTruthy();
      expect(response.status).toBe(HTTP_STATUS.OK);
    });

    it('should allow custom status code', async () => {
      const response = successResponse({ created: true }, HTTP_STATUS.CREATED);
      expect(response.status).toBe(HTTP_STATUS.CREATED);
    });
  });

  describe('errorResponse', () => {
    it('should create error response with code and message', async () => {
      const response = errorResponse(
        ERROR_CODES.NOT_FOUND,
        'Resource not found',
        HTTP_STATUS.NOT_FOUND
      );
      const json = await response.json();

      expect(json.success).toBe(false);
      expect(json.error.code).toBe(ERROR_CODES.NOT_FOUND);
      expect(json.error.message).toBe('Resource not found');
      expect(json.error.timestamp).toBeTruthy();
      expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
    });

    it('should include details when provided', async () => {
      const response = errorResponse(
        ERROR_CODES.VALIDATION_ERROR,
        'Invalid input',
        HTTP_STATUS.BAD_REQUEST,
        { field: 'email', issue: 'invalid format' }
      );
      const json = await response.json();

      expect(json.error.details).toEqual({ field: 'email', issue: 'invalid format' });
    });
  });

  describe('validationErrorResponse', () => {
    it('should handle Zod validation errors', async () => {
      const schema = z.object({ email: z.string().email() });
      const result = schema.safeParse({ email: 'invalid' });

      if (!result.success) {
        const response = validationErrorResponse(result.error);
        const json = await response.json();

        expect(json.success).toBe(false);
        expect(json.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
        expect(json.error.details).toBeDefined();
        expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      }
    });
  });

  describe('handleUnknownError', () => {
    it('should handle Error objects', async () => {
      const error = new Error('Test error');
      const response = handleUnknownError(error, 'Test context');
      const json = await response.json();

      expect(json.success).toBe(false);
      expect(json.error.message).toContain('Test context');
      expect(json.error.message).toContain('Test error');
    });

    it('should handle Zod errors', async () => {
      const schema = z.string();
      const result = schema.safeParse(123);

      if (!result.success) {
        const response = handleUnknownError(result.error);
        const json = await response.json();

        expect(json.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      }
    });

    it('should handle unknown error types', async () => {
      const response = handleUnknownError('string error');
      const json = await response.json();

      expect(json.success).toBe(false);
      expect(json.error.code).toBe(ERROR_CODES.INTERNAL_ERROR);
    });
  });

  describe('notFoundResponse', () => {
    it('should create 404 response', async () => {
      const response = notFoundResponse('Product');
      const json = await response.json();

      expect(json.error.code).toBe(ERROR_CODES.NOT_FOUND);
      expect(json.error.message).toBe('Product not found');
      expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
    });
  });

  describe('badRequestResponse', () => {
    it('should create 400 response', async () => {
      const response = badRequestResponse('Invalid input');
      const json = await response.json();

      expect(json.error.code).toBe(ERROR_CODES.BAD_REQUEST);
      expect(json.error.message).toBe('Invalid input');
      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
    });
  });

  describe('isApiError', () => {
    it('should identify error responses', () => {
      const errorObj = {
        success: false,
        error: {
          code: ERROR_CODES.NOT_FOUND,
          message: 'Not found',
          timestamp: new Date().toISOString(),
        },
      };

      expect(isApiError(errorObj)).toBe(true);
    });

    it('should reject non-error objects', () => {
      expect(isApiError({ success: true, data: {} })).toBe(false);
      expect(isApiError(null)).toBe(false);
      expect(isApiError('error')).toBe(false);
    });
  });
});
```

---

### Step 3: Create Query Parameter Validation

**File:** `/lib/validation/query-params.ts`

```typescript
/**
 * Query Parameter Validation
 *
 * Zod schemas for validating URL query parameters.
 */

import { z } from 'zod';

// Product category validation
export const ProductCategorySchema = z.enum([
  'material',
  'connector',
  'control',
  'diffuser',
  'kit',
  'interface',
]);

export type ProductCategory = z.infer<typeof ProductCategorySchema>;

/**
 * Validates product category query parameter
 */
export function validateProductCategory(
  category: string | null | undefined
): ProductCategory | null {
  if (!category) return null;

  const result = ProductCategorySchema.safeParse(category);
  return result.success ? result.data : null;
}

/**
 * Validates pagination parameters
 */
export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type PaginationParams = z.infer<typeof PaginationSchema>;

/**
 * Validates sort parameters
 */
export const SortSchema = z.object({
  sortBy: z.enum(['name', 'price', 'created_at']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type SortParams = z.infer<typeof SortSchema>;
```

**Tests:** `/tests/unit/lib/validation/query-params.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import {
  ProductCategorySchema,
  validateProductCategory,
  PaginationSchema,
  SortSchema,
} from '@/lib/validation/query-params';

describe('Query Parameter Validation', () => {
  describe('ProductCategorySchema', () => {
    it('should accept valid categories', () => {
      expect(ProductCategorySchema.parse('material')).toBe('material');
      expect(ProductCategorySchema.parse('kit')).toBe('kit');
    });

    it('should reject invalid categories', () => {
      expect(() => ProductCategorySchema.parse('invalid')).toThrow();
    });
  });

  describe('validateProductCategory', () => {
    it('should return valid category', () => {
      expect(validateProductCategory('material')).toBe('material');
    });

    it('should return null for invalid category', () => {
      expect(validateProductCategory('invalid')).toBeNull();
    });

    it('should return null for null/undefined', () => {
      expect(validateProductCategory(null)).toBeNull();
      expect(validateProductCategory(undefined)).toBeNull();
    });
  });

  describe('PaginationSchema', () => {
    it('should apply defaults', () => {
      const result = PaginationSchema.parse({});
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it('should coerce string numbers', () => {
      const result = PaginationSchema.parse({ page: '2', limit: '50' });
      expect(result.page).toBe(2);
      expect(result.limit).toBe(50);
    });

    it('should reject invalid values', () => {
      expect(() => PaginationSchema.parse({ page: 0 })).toThrow();
      expect(() => PaginationSchema.parse({ page: -1 })).toThrow();
      expect(() => PaginationSchema.parse({ limit: 101 })).toThrow();
    });
  });

  describe('SortSchema', () => {
    it('should apply defaults', () => {
      const result = SortSchema.parse({});
      expect(result.sortBy).toBe('created_at');
      expect(result.sortOrder).toBe('desc');
    });

    it('should accept valid sort options', () => {
      const result = SortSchema.parse({ sortBy: 'price', sortOrder: 'asc' });
      expect(result.sortBy).toBe('price');
      expect(result.sortOrder).toBe('asc');
    });

    it('should reject invalid sort values', () => {
      expect(() => SortSchema.parse({ sortBy: 'invalid' })).toThrow();
      expect(() => SortSchema.parse({ sortOrder: 'invalid' })).toThrow();
    });
  });
});
```

---

### Step 4: Create Client-Side API Utility

**File:** `/lib/utils/api-client.ts`

```typescript
/**
 * API Client Utilities
 *
 * Client-side fetch wrapper with validation and error handling.
 */

import { z } from 'zod';
import { API_BASE_URL } from '@/lib/config/api';
import type { ApiSuccessResponse, ApiErrorResponse } from './api-response';

/**
 * API client error class
 */
export class ApiClientError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public errorCode?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

/**
 * Builds full API URL
 */
export function buildApiUrl(endpoint: string): string {
  const base = API_BASE_URL.replace(/\/$/, ''); // Remove trailing slash
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${base}${path}`;
}

/**
 * Fetches and validates API response
 */
export async function fetchApi<T>(
  endpoint: string,
  schema: z.ZodSchema<T>,
  options?: RequestInit
): Promise<T> {
  const url = buildApiUrl(endpoint);

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    const json = await response.json();

    // Handle error responses
    if (!response.ok) {
      const errorResponse = json as ApiErrorResponse;
      throw new ApiClientError(
        errorResponse.error?.message || 'API request failed',
        response.status,
        errorResponse.error?.code,
        errorResponse.error?.details
      );
    }

    // Validate success response structure
    const successResponse = json as ApiSuccessResponse<unknown>;

    if (!successResponse.success || !('data' in successResponse)) {
      throw new ApiClientError(
        'Invalid API response format',
        response.status
      );
    }

    // Validate data against schema
    const validationResult = schema.safeParse(successResponse.data);

    if (!validationResult.success) {
      throw new ApiClientError(
        'API response validation failed',
        response.status,
        'VALIDATION_ERROR',
        validationResult.error.errors
      );
    }

    return validationResult.data;
  } catch (error) {
    // Re-throw ApiClientError
    if (error instanceof ApiClientError) {
      throw error;
    }

    // Wrap other errors
    throw new ApiClientError(
      error instanceof Error ? error.message : 'Unknown error',
      0
    );
  }
}

/**
 * Type-safe GET request
 */
export async function apiGet<T>(
  endpoint: string,
  schema: z.ZodSchema<T>,
  options?: Omit<RequestInit, 'method' | 'body'>
): Promise<T> {
  return fetchApi(endpoint, schema, {
    ...options,
    method: 'GET',
  });
}

/**
 * Type-safe POST request
 */
export async function apiPost<T>(
  endpoint: string,
  schema: z.ZodSchema<T>,
  body?: unknown,
  options?: Omit<RequestInit, 'method' | 'body'>
): Promise<T> {
  return fetchApi(endpoint, schema, {
    ...options,
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  });
}
```

**Tests:** `/tests/unit/lib/utils/api-client.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { z } from 'zod';
import { buildApiUrl, fetchApi, apiGet, apiPost, ApiClientError } from '@/lib/utils/api-client';

// Mock global fetch
global.fetch = vi.fn();

describe('API Client Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('buildApiUrl', () => {
    it('should build correct URL', () => {
      expect(buildApiUrl('/api/products')).toContain('/api/products');
    });

    it('should handle endpoint without leading slash', () => {
      expect(buildApiUrl('api/products')).toContain('/api/products');
    });
  });

  describe('fetchApi', () => {
    const schema = z.object({ id: z.number(), name: z.string() });

    it('should fetch and validate successful response', async () => {
      const mockData = { id: 1, name: 'Test' };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: mockData,
          meta: { timestamp: new Date().toISOString() },
        }),
      });

      const result = await fetchApi('/api/test', schema);
      expect(result).toEqual(mockData);
    });

    it('should throw ApiClientError on error response', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Resource not found',
            timestamp: new Date().toISOString(),
          },
        }),
      });

      await expect(fetchApi('/api/test', schema)).rejects.toThrow(ApiClientError);
    });

    it('should throw on validation failure', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: { id: 'not-a-number', name: 'Test' }, // Invalid data
        }),
      });

      await expect(fetchApi('/api/test', schema)).rejects.toThrow(ApiClientError);
    });

    it('should throw on network error', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      await expect(fetchApi('/api/test', schema)).rejects.toThrow(ApiClientError);
    });
  });

  describe('apiGet', () => {
    it('should make GET request', async () => {
      const schema = z.array(z.string());
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: ['a', 'b'] }),
      });

      await apiGet('/api/test', schema);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: 'GET' })
      );
    });
  });

  describe('apiPost', () => {
    it('should make POST request with body', async () => {
      const schema = z.object({ created: z.boolean() });
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { created: true } }),
      });

      await apiPost('/api/test', schema, { name: 'Test' });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: 'Test' }),
        })
      );
    });
  });
});
```

---

### Step 5: Refactor API Routes

**File:** `/app/api/products/route.ts` (REFACTORED)

```typescript
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { products } from "@/db/schema";
import { eq } from "drizzle-orm";
import { mapDbProductToProduct } from "@/lib/mappers/product-mapper";
import {
  successResponse,
  handleUnknownError,
} from "@/lib/utils/api-response";
import { validateProductCategory } from "@/lib/validation/query-params";
import { ERROR_CODES, HTTP_STATUS } from "@/lib/config/api";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const categoryParam = searchParams.get("category");

    // Validate category parameter
    const category = validateProductCategory(categoryParam);

    // Query database
    const dbProducts = category
      ? await db
          .select()
          .from(products)
          .where(eq(products.category, category))
      : await db.select().from(products);

    // Map to API format
    const mappedProducts = dbProducts.map(mapDbProductToProduct);

    return successResponse(mappedProducts, HTTP_STATUS.OK);
  } catch (error) {
    return handleUnknownError(error, 'Failed to fetch products');
  }
}
```

**File:** `/app/api/products/[id]/route.ts` (REFACTORED)

```typescript
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { products, variants as variantsTable, productSpecs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { mapDbProductToProduct } from "@/lib/mappers/product-mapper";
import { mapDbVariantToVariant } from "@/lib/mappers/variant-mapper";
import {
  successResponse,
  notFoundResponse,
  handleUnknownError,
} from "@/lib/utils/api-response";
import { HTTP_STATUS } from "@/lib/config/api";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch product
    const [dbProduct] = await db
      .select()
      .from(products)
      .where(eq(products.id, id));

    if (!dbProduct) {
      return notFoundResponse("Product");
    }

    // Map product
    const product = mapDbProductToProduct(dbProduct);

    // Fetch variants if product has them
    if (product.hasVariants) {
      const dbVariants = await db
        .select()
        .from(variantsTable)
        .where(eq(variantsTable.productId, id));

      product.variants = dbVariants.map(mapDbVariantToVariant);
    }

    // Fetch specs
    const dbSpecs = await db
      .select()
      .from(productSpecs)
      .where(eq(productSpecs.productId, id));

    product.specs = dbSpecs.map((spec) => ({
      key: spec.specKey,
      value: spec.specValue,
      unit: spec.specUnit || undefined,
      displayOrder: spec.displayOrder,
    }));

    return successResponse(product, HTTP_STATUS.OK);
  } catch (error) {
    return handleUnknownError(error, 'Failed to fetch product');
  }
}
```

**File:** `/app/api/cart/validate/route.ts` (REFACTORED)

```typescript
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { validateCart } from '@/lib/services/cart-validator';
import {
  successResponse,
  handleUnknownError,
  badRequestResponse,
} from '@/lib/utils/api-response';
import { HTTP_STATUS } from '@/lib/config/api';

// Request body schema
const CartValidationRequestSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string(),
      variantId: z.string().optional(),
      quantity: z.number().int().positive(),
      price: z.number(),
    })
  ),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validation = CartValidationRequestSchema.safeParse(body);
    if (!validation.success) {
      return badRequestResponse('Invalid cart data format');
    }

    const { items } = validation.data;

    if (items.length === 0) {
      return badRequestResponse('Cart is empty');
    }

    // Validate cart
    const validationResult = await validateCart(items);

    return successResponse(validationResult, HTTP_STATUS.OK);
  } catch (error) {
    return handleUnknownError(error, 'Cart validation failed');
  }
}
```

**File:** `/app/api/health/route.ts` (REFACTORED)

```typescript
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import {
  successResponse,
  errorResponse,
} from "@/lib/utils/api-response";
import { ERROR_CODES, HTTP_STATUS } from "@/lib/config/api";

export async function GET() {
  try {
    // Test database connection
    await db.execute(sql`SELECT 1`);

    return successResponse(
      {
        status: "healthy",
        timestamp: new Date().toISOString(),
        database: "connected",
      },
      HTTP_STATUS.OK
    );
  } catch (error) {
    return errorResponse(
      ERROR_CODES.DATABASE_CONNECTION_ERROR,
      "Health check failed - database connection error",
      HTTP_STATUS.SERVICE_UNAVAILABLE,
      {
        database: "disconnected",
        error: error instanceof Error ? error.message : String(error),
      }
    );
  }
}
```

---

### Step 6: Update Client-Side Fetch Calls

**File:** `/app/page.tsx` (REFACTORED - relevant section only)

```typescript
import { apiGet } from "@/lib/utils/api-client";
import { API_ENDPOINTS } from "@/lib/config/api";
import { ProductSchema } from "@/types/product";
import { z } from "zod";

export default async function Home() {
  let products: Product[] = [];

  try {
    // Use new API client with validation
    products = await apiGet(
      API_ENDPOINTS.PRODUCTS,
      z.array(ProductSchema),
      { cache: "no-store" }
    );
  } catch (error) {
    console.error("Error fetching products:", error);
    // Could return error UI here instead of empty products
  }

  // ... rest of component
}
```

**File:** `/app/products/page.tsx` (REFACTORED - relevant section only)

```typescript
import { apiGet } from "@/lib/utils/api-client";
import { API_ENDPOINTS } from "@/lib/config/api";
import { ProductSchema } from "@/types/product";
import { z } from "zod";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const category = typeof params.category === "string" ? params.category : undefined;

  let products: Product[] = [];

  try {
    const endpoint = category
      ? `${API_ENDPOINTS.PRODUCTS}?category=${category}`
      : API_ENDPOINTS.PRODUCTS;

    products = await apiGet(
      endpoint,
      z.array(ProductSchema),
      { cache: "no-store" }
    );
  } catch (error) {
    console.error("Error fetching products:", error);
  }

  // ... rest of component
}
```

**File:** `/app/products/[id]/page.tsx` (REFACTORED - relevant section only)

```typescript
import { notFound } from "next/navigation";
import { apiGet, ApiClientError } from "@/lib/utils/api-client";
import { API_ENDPOINTS } from "@/lib/config/api";
import { ProductSchema } from "@/types/product";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  try {
    const product = await apiGet(
      API_ENDPOINTS.PRODUCT_BY_ID(id),
      ProductSchema,
      { cache: "no-store" }
    );

    // ... rest of component
    return <div>{/* Product detail UI */}</div>;
  } catch (error) {
    if (error instanceof ApiClientError && error.statusCode === 404) {
      notFound();
    }

    throw error; // Let error boundary handle it
  }
}
```

---

### Step 7: Integration Testing

**File:** `/tests/integration/api/error-handling.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { testClient } from '@/tests/helpers/test-client';
import { ERROR_CODES, HTTP_STATUS } from '@/lib/config/api';

describe('API Error Handling', () => {
  describe('GET /api/products', () => {
    it('should return standardized success response', async () => {
      const response = await testClient.get('/api/products');
      const json = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(json.success).toBe(true);
      expect(json.data).toBeDefined();
      expect(json.meta).toBeDefined();
      expect(json.meta.timestamp).toBeDefined();
    });

    it('should handle invalid category gracefully', async () => {
      const response = await testClient.get('/api/products?category=invalid');

      // Should return all products (invalid category is ignored)
      expect(response.status).toBe(HTTP_STATUS.OK);
    });
  });

  describe('GET /api/products/:id', () => {
    it('should return standardized 404 for non-existent product', async () => {
      const response = await testClient.get('/api/products/nonexistent');
      const json = await response.json();

      expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe(ERROR_CODES.NOT_FOUND);
      expect(json.error.message).toContain('not found');
      expect(json.error.timestamp).toBeDefined();
    });
  });

  describe('POST /api/cart/validate', () => {
    it('should return validation error for empty cart', async () => {
      const response = await testClient.post('/api/cart/validate', {
        items: [],
      });
      const json = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe(ERROR_CODES.BAD_REQUEST);
    });

    it('should return validation error for invalid format', async () => {
      const response = await testClient.post('/api/cart/validate', {
        items: [{ invalidField: 'test' }],
      });
      const json = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(json.success).toBe(false);
    });
  });

  describe('GET /api/health', () => {
    it('should return standardized health check response', async () => {
      const response = await testClient.get('/api/health');
      const json = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(json.success).toBe(true);
      expect(json.data.status).toBe('healthy');
      expect(json.data.database).toBe('connected');
    });
  });

  describe('Response Format Consistency', () => {
    it('all success responses should have same structure', async () => {
      const endpoints = [
        '/api/products',
        '/api/health',
      ];

      for (const endpoint of endpoints) {
        const response = await testClient.get(endpoint);
        const json = await response.json();

        expect(json).toHaveProperty('success', true);
        expect(json).toHaveProperty('data');
        expect(json).toHaveProperty('meta');
        expect(json.meta).toHaveProperty('timestamp');
      }
    });

    it('all error responses should have same structure', async () => {
      const testCases = [
        { endpoint: '/api/products/nonexistent', status: 404 },
        { endpoint: '/api/cart/validate', method: 'POST', body: { items: [] }, status: 400 },
      ];

      for (const testCase of testCases) {
        const response = testCase.method === 'POST'
          ? await testClient.post(testCase.endpoint, testCase.body)
          : await testClient.get(testCase.endpoint);

        const json = await response.json();

        expect(json).toHaveProperty('success', false);
        expect(json).toHaveProperty('error');
        expect(json.error).toHaveProperty('code');
        expect(json.error).toHaveProperty('message');
        expect(json.error).toHaveProperty('timestamp');
      }
    });
  });
});
```

---

## Acceptance Criteria

### Infrastructure
- [x] `/lib/config/api.ts` created with all constants
- [x] `/lib/utils/api-response.ts` created with standardized response utilities
- [x] `/lib/utils/api-client.ts` created with validation wrapper
- [x] `/lib/validation/query-params.ts` created with Zod schemas

### API Routes Refactored
- [x] All 4 API routes use standardized response format
- [x] Query parameters validated with Zod
- [x] Error handling consistent across all routes
- [x] No more mixed `NextResponse` vs `Response` usage

### Client Code Updated
- [x] All page fetches use `apiGet()` utility
- [x] All fetches use `API_ENDPOINTS` constants
- [x] Responses validated with Zod schemas
- [x] Proper error handling (404 → notFound())

### Testing
- [x] 30+ unit tests added (utilities, validation)
- [x] Integration tests for error scenarios
- [x] All existing tests still passing
- [x] Test coverage for all response formats

### Quality Gates
- [x] TypeScript builds without errors
- [x] Lint passes
- [x] All tests passing (365+ existing + 30+ new)
- [x] No console.error calls outside utilities
- [x] API response format documented

---

## Timeline

**Estimated: 4-6 hours**

- **Hour 1:** Create configuration and validation files
- **Hour 2:** Create response utilities + tests
- **Hour 3:** Create API client utility + tests
- **Hour 4:** Refactor API routes
- **Hour 5:** Update client-side fetches
- **Hour 6:** Integration tests + QA

---

## Handoff to Dr. LeanDev

### Execution Approach

1. **Start with infrastructure** - Build utilities first
2. **Test as you go** - Write unit tests immediately after each utility
3. **Refactor routes one at a time** - Update, test, verify
4. **Update clients last** - After routes are stable
5. **Integration tests final** - Verify everything works together

### Success Indicators

- All API routes return same response shape
- Client can reliably parse all API responses
- Zod validates all inputs and outputs
- Error messages are helpful and consistent
- Ready to build checkout APIs with confidence

### Common Pitfalls

- Don't skip validation tests - they're critical
- Don't forget to update import paths in refactored files
- Test error scenarios, not just happy paths
- Verify TypeScript types are properly inferred

---

**Document Created:** 2025-10-27
**Status:** Ready for implementation
**Blocks:** Phase 2.3.7-B, Phase 2.4
