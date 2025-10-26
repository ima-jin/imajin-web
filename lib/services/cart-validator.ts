import { db } from '@/db';
import { products, variants, productDependencies } from '@/db/schema';
import { inArray } from 'drizzle-orm';
import type { CartItem, CartValidationResult, CartValidationError, CartWarning } from '@/types/cart';

export async function validateCart(items: CartItem[]): Promise<CartValidationResult> {
  const errors: CartValidationError[] = [];
  const warnings: CartWarning[] = [];

  if (items.length === 0) {
    return { valid: true, errors: [], warnings: [] };
  }

  // 1. Check product availability
  const productIds = items.map(item => item.productId);
  const dbProducts = await db.query.products.findMany({
    where: inArray(products.id, productIds),
  });

  const availableProductIds = new Set(
    dbProducts.filter(p => p.devStatus === 5).map(p => p.id)
  );

  for (const item of items) {
    if (!availableProductIds.has(item.productId)) {
      errors.push({
        productId: item.productId,
        variantId: item.variantId,
        type: 'unavailable',
        message: `${item.name} is no longer available`,
      });
    }
  }

  // 2. Check limited edition quantities
  const limitedEditionItems = items.filter(item => item.variantId);

  if (limitedEditionItems.length > 0) {
    const variantIds = limitedEditionItems.map(item => item.variantId!);
    const dbVariants = await db.query.variants.findMany({
      where: inArray(variants.id, variantIds),
    });

    for (const item of limitedEditionItems) {
      const variant = dbVariants.find(v => v.id === item.variantId);
      if (!variant) continue;

      const available = variant.maxQuantity! - (variant.soldQuantity ?? 0);

      if (available <= 0) {
        errors.push({
          productId: item.productId,
          variantId: item.variantId,
          type: 'out_of_stock',
          message: `${item.name} is sold out`,
        });
      } else if (item.quantity > available) {
        errors.push({
          productId: item.productId,
          variantId: item.variantId,
          type: 'out_of_stock',
          message: `Only ${available} units of ${item.name} remaining`,
        });
      } else if (available <= 10) {
        warnings.push({
          type: 'low_stock',
          message: `Only ${available} units of ${item.name} remaining`,
        });
      }
    }
  }

  // 3. Check voltage compatibility
  const voltageValidation = validateVoltageCompatibility(items);
  errors.push(...voltageValidation.errors);
  warnings.push(...voltageValidation.warnings);

  // 4. Check dependencies (requires/suggests)
  const dependencyValidation = await validateDependencies(items);
  warnings.push(...dependencyValidation);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

function validateVoltageCompatibility(items: CartItem[]): { errors: CartValidationError[], warnings: CartWarning[] } {
  const errors: CartValidationError[] = [];
  const warnings: CartWarning[] = [];

  const voltages = items
    .map(item => item.voltage)
    .filter((v): v is '5v' | '24v' => v !== undefined);

  const uniqueVoltages = new Set(voltages);

  // If cart has both 5v and 24v components, that's an error
  if (uniqueVoltages.size > 1) {
    errors.push({
      productId: '',
      type: 'voltage_mismatch',
      message: 'Cannot mix 5v and 24v components in the same order. Please choose one voltage system.',
    });
  }

  return { errors, warnings };
}

async function validateDependencies(items: CartItem[]): Promise<CartWarning[]> {
  const warnings: CartWarning[] = [];
  const productIds = items.map(item => item.productId);

  // Get all dependencies for products in cart
  const dependencies = await db.query.productDependencies.findMany({
    where: inArray(productDependencies.productId, productIds),
  });

  for (const dep of dependencies) {
    const hasDependent = productIds.includes(dep.dependsOnProductId);

    if (dep.dependencyType === 'suggests' && !hasDependent) {
      warnings.push({
        type: 'suggested_product',
        message: dep.message || `Consider adding ${dep.dependsOnProductId}`,
        suggestedProductId: dep.dependsOnProductId,
      });
    }

    if (dep.dependencyType === 'requires' && !hasDependent) {
      warnings.push({
        type: 'missing_component',
        message: dep.message || `This product requires ${dep.dependsOnProductId}`,
        suggestedProductId: dep.dependsOnProductId,
      });
    }
  }

  return warnings;
}
