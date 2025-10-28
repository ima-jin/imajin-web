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
        validationResult.error.issues
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
