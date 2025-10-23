import { db } from './index';
import { products, variants, productSpecs } from './schema';
import { eq } from 'drizzle-orm';

async function testConnection() {
  console.log('🔌 Testing database connection...\n');

  try {
    // Test 1: Count products
    const allProducts = await db.select().from(products);
    console.log(`✅ Products found: ${allProducts.length}`);

    // Test 2: Get active products with dev_status = 5
    const activeProducts = await db.select()
      .from(products)
      .where(eq(products.devStatus, 5));
    console.log(`✅ Active products (dev_status = 5): ${activeProducts.length}`);

    // Test 3: Get Founder Edition variants
    const founderVariants = await db.select()
      .from(variants)
      .where(eq(variants.productId, 'Unit-8x8x8-Founder'));
    console.log(`✅ Founder Edition variants: ${founderVariants.length}`);

    // Test 4: Show variant availability
    console.log('\n📊 Founder Edition Availability:');
    for (const variant of founderVariants) {
      console.log(`   ${variant.variantValue}: ${variant.soldQuantity}/${variant.maxQuantity} sold (${variant.availableQuantity} available)`);
    }

    // Test 5: Get product specs for Material-8x8-V
    const specs = await db.select()
      .from(productSpecs)
      .where(eq(productSpecs.productId, 'Material-8x8-V'));
    console.log(`\n✅ Material-8x8-V specifications: ${specs.length} specs found`);

    console.log('\n✅ All database tests passed!');
    console.log('🎉 Database setup is complete and working!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Database connection test failed:', error);
    process.exit(1);
  }
}

testConnection();
