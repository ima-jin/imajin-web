import { Configuration, IdentityApi } from '@ory/client';

const kratosAdmin = new IdentityApi(
  new Configuration({
    basePath: process.env.KRATOS_ADMIN_URL || 'http://localhost:4434',
  })
);

async function main() {
  console.log('🗑️  Deleting all Ory Kratos identities...\n');

  try {
    // List all identities
    const { data: identities } = await kratosAdmin.listIdentities();

    if (identities.length === 0) {
      console.log('✅ No identities found - Ory is already clean\n');
      return;
    }

    console.log(`Found ${identities.length} identities to delete:\n`);

    // Delete each identity
    for (const identity of identities) {
      const email = identity.traits?.email || 'unknown';
      console.log(`   Deleting: ${email} (${identity.id})`);
      await kratosAdmin.deleteIdentity({ id: identity.id });
    }

    console.log('\n✅ All identities deleted successfully\n');
  } catch (error) {
    console.error('❌ Failed to delete identities:', error);
    process.exit(1);
  }
}

main();
