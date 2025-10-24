import { db } from "@/db";
import { products, variants, productSpecs } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import type { Product, ProductWithVariants, ProductWithSpecs, ProductFilters } from "@/types/product";

/**
 * Get all products with optional filtering
 */
export async function getAllProducts(filters?: ProductFilters): Promise<Product[]> {
  const conditions = [];

  // Default filters: only active products with dev_status = 5
  if (filters?.devStatus !== undefined) {
    conditions.push(eq(products.devStatus, filters.devStatus));
  } else {
    // Default to showing only ready-to-sell products
    conditions.push(eq(products.devStatus, 5));
  }

  if (filters?.isActive !== undefined) {
    conditions.push(eq(products.isActive, filters.isActive));
  } else {
    // Default to showing only active products
    conditions.push(eq(products.isActive, true));
  }

  if (filters?.category) {
    conditions.push(eq(products.category, filters.category));
  }

  if (filters?.hasVariants !== undefined) {
    conditions.push(eq(products.hasVariants, filters.hasVariants));
  }

  const result = await db
    .select()
    .from(products)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  return result;
}

/**
 * Get a single product by ID
 */
export async function getProductById(id: string): Promise<Product | null> {
  const result = await db.select().from(products).where(eq(products.id, id));

  return result[0] || null;
}

/**
 * Get products by development status
 */
export async function getProductsByStatus(status: number): Promise<Product[]> {
  const result = await db.select().from(products).where(eq(products.devStatus, status));

  return result;
}

/**
 * Get a product with all its variants and specs
 */
export async function getProductWithVariants(id: string): Promise<ProductWithVariants | null> {
  // Get the product
  const product = await getProductById(id);

  if (!product) {
    return null;
  }

  // Get specs
  const specs = await db.select().from(productSpecs).where(eq(productSpecs.productId, id));

  // Get variants if product has them
  const productVariants = product.hasVariants
    ? await db.select().from(variants).where(eq(variants.productId, id))
    : [];

  return {
    ...product,
    specs,
    variants: productVariants,
  };
}

/**
 * Get a product with specs
 */
export async function getProductWithSpecs(id: string): Promise<ProductWithSpecs | null> {
  const product = await getProductById(id);

  if (!product) {
    return null;
  }

  const specs = await db.select().from(productSpecs).where(eq(productSpecs.productId, id));

  return {
    ...product,
    specs,
  };
}
