import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '@/db';
import { users } from '@/db/schema-auth';
import { eq } from 'drizzle-orm';

describe('Local User Sync', () => {
  const kratosId = `kratos-sync-${Date.now()}`;
  const testEmail = `sync-test-${Date.now()}@example.com`;

  beforeEach(async () => {
    // Create test user
    await db.insert(users).values({
      kratosId,
      email: testEmail,
      name: 'Sync Test User',
      role: 'customer',
    });
  });

  afterEach(async () => {
    // Clean up
    await db.delete(users).where(eq(users.email, testEmail));
  });

  it('should map Kratos ID to local user', async () => {
    const localUser = await db.query.users.findFirst({
      where: eq(users.kratosId, kratosId),
    });

    expect(localUser).toBeDefined();
    expect(localUser!.kratosId).toBe(kratosId);
    expect(localUser!.email).toBe(testEmail);
    expect(localUser!.name).toBe('Sync Test User');
    expect(localUser!.role).toBe('customer');
  });

  it('should return null when Kratos ID does not exist', async () => {
    const invalidKratosId = 'non-existent-kratos-id';

    const localUser = await db.query.users.findFirst({
      where: eq(users.kratosId, invalidKratosId),
    });

    expect(localUser).toBeUndefined();
  });

  it('should maintain unique constraint on kratosId', async () => {
    // Attempt to insert duplicate kratosId
    await expect(async () => {
      await db.insert(users).values({
        kratosId, // Same as existing user
        email: 'different@example.com',
        name: 'Different User',
        role: 'customer',
      });
    }).rejects.toThrow();
  });
});
