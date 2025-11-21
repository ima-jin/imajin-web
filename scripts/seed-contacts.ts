import { db } from '@/db';
import { mailingLists } from '@/db/schema-auth';

const defaultLists = [
  {
    slug: 'newsletter',
    name: 'Newsletter',
    description: 'Monthly updates about new products and company news',
    isDefault: false,
  },
  {
    slug: 'product-alerts',
    name: 'Product Alerts',
    description: 'Get notified when new products launch or restock',
    isDefault: false,
  },
  {
    slug: 'order-updates',
    name: 'Order Updates',
    description: 'Transactional emails about your orders (required)',
    isDefault: true, // Auto-subscribe on account creation
  },
  {
    slug: 'sms-alerts',
    name: 'SMS Alerts',
    description: 'Urgent notifications via text message',
    isDefault: false,
  },
];

async function main() {
  console.log('📧 Seeding mailing lists...\n');

  for (const list of defaultLists) {
    // Check if list already exists
    const existing = await db.query.mailingLists.findFirst({
      where: (lists, { eq }) => eq(lists.slug, list.slug),
    });

    if (existing) {
      console.log(`   ⚠️  Mailing list '${list.slug}' already exists`);
      continue;
    }

    // Create mailing list
    await db.insert(mailingLists).values(list);
    console.log(`   ✅ Created mailing list: ${list.name} (${list.slug})`);
  }

  console.log('\n============================================================');
  console.log('✅ Mailing lists seeded successfully!');
  console.log('\nMailing Lists:');
  console.log('  - newsletter (opt-in)');
  console.log('  - product-alerts (opt-in)');
  console.log('  - order-updates (auto-subscribe, required)');
  console.log('  - sms-alerts (inactive - future feature)');
  console.log('============================================================\n');
}

main();
