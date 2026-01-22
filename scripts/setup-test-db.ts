/**
 * Setup test database
 * - Connects to imajin_test database
 * - Creates all tables if they don't exist
 * - Seeds minimal required data (mailing lists)
 */

// Force test environment
(process.env as any).NODE_ENV = 'test';

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { getDatabaseConnectionString } from '@/lib/config/database';
import * as schema from '@/db/schema';
import { mailingLists } from '@/db/schema-auth';

async function main() {
  console.log('🔧 Setting up test database...\n');

  try {
    const connectionString = getDatabaseConnectionString();
    console.log(`Connecting to test database: ${connectionString.replace(/:[^:@]+@/, ':****@')}\n`);

    const client = postgres(connectionString);
    const db = drizzle(client, { schema });

    // Check if mailing_lists table exists by attempting to query it
    try {
      const lists = await db.query.mailingLists.findMany();
      console.log(`✅ Test database already initialized (found ${lists.length} mailing lists)`);
    } catch (error) {
      console.log('❌ Test database not initialized - please run:');
      console.log('   1. Set NODE_ENV=test');
      console.log('   2. npm run db:push');
      console.log('   3. Run this script again');
      throw error;
    }

    // Seed mailing lists if they don't exist
    const existingLists = await db.query.mailingLists.findMany();
    if (existingLists.length === 0) {
      console.log('\n📧 Seeding mailing lists...');

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
          isDefault: true,
        },
        {
          slug: 'sms-alerts',
          name: 'SMS Alerts',
          description: 'Urgent notifications via text message',
          isDefault: false,
        },
      ];

      for (const list of defaultLists) {
        await db.insert(mailingLists).values(list);
        console.log(`   ✅ Created: ${list.name}`);
      }
    }

    await client.end();
    console.log('\n✅ Test database setup complete!\n');
  } catch (error) {
    console.error('\n❌ Test database setup failed:');
    console.error(error);
    process.exit(1);
  }
}

main();
