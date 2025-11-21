import { kratosAdmin } from '@/lib/auth/kratos';
import { db } from '@/db';
import { users, trustHubs, userCollectives, userCollectiveMemberships } from '@/db/schema-auth';
import { eq } from 'drizzle-orm';
import * as crypto from 'crypto';

/**
 * Seed authentication data:
 * - Local trust hub (imajin.ca)
 * - Admin user (Ory + local DB)
 * - Imajin collective
 * - Test customer user
 */

/**
 * Generate Ed25519 keypair for hub identity
 * In production, use proper key management
 */
function generateKeyPair(): { publicKey: string; privateKey: string } {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519', {
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

  return {
    publicKey: Buffer.from(publicKey).toString('base64'),
    privateKey: Buffer.from(privateKey).toString('base64'),
  };
}

async function main() {
  console.log('🔐 Seeding authentication data...\n');

  // Step 1: Create local trust hub
  console.log('1. Creating local trust hub (imajin.ca)...');
  let localHubId: string;

  try {
    const hubKeypair = generateKeyPair();

    const [localHub] = await db.insert(trustHubs).values({
      name: 'Imajin',
      slug: 'imajin',
      domain: 'imajin.ca',
      publicKey: hubKeypair.publicKey,
      isLocal: true,
      isActive: true,
      trustLevel: 0, // Self = trust level 0
      apiEndpoint: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:30000',
      federationProtocol: 'activitypub',
      metadata: {
        description: 'Official Imajin trust hub',
        privateKey: hubKeypair.privateKey,
      },
    }).onConflictDoNothing().returning();

    if (localHub) {
      localHubId = localHub.id;
      console.log('   ✅ Local trust hub created');
    } else {
      // Hub already exists, fetch it
      const existingHub = await db.query.trustHubs.findFirst({
        where: (hubs, { eq }) => eq(hubs.isLocal, true),
      });
      localHubId = existingHub!.id;
      console.log('   ⚠️  Local trust hub already exists');
    }
  } catch (error) {
    console.error('   ❌ Error creating trust hub:', error);
    throw error;
  }

  // Step 2: Create admin user in Ory Kratos
  console.log('\n2. Creating admin user in Ory Kratos...');
  let adminUserId: string;
  let adminKratosId: string;

  try {
    const adminPassword = process.env.ADMIN_PASSWORD || 'AdminPassword123!';

    const adminIdentity = await kratosAdmin.createIdentity({
      createIdentityBody: {
        schema_id: 'default',
        traits: {
          email: 'admin@imajin.ca',
          name: 'Admin User',
          role: 'admin',
        },
        credentials: {
          password: {
            config: {
              password: adminPassword,
            },
          },
        },
        state: 'active',
        verifiable_addresses: [
          {
            value: 'admin@imajin.ca',
            verified: true,
            via: 'email',
            status: 'completed',
          },
        ],
      },
    });

    adminKratosId = adminIdentity.data.id;
    console.log('   ✅ Ory identity created:', adminKratosId);

    // Create admin user in local database
    const [adminUser] = await db.insert(users).values({
      kratosId: adminKratosId,
      email: 'admin@imajin.ca',
      name: 'Admin User',
      role: 'admin',
      homeHubId: localHubId,
      isCached: false,
    }).onConflictDoNothing().returning();

    if (adminUser) {
      adminUserId = adminUser.id;
      console.log('   ✅ Local user record created');
    } else {
      // User already exists, fetch it
      const existingUser = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.email, 'admin@imajin.ca'),
      });
      adminUserId = existingUser!.id;
      console.log('   ⚠️  Local user record already exists');
    }
  } catch (error: any) {
    if (error?.response?.status === 409) {
      console.log('   ⚠️  Admin user already exists in Ory');
      // Fetch existing user from local DB
      const existingUser = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.email, 'admin@imajin.ca'),
      });
      if (!existingUser) {
        throw new Error('Admin user exists in Ory but not in local DB');
      }
      adminUserId = existingUser.id;
    } else {
      console.error('   ❌ Error creating admin user:', error);
      throw error;
    }
  }

  // Step 3: Create Imajin collective
  console.log('\n3. Creating Imajin collective...');
  let imajinCollectiveId: string;

  try {
    const [imajinCollective] = await db.insert(userCollectives).values({
      name: 'Imajin',
      slug: 'imajin',
      description: 'Official Imajin LED fixtures and components',
      createdByUserId: adminUserId,
      hostedOnHubId: localHubId,
      originHubId: localHubId,
      isCached: false,
    }).onConflictDoNothing().returning();

    if (imajinCollective) {
      imajinCollectiveId = imajinCollective.id;
      console.log('   ✅ Imajin collective created');

      // Add admin as owner of Imajin collective
      await db.insert(userCollectiveMemberships).values({
        userId: adminUserId,
        collectiveId: imajinCollectiveId,
        role: 'owner',
      }).onConflictDoNothing();

      console.log('   ✅ Admin added as collective owner');
    } else {
      const existingCollective = await db.query.userCollectives.findFirst({
        where: (collectives, { eq }) => eq(collectives.slug, 'imajin'),
      });
      imajinCollectiveId = existingCollective!.id;
      console.log('   ⚠️  Imajin collective already exists');
    }
  } catch (error) {
    console.error('   ❌ Error creating Imajin collective:', error);
    throw error;
  }

  // Step 4: Create test customer user
  console.log('\n4. Creating test customer user...');

  try {
    const customerIdentity = await kratosAdmin.createIdentity({
      createIdentityBody: {
        schema_id: 'default',
        traits: {
          email: 'customer@example.com',
          name: 'Test Customer',
          role: 'customer',
        },
        credentials: {
          password: {
            config: {
              password: 'CustomerPassword123!',
            },
          },
        },
        state: 'active',
        verifiable_addresses: [
          {
            value: 'customer@example.com',
            verified: true,
            via: 'email',
            status: 'completed',
          },
        ],
      },
    });

    const [customerUser] = await db.insert(users).values({
      kratosId: customerIdentity.data.id,
      email: 'customer@example.com',
      name: 'Test Customer',
      role: 'customer',
      homeHubId: localHubId,
      isCached: false,
    }).onConflictDoNothing().returning();

    if (customerUser) {
      console.log('   ✅ Test customer created');
    } else {
      console.log('   ⚠️  Test customer already exists');
    }
  } catch (error: any) {
    if (error?.response?.status === 409) {
      console.log('   ⚠️  Test customer already exists in Ory');
    } else {
      console.error('   ❌ Error creating test customer:', error);
      throw error;
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('✅ Authentication data seeded successfully!\n');
  console.log('Trust Hubs:');
  console.log('  - imajin.ca (local hub, trust_level=0)\n');
  console.log('Collectives:');
  console.log('  - Imajin (official products collective)\n');
  console.log('Users:');
  console.log('  - admin@imajin.ca (password: ' + (process.env.ADMIN_PASSWORD || 'AdminPassword123!') + ')');
  console.log('  - customer@example.com (password: CustomerPassword123!)\n');
  console.log('Next steps:');
  console.log('  1. Backfill existing products/portfolio to Imajin collective');
  console.log('  2. Start Next.js dev server: npm run dev');
  console.log('  3. Test login at: http://localhost:30000/auth/signin');
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
