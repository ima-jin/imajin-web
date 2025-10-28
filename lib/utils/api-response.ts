/**
 * API Response Utilities
 *
 * Standardizes API response formats across all route handlers.
 * Ensures consistent error handling and response structure.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
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
  const errorObj: any = {
    code,
    message,
    timestamp: new Date().toISOString(),
  };

  if (details !== undefined) {
    errorObj.details = details;
  }

  return NextResponse.json(
    {
      success: false,
      error: errorObj,
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
      issues: error.issues.map((err: any) => ({
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
