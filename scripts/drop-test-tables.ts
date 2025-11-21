/**
 * Drop test database tables
 */

import postgres from 'postgres';

const connectionString = 'postgresql://imajin:imajin_dev@localhost:5435/imajin_test';

async function main() {
  console.log('🔄 Dropping test database tables...\n');

  const client = postgres(connectionString);

  try {
    await client`DROP TABLE IF EXISTS contact_verification_tokens CASCADE`;
    await client`DROP TABLE IF EXISTS contact_subscriptions CASCADE`;
    await client`DROP TABLE IF EXISTS contacts CASCADE`;
    await client`DROP TABLE IF EXISTS mailing_lists CASCADE`;
    console.log('✅ Tables dropped\n');
  } catch (error) {
    console.error('❌ Failed:');
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
