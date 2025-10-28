import { describe, it, expect } from 'vitest';
import {
  ProductCategorySchema,
  validateProductCategory,
  PaginationSchema,
  SortSchema,
} from '@/lib/validation/query-params';

describe('Query Parameter Validation', () => {
  describe('ProductCategorySchema', () => {
    it('should accept valid categories', () => {
      expect(ProductCategorySchema.parse('material')).toBe('material');
      expect(ProductCategorySchema.parse('kit')).toBe('kit');
    });

    it('should reject invalid categories', () => {
      expect(() => ProductCategorySchema.parse('invalid')).toThrow();
    });
  });

  describe('validateProductCategory', () => {
    it('should return valid category', () => {
      expect(validateProductCategory('material')).toBe('material');
    });

    it('should return null for invalid category', () => {
      expect(validateProductCategory('invalid')).toBeNull();
    });

    it('should return null for null/undefined', () => {
      expect(validateProductCategory(null)).toBeNull();
      expect(validateProductCategory(undefined)).toBeNull();
    });
  });

  describe('PaginationSchema', () => {
    it('should apply defaults', () => {
      const result = PaginationSchema.parse({});
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it('should coerce string numbers', () => {
      const result = PaginationSchema.parse({ page: '2', limit: '50' });
      expect(result.page).toBe(2);
      expect(result.limit).toBe(50);
    });

    it('should reject invalid values', () => {
      expect(() => PaginationSchema.parse({ page: 0 })).toThrow();
      expect(() => PaginationSchema.parse({ page: -1 })).toThrow();
      expect(() => PaginationSchema.parse({ limit: 101 })).toThrow();
    });
  });

  describe('SortSchema', () => {
    it('should apply defaults', () => {
      const result = SortSchema.parse({});
      expect(result.sortBy).toBe('created_at');
      expect(result.sortOrder).toBe('desc');
    });

    it('should accept valid sort options', () => {
      const result = SortSchema.parse({ sortBy: 'price', sortOrder: 'asc' });
      expect(result.sortBy).toBe('price');
      expect(result.sortOrder).toBe('asc');
    });

    it('should reject invalid sort values', () => {
      expect(() => SortSchema.parse({ sortBy: 'invalid' })).toThrow();
      expect(() => SortSchema.parse({ sortOrder: 'invalid' })).toThrow();
    });
  });
});
