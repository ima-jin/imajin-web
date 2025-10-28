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
