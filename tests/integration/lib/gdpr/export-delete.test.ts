import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '@/db';
import { contacts, contactSubscriptions, mailingLists, users } from '@/db/schema-auth';
import { eq } from 'drizzle-orm';
import { exportContactData } from '@/lib/gdpr/export-contact-data';
import { deleteContactData } from '@/lib/gdpr/delete-contact-data';

describe('GDPR - Contact Data Export/Delete', () => {
  afterEach(async () => {
    // Clean up test data
    await db.delete(contactSubscriptions).execute();
    await db.delete(contacts).execute();
    await db.delete(users).execute();
  });

  it('exports all contact data for user', async () => {
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
      isVerified: true,
      verifiedAt: new Date(),
    }).returning();

    const list = await db.query.mailingLists.findFirst({
      where: eq(mailingLists.slug, 'newsletter'),
    });

    await db.insert(contactSubscriptions).values({
      contactId: contact.id,
      mailingListId: list!.id,
      status: 'subscribed',
      optInAt: new Date(),
    });

    const exportData = await exportContactData(user.id);

    expect(exportData.contacts).toHaveLength(1);
    expect(exportData.contacts[0]).toMatchObject({
      value: 'user@example.com',
      kind: 'email',
      isVerified: true,
    });
    expect(exportData.contacts[0].subscriptions).toHaveLength(1);
    expect(exportData.contacts[0].subscriptions[0]).toMatchObject({
      list: 'Newsletter',
      status: 'subscribed',
    });
  });

  it('deletes all contact data for user (right to be forgotten)', async () => {
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

    const list = await db.query.mailingLists.findFirst({
      where: eq(mailingLists.slug, 'newsletter'),
    });

    await db.insert(contactSubscriptions).values({
      contactId: contact.id,
      mailingListId: list!.id,
      status: 'subscribed',
    });

    await deleteContactData(user.id);

    // Contact should be deleted
    const contactExists = await db.query.contacts.findFirst({
      where: eq(contacts.id, contact.id),
    });

    expect(contactExists).toBeUndefined();

    // Subscription should be cascade deleted
    const subscriptionExists = await db.query.contactSubscriptions.findFirst({
      where: eq(contactSubscriptions.contactId, contact.id),
    });

    expect(subscriptionExists).toBeUndefined();
  });

  it('exports subscription history with timestamps', async () => {
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

    const list = await db.query.mailingLists.findFirst({
      where: eq(mailingLists.slug, 'newsletter'),
    });

    await db.insert(contactSubscriptions).values({
      contactId: contact.id,
      mailingListId: list!.id,
      status: 'unsubscribed',
      optInAt: new Date('2025-01-01'),
      optOutAt: new Date('2025-02-01'),
    });

    const exportData = await exportContactData(user.id);

    expect(exportData.contacts[0].subscriptions[0]).toMatchObject({
      optInAt: expect.any(Date),
      optOutAt: expect.any(Date),
    });
  });
});
