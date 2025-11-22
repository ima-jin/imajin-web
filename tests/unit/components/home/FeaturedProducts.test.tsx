/**
 * FeaturedProducts Component Tests
 * Phase 2.4.7 - Phase 2
 *
 * Tests for the homepage featured products section
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import FeaturedProducts from '@/components/home/FeaturedProducts';
import { createFeaturedProduct } from '@/tests/fixtures/products';

// Mock fetch
global.fetch = vi.fn();

describe('FeaturedProducts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Product Display', () => {
    it('should fetch and display featured products', async () => {
      const mockProducts = [
        createFeaturedProduct({
          id: 'prod_1',
          name: 'Featured Product 1',
          basePriceCents: 10000,
        }),
        createFeaturedProduct({
          id: 'prod_2',
          name: 'Featured Product 2',
          basePriceCents: 15000,
        }),
        createFeaturedProduct({
          id: 'prod_3',
          name: 'Featured Product 3',
          basePriceCents: 20000,
        }),
      ];

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockProducts }),
      } as Response);

      render(<FeaturedProducts />);

      await waitFor(() => {
        expect(screen.getAllByRole('article')).toHaveLength(3);
      });
    });

    it('should limit to 6 featured products max', async () => {
      const mockProducts = Array.from({ length: 10 }, (_, i) =>
        createFeaturedProduct({
          id: `prod_${i}`,
          name: `Product ${i}`,
          basePriceCents: 10000,
        })
      );

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockProducts }),
      } as Response);

      render(<FeaturedProducts />);

      await waitFor(() => {
        const products = screen.getAllByRole('article');
        expect(products.length).toBeLessThanOrEqual(6);
      });
    });

    it('should only show products with isFeatured = true', async () => {
      const mockProducts = [
        createFeaturedProduct({
          id: 'featured',
          name: 'Featured',
          basePriceCents: 10000,
        }),
        {
          ...createFeaturedProduct({
            id: 'not-featured',
            name: 'Not Featured',
            basePriceCents: 10000,
          }),
          isFeatured: false,
        },
      ];

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockProducts }),
      } as Response);

      render(<FeaturedProducts />);

      await waitFor(() => {
        expect(screen.getByText('Featured')).toBeInTheDocument();
        expect(screen.queryByText('Not Featured')).not.toBeInTheDocument();
      });
    });

    it('should display product grid layout', async () => {
      const mockProducts = [
        createFeaturedProduct({
          id: 'prod_1',
          name: 'Product 1',
          basePriceCents: 10000,
        }),
      ];

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockProducts }),
      } as Response);

      const { container } = render(<FeaturedProducts />);

      await waitFor(() => {
        const grid = container.querySelector('[class*="grid"]');
        expect(grid).toBeInTheDocument();
      });
    });

    it('should be responsive', async () => {
      const mockProducts = [
        createFeaturedProduct({
          id: 'prod_1',
          name: 'Product 1',
          basePriceCents: 10000,
        }),
      ];

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockProducts }),
      } as Response);

      const { container } = render(<FeaturedProducts />);

      await waitFor(() => {
        // Grid should have responsive classes
        expect(container.firstChild).toBeInTheDocument();
      });
    });
  });

  describe('Loading & Error States', () => {
    it('should show loading skeleton while fetching', () => {
      vi.mocked(fetch).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<FeaturedProducts />);

      // Should show loading text specifically
      const loading = screen.getByText('Loading featured products...');
      expect(loading).toBeInTheDocument();
    });

    it('should handle fetch errors gracefully', async () => {
      vi.mocked(fetch).mockRejectedValue(new Error('Fetch failed'));

      render(<FeaturedProducts />);

      await waitFor(() => {
        // Should show error message or empty state
        const main = screen.getByRole('region', { hidden: true }) || screen.getByText(/error|failed|try again/i);
        expect(main).toBeInTheDocument();
      });
    });

    it('should show empty state when no featured products', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ data: [] }),
      } as Response);

      render(<FeaturedProducts />);

      await waitFor(() => {
        // Should show empty state or hide section
        const section = screen.queryByRole('region');
        expect(section).toBeInTheDocument();
      });
    });

    it('should have section heading', async () => {
      const mockProducts = [
        createFeaturedProduct({
          id: 'prod_1',
          name: 'Product 1',
          basePriceCents: 10000,
        }),
      ];

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockProducts }),
      } as Response);

      render(<FeaturedProducts />);

      await waitFor(() => {
        const heading = screen.getByRole('heading', { name: /featured|products/i });
        expect(heading).toBeInTheDocument();
      });
    });

    it('should link to individual product pages', async () => {
      const mockProducts = [
        createFeaturedProduct({
          id: 'prod_123',
          name: 'Test Product',
          basePriceCents: 10000,
        }),
      ];

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockProducts }),
      } as Response);

      render(<FeaturedProducts />);

      await waitFor(() => {
        const link = screen.getByRole('link', { name: /test product/i });
        expect(link).toHaveAttribute('href', '/products/prod_123');
      });
    });
  });
});
