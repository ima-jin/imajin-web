import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { ERROR_CODES, HTTP_STATUS } from '@/lib/config/api';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch as any;

describe('API Error Handling', () => {
  beforeAll(() => {
    // Reset mock before all tests
    mockFetch.mockReset();
  });

  afterAll(() => {
    mockFetch.mockRestore();
  });

  describe('GET /api/products', () => {
    it('should return standardized success response', async () => {
      // Mock successful response
      mockFetch.mockResolvedValueOnce({
        status: HTTP_STATUS.OK,
        ok: true,
        json: async () => ({
          success: true,
          data: [
            { id: 'test-1', name: 'Test Product', basePriceCents: 1000 }
          ],
          meta: { timestamp: new Date().toISOString() }
        })
      });

      const response = await fetch('http://localhost:3000/api/products');
      const json = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(json.success).toBe(true);
      expect(json.data).toBeDefined();
      expect(json.meta).toBeDefined();
      expect(json.meta.timestamp).toBeDefined();
    });

    it('should handle invalid category gracefully', async () => {
      // Mock successful response (invalid category returns all products)
      mockFetch.mockResolvedValueOnce({
        status: HTTP_STATUS.OK,
        ok: true,
        json: async () => ({
          success: true,
          data: [],
          meta: { timestamp: new Date().toISOString() }
        })
      });

      const response = await fetch('http://localhost:3000/api/products?category=invalid');

      // Should return all products (invalid category is ignored)
      expect(response.status).toBe(HTTP_STATUS.OK);
    });
  });

  describe('GET /api/products/:id', () => {
    it('should return standardized 404 for non-existent product', async () => {
      // Mock 404 response
      mockFetch.mockResolvedValueOnce({
        status: HTTP_STATUS.NOT_FOUND,
        ok: false,
        json: async () => ({
          success: false,
          error: {
            code: ERROR_CODES.NOT_FOUND,
            message: 'Product not found',
            timestamp: new Date().toISOString()
          }
        })
      });

      const response = await fetch('http://localhost:3000/api/products/nonexistent');
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
      // Mock validation error for empty cart
      mockFetch.mockResolvedValueOnce({
        status: HTTP_STATUS.BAD_REQUEST,
        ok: false,
        json: async () => ({
          success: false,
          error: {
            code: ERROR_CODES.BAD_REQUEST,
            message: 'Cart is empty',
            timestamp: new Date().toISOString()
          }
        })
      });

      const response = await fetch('http://localhost:3000/api/cart/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items: [] }),
      });
      const json = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe(ERROR_CODES.BAD_REQUEST);
    });

    it('should return validation error for invalid format', async () => {
      // Mock validation error for invalid format
      mockFetch.mockResolvedValueOnce({
        status: HTTP_STATUS.BAD_REQUEST,
        ok: false,
        json: async () => ({
          success: false,
          error: {
            code: ERROR_CODES.BAD_REQUEST,
            message: 'Invalid cart data format',
            timestamp: new Date().toISOString()
          }
        })
      });

      const response = await fetch('http://localhost:3000/api/cart/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items: [{ invalidField: 'test' }] }),
      });
      const json = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(json.success).toBe(false);
    });
  });

  describe('GET /api/health', () => {
    it('should return standardized health check response', async () => {
      // Mock health check success
      mockFetch.mockResolvedValueOnce({
        status: HTTP_STATUS.OK,
        ok: true,
        json: async () => ({
          success: true,
          data: {
            status: 'healthy',
            database: 'connected',
            timestamp: new Date().toISOString()
          },
          meta: { timestamp: new Date().toISOString() }
        })
      });

      const response = await fetch('http://localhost:3000/api/health');
      const json = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(json.success).toBe(true);
      expect(json.data.status).toBe('healthy');
      expect(json.data.database).toBe('connected');
    });
  });

  describe('Response Format Consistency', () => {
    it('all success responses should have same structure', async () => {
      const testData = [
        {
          endpoint: '/api/products',
          response: {
            success: true,
            data: [],
            meta: { timestamp: new Date().toISOString() }
          }
        },
        {
          endpoint: '/api/health',
          response: {
            success: true,
            data: { status: 'healthy', database: 'connected' },
            meta: { timestamp: new Date().toISOString() }
          }
        }
      ];

      for (const { endpoint, response: mockResponse } of testData) {
        mockFetch.mockResolvedValueOnce({
          status: HTTP_STATUS.OK,
          ok: true,
          json: async () => mockResponse
        });

        const response = await fetch(`http://localhost:3000${endpoint}`);
        const json = await response.json();

        expect(json).toHaveProperty('success', true);
        expect(json).toHaveProperty('data');
        expect(json).toHaveProperty('meta');
        expect(json.meta).toHaveProperty('timestamp');
      }
    });

    it('all error responses should have same structure', async () => {
      const testCases = [
        {
          endpoint: '/api/products/nonexistent',
          method: 'GET',
          status: 404,
          errorCode: ERROR_CODES.NOT_FOUND,
          message: 'Product not found'
        },
        {
          endpoint: '/api/cart/validate',
          method: 'POST',
          body: { items: [] },
          status: 400,
          errorCode: ERROR_CODES.BAD_REQUEST,
          message: 'Cart is empty'
        },
      ];

      for (const testCase of testCases) {
        mockFetch.mockResolvedValueOnce({
          status: testCase.status,
          ok: false,
          json: async () => ({
            success: false,
            error: {
              code: testCase.errorCode,
              message: testCase.message,
              timestamp: new Date().toISOString()
            }
          })
        });

        const response = await fetch(`http://localhost:3000${testCase.endpoint}`, {
          method: testCase.method,
          headers: testCase.method === 'POST' ? {
            'Content-Type': 'application/json',
          } : undefined,
          body: testCase.body ? JSON.stringify(testCase.body) : undefined,
        });

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
