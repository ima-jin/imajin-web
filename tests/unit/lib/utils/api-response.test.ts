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
