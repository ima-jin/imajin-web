import { db } from '@/db';
import { contacts } from '@/db/schema-auth';
import { eq } from 'drizzle-orm';

async function main() {
  console.log('🔍 Testing direct contact insert...\n');

  try {
    console.log('Attempting to insert contact...');
    const [contact] = await db
      .insert(contacts)
      .values({
        kind: 'email',
        value: 'diagnostic-test@example.com',
        source: 'manual',
        userId: null,
        isPrimary: false,
        isVerified: false,
        metadata: {},
      })
      .returning();

    console.log('\n✅ SUCCESS! Contact inserted:');
    console.log(JSON.stringify(contact, null, 2));

    // Clean up
    await db.delete(contacts).where(eq(contacts.id, contact.id));
    console.log('\n✅ Test contact cleaned up');
  } catch (error) {
    console.error('\n❌ FAILED! Error details:');
    console.error(error);

    if (error instanceof Error) {
      console.error('\nError name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
  }

  process.exit(0);
}

main();
