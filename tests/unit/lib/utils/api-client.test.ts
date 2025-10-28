/* eslint-disable @typescript-eslint/no-explicit-any */
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
