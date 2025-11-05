import { db } from '@/db';
import { products } from '@/db/schema';
import { eq } from 'drizzle-orm';

async function fixFounderLive() {
  console.log('🔧 Setting Unit-8x8x8-Founder to is_live = true...\n');

  const result = await db
    .update(products)
    .set({ isLive: true })
    .where(eq(products.id, 'Unit-8x8x8-Founder'))
    .returning();

  if (result.length > 0) {
    console.log('✅ Updated successfully!');
    console.log('   is_live:', result[0].isLive);
    console.log('   is_active:', result[0].isActive);
    console.log('   sell_status:', result[0].sellStatus);
    console.log('\n✨ Product should now be visible on the site!');
  } else {
    console.log('❌ Product not found');
  }

  process.exit(0);
}

fixFounderLive().catch(console.error);
