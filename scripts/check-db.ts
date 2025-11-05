/**
 * Quick script to check what's in the local database
 */

import { getDb } from "../db/index.js";
import { products, variants, orders, orderItems } from "../db/schema.js";
import { sql } from 'drizzle-orm';

async function checkDatabase() {
  const db = getDb();

  try {
    console.log('🔍 Checking local database...\n');

    // Count products
    const productCount = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(products);
    console.log(`📦 Products: ${productCount[0]?.count || 0}`);

    // Count variants
    const variantCount = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(variants);
    console.log(`🎨 Variants: ${variantCount[0]?.count || 0}`);

    // Count orders
    const orderCount = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(orders);
    console.log(`🛒 Orders: ${orderCount[0]?.count || 0}`);

    // Count order items
    const orderItemCount = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(orderItems);
    console.log(`📝 Order Items: ${orderItemCount[0]?.count || 0}`);

    console.log('\n');

    // List products if any exist
    if (productCount[0]?.count > 0) {
      console.log('📦 Products in database:');
      const allProducts = await db.select({
        id: products.id,
        name: products.name,
        category: products.category,
        hasVariants: products.hasVariants,
        isActive: products.isActive,
      }).from(products).limit(10);

      allProducts.forEach(p => {
        console.log(`  - ${p.id}: ${p.name} (${p.category}) ${p.hasVariants ? '[has variants]' : ''} ${!p.isActive ? '[inactive]' : ''}`);
      });
    }

    // List variants if any exist
    if (variantCount[0]?.count > 0) {
      console.log('\n🎨 Variants in database:');
      const allVariants = await db.select({
        id: variants.id,
        productId: variants.productId,
        variantValue: variants.variantValue,
        maxQuantity: variants.maxQuantity,
        soldQuantity: variants.soldQuantity,
      }).from(variants).limit(10);

      allVariants.forEach(v => {
        console.log(`  - ${v.id}: ${v.variantValue} (product: ${v.productId}) - ${v.soldQuantity}/${v.maxQuantity || '∞'} sold`);
      });
    }

    console.log('\n✅ Database check complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking database:', error);
    process.exit(1);
  }
}

checkDatabase();
