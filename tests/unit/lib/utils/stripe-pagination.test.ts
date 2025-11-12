import { describe, it, expect, vi } from 'vitest';
import { paginateStripeList } from '@/lib/utils/stripe-pagination';

describe('Stripe Pagination Helper', () => {
  describe('Basic Pagination', () => {
    it('should fetch all results from single page', async () => {
      // Arrange
      const mockListFn = vi.fn().mockResolvedValue({
        data: [{ id: 'prod_1' }, { id: 'prod_2' }],
        has_more: false,
      });

      // Act
      const results = await paginateStripeList(mockListFn, { limit: 100 });

      // Assert
      expect(results).toHaveLength(2);
      expect(results[0].id).toBe('prod_1');
      expect(results[1].id).toBe('prod_2');
      expect(mockListFn).toHaveBeenCalledTimes(1);
      expect(mockListFn).toHaveBeenCalledWith({ limit: 100 });
    });

    it('should fetch all results from multiple pages', async () => {
      // Arrange
      const mockListFn = vi.fn()
        .mockResolvedValueOnce({
          data: [{ id: 'prod_1' }, { id: 'prod_2' }],
          has_more: true,
        })
        .mockResolvedValueOnce({
          data: [{ id: 'prod_3' }],
          has_more: false,
        });

      // Act
      const results = await paginateStripeList(mockListFn, { limit: 2 });

      // Assert
      expect(results).toHaveLength(3);
      expect(results[0].id).toBe('prod_1');
      expect(results[2].id).toBe('prod_3');
      expect(mockListFn).toHaveBeenCalledTimes(2);
      expect(mockListFn).toHaveBeenNthCalledWith(1, { limit: 2 });
      expect(mockListFn).toHaveBeenNthCalledWith(2, { limit: 2, starting_after: 'prod_2' });
    });

    it('should handle empty results', async () => {
      // Arrange
      const mockListFn = vi.fn().mockResolvedValue({
        data: [],
        has_more: false,
      });

      // Act
      const results = await paginateStripeList(mockListFn, { limit: 100 });

      // Assert
      expect(results).toHaveLength(0);
      expect(mockListFn).toHaveBeenCalledTimes(1);
    });

    it('should use custom limit when provided', async () => {
      // Arrange
      const mockListFn = vi.fn().mockResolvedValue({
        data: [{ id: 'prod_1' }],
        has_more: false,
      });

      // Act
      await paginateStripeList(mockListFn, { limit: 50 });

      // Assert
      expect(mockListFn).toHaveBeenCalledWith({ limit: 50 });
    });
  });

  describe('Advanced Pagination Features', () => {
    it('should pass additional parameters to list function', async () => {
      // Arrange
      const mockListFn = vi.fn().mockResolvedValue({
        data: [{ id: 'prod_1' }],
        has_more: false,
      });

      // Act
      await paginateStripeList(mockListFn, {
        limit: 100,
        active: true,
        product: 'prod_123'
      });

      // Assert
      expect(mockListFn).toHaveBeenCalledWith({
        limit: 100,
        active: true,
        product: 'prod_123'
      });
    });

    it('should paginate while preserving filter parameters', async () => {
      // Arrange
      const mockListFn = vi.fn()
        .mockResolvedValueOnce({
          data: [{ id: 'prod_1' }],
          has_more: true,
        })
        .mockResolvedValueOnce({
          data: [{ id: 'prod_2' }],
          has_more: false,
        });

      // Act
      await paginateStripeList(mockListFn, {
        limit: 1,
        active: true
      });

      // Assert
      expect(mockListFn).toHaveBeenNthCalledWith(2, {
        limit: 1,
        active: true,
        starting_after: 'prod_1'
      });
    });

    it('should paginate through many pages without issues', async () => {
      // Arrange - Mock 5 pages of results
      const mockListFn = vi.fn()
        .mockResolvedValueOnce({ data: [{ id: '1' }], has_more: true })
        .mockResolvedValueOnce({ data: [{ id: '2' }], has_more: true })
        .mockResolvedValueOnce({ data: [{ id: '3' }], has_more: true })
        .mockResolvedValueOnce({ data: [{ id: '4' }], has_more: true })
        .mockResolvedValueOnce({ data: [{ id: '5' }], has_more: false });

      // Act
      const results = await paginateStripeList(mockListFn, { limit: 1 });

      // Assert
      expect(results).toHaveLength(5);
      expect(mockListFn).toHaveBeenCalledTimes(5);
    });

    it('should use last item ID as starting_after cursor', async () => {
      // Arrange
      const mockListFn = vi.fn()
        .mockResolvedValueOnce({
          data: [{ id: 'first' }, { id: 'last_of_page' }],
          has_more: true,
        })
        .mockResolvedValueOnce({
          data: [{ id: 'next' }],
          has_more: false,
        });

      // Act
      await paginateStripeList(mockListFn, { limit: 2 });

      // Assert
      expect(mockListFn).toHaveBeenNthCalledWith(2, {
        limit: 2,
        starting_after: 'last_of_page'
      });
    });
  });

  describe('Error Handling', () => {
    it('should throw error when API call fails', async () => {
      // Arrange
      const mockListFn = vi.fn().mockRejectedValue(new Error('Stripe API error'));

      // Act & Assert
      await expect(paginateStripeList(mockListFn, { limit: 100 }))
        .rejects.toThrow('Stripe API error');
    });

    it('should throw error if pagination fails mid-way', async () => {
      // Arrange
      const mockListFn = vi.fn()
        .mockResolvedValueOnce({
          data: [{ id: 'prod_1' }],
          has_more: true,
        })
        .mockRejectedValueOnce(new Error('Network timeout'));

      // Act & Assert
      await expect(paginateStripeList(mockListFn, { limit: 1 }))
        .rejects.toThrow('Network timeout');
    });

    it('should handle missing has_more field', async () => {
      // Arrange
      const mockListFn = vi.fn().mockResolvedValue({
        data: [{ id: 'prod_1' }],
        // has_more missing
      });

      // Act
      const results = await paginateStripeList(mockListFn, { limit: 100 });

      // Assert - Should treat missing has_more as false
      expect(results).toHaveLength(1);
      expect(mockListFn).toHaveBeenCalledTimes(1);
    });

    it('should throw error when data field is missing', async () => {
      // Arrange
      const mockListFn = vi.fn().mockResolvedValue({
        has_more: false,
        // data missing
      });

      // Act & Assert
      await expect(paginateStripeList(mockListFn, { limit: 100 }))
        .rejects.toThrow();
    });
  });
});
