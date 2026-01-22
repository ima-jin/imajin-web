import { db } from '@/db';
import { mailingLists, contacts, contactSubscriptions } from '@/db/schema-auth';

async function main() {
  console.log('📧 Checking mailing lists...\n');

  const lists = await db.select().from(mailingLists);

  if (lists.length === 0) {
    console.log('❌ No mailing lists found in database');
    console.log('   Run: npx tsx scripts/seed-contacts.ts');
  } else {
    console.log(`✅ Found ${lists.length} mailing list(s):\n`);
    for (const list of lists) {
      console.log(`   - ${list.name} (${list.slug})`);
      console.log(`     ${list.description}`);
      console.log(`     Active: ${list.isActive}, Default: ${list.isDefault}\n`);
    }
  }

  console.log('📧 Checking contacts...\n');
  const contactsList = await db.select().from(contacts);
  console.log(`   Found ${contactsList.length} contact(s)\n`);

  console.log('📧 Checking subscriptions...\n');
  const subscriptions = await db.select().from(contactSubscriptions);
  console.log(`   Found ${subscriptions.length} subscription(s)\n`);

  process.exit(0);
}

main();
