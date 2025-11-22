/**
 * Products Page Tests
 * Phase 2.4.9 - Dynamic Founder Edition Variant Display
 *
 * Tests for the products listing page (app/products/page.tsx)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProductsPage from '@/app/products/page';
import { createMockProduct, createMockDbVariant } from '@/tests/fixtures/products';

// Mock the page content hook
vi.mock('@/hooks/usePageContent', () => ({
  getProductsListingContent: vi.fn().mockResolvedValue({
    page: {
      heading: 'Browse Products',
      subheading: 'Explore our modular LED fixtures',
    },
    filters: {
      sections: [
        {
          id: 'category',
          heading: 'Category',
          options: [
            { value: 'kit', label: 'Kits' },
            { value: 'material', label: 'Panels' },
          ],
        },
      ],
    },
    product_sections: [
      {
        id: 'founder',
        heading: 'Founder Edition',
        description: 'Limited run of 1,000 units',
      },
      {
        id: 'expansion',
        heading: 'Expansion & Upgrades',
        description: 'Add to your existing setup',
      },
      {
        id: 'accessories',
        heading: 'Accessories',
        description: 'Complete your installation',
      },
      {
        id: 'diy',
        heading: 'DIY Kits',
        description: 'Build it yourself',
      },
    ],
  }),
}));

// Mock product service functions
vi.mock('@/lib/services/product-service');

describe('ProductsPage', () => {
  beforeEach(async () => {
    vi.clearAllMocks();

    const { getAllProducts, getProductWithVariants } = await import('@/lib/services/product-service');

    // Set up default mocks
    vi.mocked(getAllProducts).mockResolvedValue([
      createMockProduct({
        id: 'product-1',
        name: 'Material Panel',
        category: 'material',
        basePriceCents: 5000,
        hasVariants: false,
      }),
      createMockProduct({
        id: 'founder-edition',
        name: 'Founder Edition',
        category: 'kit',
        basePriceCents: 10000,
        hasVariants: true,
      }),
      createMockProduct({
        id: 'product-3',
        name: 'Interface',
        category: 'interface',
        basePriceCents: 2000,
        hasVariants: false,
      }),
    ]);

    vi.mocked(getProductWithVariants).mockResolvedValue({
      ...createMockProduct({
        id: 'founder-edition',
        name: 'Founder Edition',
        category: 'kit',
        basePriceCents: 10000,
        hasVariants: true,
      }),
      specs: [],
      variants: [
        createMockDbVariant({
          id: 'variant-black',
          productId: 'founder-edition',
          variantValue: 'BLACK',
          availableQuantity: 500,
          maxQuantity: 500,
        }),
        createMockDbVariant({
          id: 'variant-white',
          productId: 'founder-edition',
          variantValue: 'WHITE',
          availableQuantity: 300,
          maxQuantity: 300,
        }),
        createMockDbVariant({
          id: 'variant-red',
          productId: 'founder-edition',
          variantValue: 'RED',
          availableQuantity: 200,
          maxQuantity: 200,
        }),
      ],
    });
  });

  describe('Rendering', () => {
    it('should render products page without errors', async () => {
      const component = await ProductsPage();
      const { container } = render(component);
      expect(container.querySelector('div')).toBeInTheDocument();
    });

    it('should display page heading', async () => {
      const component = await ProductsPage();
      render(component);
      expect(screen.getByText('Browse Products')).toBeInTheDocument();
    });

    it('should display page subheading', async () => {
      const component = await ProductsPage();
      render(component);
      expect(screen.getByText(/Explore our modular LED fixtures/i)).toBeInTheDocument();
    });
  });

  describe('Founder Edition Variant Rendering - Phase 2.4.9', () => {
    it('should call getProductWithVariants when founder edition exists', async () => {
      const { getProductWithVariants } = await import('@/lib/services/product-service');

      const component = await ProductsPage();
      render(component);

      // Verify getProductWithVariants was called with founder edition ID
      expect(getProductWithVariants).toHaveBeenCalledWith('founder-edition');
    });

    it('should not call getProductWithVariants when no product has variants', async () => {
      const { getAllProducts, getProductWithVariants } = await import('@/lib/services/product-service');

      // Mock to return products without variants
      vi.mocked(getAllProducts).mockResolvedValueOnce([
        createMockProduct({
          id: 'product-1',
          name: 'Product 1',
          category: 'material',
          basePriceCents: 5000,
          hasVariants: false,
        }),
      ]);

      vi.mocked(getProductWithVariants).mockClear();

      const component = await ProductsPage();
      render(component);

      // Verify getProductWithVariants was NOT called
      expect(getProductWithVariants).not.toHaveBeenCalled();
    });

    it('should render Founder Edition section when variants exist', async () => {
      const component = await ProductsPage();
      render(component);

      expect(screen.getAllByText('Founder Edition').length).toBeGreaterThan(0);
      expect(screen.getByText(/Limited run of 1,000 units/i)).toBeInTheDocument();
    });

    it('should display availability badges for each variant', async () => {
      const component = await ProductsPage();
      render(component);

      // Check for availability badges
      expect(screen.getByText('500 Available')).toBeInTheDocument();
      expect(screen.getByText('300 Available')).toBeInTheDocument();
      expect(screen.getByText('200 Available')).toBeInTheDocument();
    });

    it('should handle null availableQuantity gracefully', async () => {
      const { getProductWithVariants } = await import('@/lib/services/product-service');

      // Mock variant with null availableQuantity
      vi.mocked(getProductWithVariants).mockResolvedValueOnce({
        ...createMockProduct({
          id: 'founder-edition',
          name: 'Founder Edition',
          category: 'kit',
          basePriceCents: 10000,
          hasVariants: true,
        }),
        specs: [],
        variants: [
          createMockDbVariant({
            id: 'variant-black',
            productId: 'founder-edition',
            variantValue: 'BLACK',
            availableQuantity: null,
            maxQuantity: 500,
          }),
        ],
      });

      const component = await ProductsPage();
      render(component);

      // Should display "0 Available" when null
      expect(screen.getByText('0 Available')).toBeInTheDocument();
    });
  });

  describe('Product Categorization', () => {
    it('should categorize products into sections', async () => {
      const component = await ProductsPage();
      render(component);

      // Expansion & Upgrades section
      expect(screen.getByText('Expansion & Upgrades')).toBeInTheDocument();

      // Accessories section
      expect(screen.getByText('Accessories')).toBeInTheDocument();
    });

    it('should filter expansion products correctly', async () => {
      const component = await ProductsPage();
      render(component);

      // Material Panel should be in expansion section
      expect(screen.getByText('Material Panel')).toBeInTheDocument();
    });
  });
});
