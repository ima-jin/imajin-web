import { describe, it, expect } from 'vitest';
import { ProductConfigSchema } from '@/config/schema';

// Base product template with all required fields
const baseProduct = {
  id: 'test-product',
  name: 'Test Product',
  description: 'Test product description',
  category: 'material' as const,
  dev_status: 5,
  base_price: 1000,
  has_variants: false,
  is_live: true,
  sell_status: 'for-sale' as const,
  media: [],
  specs: [],
  show_on_portfolio_page: false,
  portfolio_copy: null,
  is_featured: false,
  hero_image: null,
};

describe('Portfolio & Featured Product Schema', () => {
  describe('showOnPortfolioPage field', () => {
    it('should accept show_on_portfolio_page: true', () => {
      const validProduct = {
        ...baseProduct,
        show_on_portfolio_page: true,
      };

      const result = ProductConfigSchema.safeParse(validProduct);
      expect(result.success).toBe(true);
    });

    it('should accept show_on_portfolio_page: false', () => {
      const validProduct = {
        ...baseProduct,
        show_on_portfolio_page: false,
      };

      const result = ProductConfigSchema.safeParse(validProduct);
      expect(result.success).toBe(true);
    });

    it('should default show_on_portfolio_page to false when omitted', () => {
      const { show_on_portfolio_page, ...productWithoutField } = baseProduct;

      const result = ProductConfigSchema.safeParse(productWithoutField);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.show_on_portfolio_page).toBe(false);
      }
    });
  });

  describe('portfolioCopy field', () => {
    it('should accept portfolio_copy with valid markdown text', () => {
      const validProduct = {
        ...baseProduct,
        show_on_portfolio_page: true,
        portfolio_copy: '**Featured Installation:** Downtown Tech Hub\n\nBringing sophisticated lighting to modern workspace.',
      };

      const result = ProductConfigSchema.safeParse(validProduct);
      expect(result.success).toBe(true);
    });

    it('should accept portfolio_copy: null', () => {
      const validProduct = {
        ...baseProduct,
        portfolio_copy: null,
      };

      const result = ProductConfigSchema.safeParse(validProduct);
      expect(result.success).toBe(true);
    });

    it('should reject portfolio_copy exceeding 2000 characters', () => {
      const longText = 'a'.repeat(2001);
      const invalidProduct = {
        ...baseProduct,
        show_on_portfolio_page: true,
        portfolio_copy: longText,
      };

      const result = ProductConfigSchema.safeParse(invalidProduct);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('2000');
      }
    });

    it('should accept portfolio_copy at exactly 2000 characters', () => {
      const maxText = 'a'.repeat(2000);
      const validProduct = {
        ...baseProduct,
        show_on_portfolio_page: true,
        portfolio_copy: maxText,
      };

      const result = ProductConfigSchema.safeParse(validProduct);
      expect(result.success).toBe(true);
    });
  });

  describe('is_featured field', () => {
    it('should accept is_featured: true with hero_image', () => {
      const validProduct = {
        ...baseProduct,
        is_featured: true,
        hero_image: 'imajin/products/hero-image-001',
      };

      const result = ProductConfigSchema.safeParse(validProduct);
      expect(result.success).toBe(true);
    });

    it('should accept is_featured: false', () => {
      const validProduct = {
        ...baseProduct,
        is_featured: false,
      };

      const result = ProductConfigSchema.safeParse(validProduct);
      expect(result.success).toBe(true);
    });

    it('should default is_featured to false when omitted', () => {
      const { is_featured, ...productWithoutField } = baseProduct;

      const result = ProductConfigSchema.safeParse(productWithoutField);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.is_featured).toBe(false);
      }
    });
  });

  describe('hero_image field', () => {
    it('should accept hero_image with Cloudinary public ID', () => {
      const validProduct = {
        ...baseProduct,
        is_featured: true,
        hero_image: 'imajin/products/hero-founder-edition',
      };

      const result = ProductConfigSchema.safeParse(validProduct);
      expect(result.success).toBe(true);
    });

    it('should accept hero_image: null', () => {
      const validProduct = {
        ...baseProduct,
        hero_image: null,
      };

      const result = ProductConfigSchema.safeParse(validProduct);
      expect(result.success).toBe(true);
    });
  });
});
