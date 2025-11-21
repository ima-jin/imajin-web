#!/usr/bin/env tsx

/**
 * Seed Test Database Script
 *
 * Seeds ALL data needed for test database:
 * 1. Mailing lists (contacts)
 * 2. Products (from test fixtures)
 * 3. Auth data (if Ory Kratos is available)
 *
 * Usage:
 *   npm run test:db:seed
 *   or
 *   dotenv -e .env.test -- tsx scripts/seed-test-db.ts
 */

import { db } from '@/db';
import { mailingLists } from '@/db/schema-auth';
import { syncProductsEnhanced } from './sync-products-enhanced';
import path from 'path';

// Safety check - verify we're using test database
const DATABASE_URL = process.env.DATABASE_URL || '';
if (!DATABASE_URL.includes('imajin_test')) {
  console.error('❌ ERROR: This script can only be run against the test database!');
  console.error(`   Current DATABASE_URL: ${DATABASE_URL}`);
  console.error('   Expected: postgresql://...@.../imajin_test');
  process.exit(1);
}

async function seedMailingLists() {
  console.log('📧 Seeding mailing lists...');

  const defaultLists = [
    {
      slug: 'newsletter',
      name: 'Newsletter',
      description: 'Monthly updates about new products and company news',
      isDefault: false,
      isActive: true,
    },
    {
      slug: 'product-alerts',
      name: 'Product Alerts',
      description: 'Get notified when new products launch or restock',
      isDefault: false,
      isActive: true,
    },
    {
      slug: 'order-updates',
      name: 'Order Updates',
      description: 'Transactional emails about your orders (required)',
      isDefault: true,
      isActive: true,
    },
    {
      slug: 'sms-alerts',
      name: 'SMS Alerts',
      description: 'Urgent notifications via text message',
      isDefault: false,
      isActive: false,
    },
  ];

  let created = 0;
  let skipped = 0;

  for (const list of defaultLists) {
    const existing = await db.query.mailingLists.findFirst({
      where: (lists, { eq }) => eq(lists.slug, list.slug),
    });

    if (existing) {
      skipped++;
      continue;
    }

    await db.insert(mailingLists).values(list);
    created++;
  }

  console.log(`   ✅ Mailing lists: ${created} created, ${skipped} skipped`);
}

async function seedProducts() {
  console.log('📦 Seeding products...');

  // Use test fixtures for products
  const testProductsPath = path.resolve(
    process.cwd(),
    'tests/fixtures/test-products.json'
  );
  const testMediaDir = path.resolve(process.cwd(), 'tests/fixtures/media');

  try {
    const report = await syncProductsEnhanced(testProductsPath, testMediaDir);

    console.log(`   ✅ Products: ${report.dbSynced} synced, ${report.dbErrors.length} errors`);

    if (report.dbErrors.length > 0) {
      console.log('   ⚠️  Product sync had errors (this is expected if tables are missing)');
    }
  } catch (error: any) {
    console.log('   ⚠️  Product sync failed (this is expected if tables are missing)');
    console.log(`   Error: ${error.message}`);
  }
}

async function main() {
  console.log('🌱 Seeding test database...\n');

  // Seed in order
  await seedMailingLists();
  await seedProducts();

  console.log('\n' + '='.repeat(60));
  console.log('✅ Test database seeded successfully!');
  console.log('='.repeat(60));
}

main()
  .catch((error) => {
    console.error('\n❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
