import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '@/db';
import { users } from '@/db/schema-auth';
import { eq } from 'drizzle-orm';

describe('Ory Webhook Integration', () => {
  const testEmail = `webhook-test-${Date.now()}@example.com`;
  let testKratosId: string;

  afterEach(async () => {
    // Clean up test data
    await db.delete(users).where(eq(users.email, testEmail));
  });

  it('should create local user on identity.created webhook', async () => {
    testKratosId = `kratos-${Date.now()}`;

    const webhookPayload = {
      type: 'identity.created',
      identity: {
        id: testKratosId,
        traits: {
          email: testEmail,
          name: 'Webhook Test User',
          role: 'customer',
        },
      },
    };

    const response = await fetch('http://localhost:30000/api/auth/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': 'change_me_webhook_secret_32_char',
      },
      body: JSON.stringify(webhookPayload),
    });

    expect(response.status).toBe(200);

    // Verify local user created
    const user = await db.query.users.findFirst({
      where: eq(users.email, testEmail),
    });

    expect(user).toBeDefined();
    expect(user!.kratosId).toBe(testKratosId);
    expect(user!.email).toBe(testEmail);
    expect(user!.name).toBe('Webhook Test User');
    expect(user!.role).toBe('customer');
  });

  it('should update local user on identity.updated webhook', async () => {
    testKratosId = `kratos-${Date.now()}`;

    // Create initial user
    await db.insert(users).values({
      kratosId: testKratosId,
      email: testEmail,
      name: 'Old Name',
      role: 'customer',
    });

    const webhookPayload = {
      type: 'identity.updated',
      identity: {
        id: testKratosId,
        traits: {
          email: testEmail,
          name: 'Updated Name',
          role: 'customer',
        },
      },
    };

    const response = await fetch('http://localhost:30000/api/auth/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': 'change_me_webhook_secret_32_char',
      },
      body: JSON.stringify(webhookPayload),
    });

    expect(response.status).toBe(200);

    // Verify local user updated
    const user = await db.query.users.findFirst({
      where: eq(users.kratosId, testKratosId),
    });

    expect(user).toBeDefined();
    expect(user!.name).toBe('Updated Name');
  });
});
