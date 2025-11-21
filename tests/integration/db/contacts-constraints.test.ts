import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '@/db';
import { contacts, contactSubscriptions, mailingLists, users } from '@/db/schema-auth';
import { eq } from 'drizzle-orm';

describe('Database Constraints - Contacts', () => {
  afterEach(async () => {
    // Clean up test data
    await db.delete(contactSubscriptions).execute();
    await db.delete(contacts).execute();
    await db.delete(users).execute();
  });

  it('enforces unique constraint on value+kind', async () => {
    await db.insert(contacts).values({
      kind: 'email',
      value: 'test@example.com',
      source: 'signup_form',
    });

    await expect(
      db.insert(contacts).values({
        kind: 'email',
        value: 'test@example.com',
        source: 'manual',
      })
    ).rejects.toThrow();
  });

  it('allows same value for email and phone kinds', async () => {
    await db.insert(contacts).values({
      kind: 'email',
      value: 'contact@example.com',
      source: 'signup_form',
    });

    // Same value but different kind should succeed
    await expect(
      db.insert(contacts).values({
        kind: 'phone',
        value: 'contact@example.com', // Weird but valid
        source: 'manual',
      })
    ).resolves.toBeDefined();
  });

  it('enforces single primary contact per user+kind', async () => {
    // Create a user first
    const [user] = await db.insert(users).values({
      kratosId: crypto.randomUUID(),
      email: 'user@example.com',
      role: 'customer',
    }).returning();

    await db.insert(contacts).values({
      userId: user.id,
      kind: 'email',
      value: 'primary@example.com',
      isPrimary: true,
      source: 'auth',
    });

    await expect(
      db.insert(contacts).values({
        userId: user.id,
        kind: 'email',
        value: 'secondary@example.com',
        isPrimary: true,
        source: 'manual',
      })
    ).rejects.toThrow();
  });

  it('allows multiple non-primary contacts per user', async () => {
    // Create a user first
    const [user] = await db.insert(users).values({
      kratosId: crypto.randomUUID(),
      email: 'user@example.com',
      role: 'customer',
    }).returning();

    await db.insert(contacts).values({
      userId: user.id,
      kind: 'email',
      value: 'email1@example.com',
      isPrimary: false,
      source: 'auth',
    });

    await expect(
      db.insert(contacts).values({
        userId: user.id,
        kind: 'email',
        value: 'email2@example.com',
        isPrimary: false,
        source: 'manual',
      })
    ).resolves.toBeDefined();
  });

  it('cascades delete from user to contacts', async () => {
    const [user] = await db.insert(users).values({
      kratosId: crypto.randomUUID(),
      email: 'user@example.com',
      role: 'customer',
    }).returning();

    const [contact] = await db.insert(contacts).values({
      userId: user.id,
      kind: 'email',
      value: 'user@example.com',
      source: 'auth',
    }).returning();

    // Delete user
    await db.delete(users).where(eq(users.id, user.id));

    // Contact should be deleted
    const contactExists = await db.query.contacts.findFirst({
      where: eq(contacts.id, contact.id),
    });

    expect(contactExists).toBeUndefined();
  });

  it('cascades delete from contact to subscriptions', async () => {
    const [contact] = await db.insert(contacts).values({
      kind: 'email',
      value: 'test@example.com',
      source: 'signup_form',
    }).returning();

    const list = await db.query.mailingLists.findFirst({
      where: eq(mailingLists.slug, 'newsletter'),
    });

    const [subscription] = await db.insert(contactSubscriptions).values({
      contactId: contact.id,
      mailingListId: list!.id,
      status: 'subscribed',
    }).returning();

    // Delete contact
    await db.delete(contacts).where(eq(contacts.id, contact.id));

    // Subscription should be deleted
    const subscriptionExists = await db.query.contactSubscriptions.findFirst({
      where: eq(contactSubscriptions.id, subscription.id),
    });

    expect(subscriptionExists).toBeUndefined();
  });

  it('enforces unique subscription per contact+list', async () => {
    const [contact] = await db.insert(contacts).values({
      kind: 'email',
      value: 'test@example.com',
      source: 'signup_form',
    }).returning();

    const list = await db.query.mailingLists.findFirst({
      where: eq(mailingLists.slug, 'newsletter'),
    });

    await db.insert(contactSubscriptions).values({
      contactId: contact.id,
      mailingListId: list!.id,
      status: 'subscribed',
    });

    await expect(
      db.insert(contactSubscriptions).values({
        contactId: contact.id,
        mailingListId: list!.id,
        status: 'pending',
      })
    ).rejects.toThrow();
  });

  it('updates updated_at timestamp on contact update', async () => {
    const [contact] = await db.insert(contacts).values({
      kind: 'email',
      value: 'test@example.com',
      source: 'signup_form',
    }).returning();

    const originalUpdatedAt = contact.updatedAt;

    // Wait 1ms to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 1));

    await db.update(contacts)
      .set({ isVerified: true })
      .where(eq(contacts.id, contact.id));

    const [updated] = await db.select()
      .from(contacts)
      .where(eq(contacts.id, contact.id));

    expect(updated.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });
});
