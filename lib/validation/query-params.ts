/**
 * Query Parameter Validation
 *
 * Zod schemas for validating URL query parameters.
 */

import { z } from 'zod';

// Product category validation
export const ProductCategorySchema = z.enum([
  'material',
  'connector',
  'control',
  'diffuser',
  'kit',
  'interface',
]);

export type ProductCategory = z.infer<typeof ProductCategorySchema>;

/**
 * Validates product category query parameter
 */
export function validateProductCategory(
  category: string | null | undefined
): ProductCategory | null {
  if (!category) return null;

  const result = ProductCategorySchema.safeParse(category);
  return result.success ? result.data : null;
}

/**
 * Validates pagination parameters
 */
export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type PaginationParams = z.infer<typeof PaginationSchema>;

/**
 * Validates sort parameters
 */
export const SortSchema = z.object({
  sortBy: z.enum(['name', 'price', 'created_at']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type SortParams = z.infer<typeof SortSchema>;
