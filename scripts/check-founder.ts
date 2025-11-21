import { db } from '@/db';
import { products } from '@/db/schema';
import { eq } from 'drizzle-orm';

async function checkFounder() {
  const founder = await db
    .select()
    .from(products)
    .where(eq(products.id, 'Unit-8x8x8-Founder'))
    .limit(1);

  if (founder.length === 0) {
    console.log('❌ Founder Edition not found in database');
    process.exit(1);
  }

  const product = founder[0];
  console.log('\n📦 Unit-8x8x8-Founder Product Status:\n');
  console.log('ID:', product.id);
  console.log('Name:', product.name);
  console.log('dev_status:', product.devStatus);
  console.log('is_active:', product.isActive);
  console.log('is_live:', product.isLive);
  console.log('sell_status:', product.sellStatus);
  console.log('presale_deposit_price_cents:', product.presaleDepositPriceCents);
  console.log('base_price_cents:', product.basePriceCents);
  console.log('wholesale_price_cents:', product.wholesalePriceCents);

  console.log('\n🔍 Display Check:');
  const shouldShow =
    product.isLive &&
    product.isActive &&
    product.devStatus === 5 &&
    (product.sellStatus === 'pre-sale' ||
      product.sellStatus === 'pre-order' ||
      product.sellStatus === 'for-sale');

  if (shouldShow) {
    console.log('✅ Product SHOULD be visible');
  } else {
    console.log('❌ Product will NOT be visible because:');
    if (!product.isLive) console.log('  - is_live = false');
    if (!product.isActive) console.log('  - is_active = false');
    if (product.devStatus !== 5) console.log('  - dev_status ≠ 5');
    if (
      product.sellStatus !== 'pre-sale' &&
      product.sellStatus !== 'pre-order' &&
      product.sellStatus !== 'for-sale'
    ) {
      console.log(`  - sell_status = '${product.sellStatus}' (not pre-sale/pre-order/for-sale)`);
    }
  }

  process.exit(0);
}

checkFounder().catch(console.error);
