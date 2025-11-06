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
  CHECKOUT_SESSION: '/api/checkout/session',
  ORDER_LOOKUP: '/api/orders/lookup',
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

  // Payment errors
  PAYMENT_ERROR: 'PAYMENT_ERROR',
  STRIPE_ERROR: 'STRIPE_ERROR',

  // Order errors
  ORDER_CREATION_ERROR: 'ORDER_CREATION_ERROR',
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];
