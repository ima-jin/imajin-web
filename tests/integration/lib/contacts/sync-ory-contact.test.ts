import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '@/db';
import { contacts, contactSubscriptions, mailingLists } from '@/db/schema-auth';
import { eq, and } from 'drizzle-orm';
import { createContact } from '@/lib/contacts/create-contact';
import { subscribeToList } from '@/lib/contacts/subscribe';
import { syncOryContactToLocal } from '@/lib/contacts/sync-ory-contact';
import { randomUUID } from 'crypto';

describe('Ory Contact Sync', () => {
  afterEach(async () => {
    // Clean up test data
    await db.delete(contactSubscriptions).execute();
    await db.delete(contacts).execute();
  });

  it('creates new contact when Ory user signs up', async () => {
    const userId = randomUUID();
    const email = `newuser-${Date.now()}@example.com`;

    const contactId = await syncOryContactToLocal(userId, email, false);

    const contact = await db.query.contacts.findFirst({
      where: eq(contacts.id, contactId),
    });

    expect(contact!.userId).toBe(userId);
    expect(contact!.value).toBe(email);
    expect(contact!.kind).toBe('email');
    expect(contact!.isPrimary).toBe(true);
    expect(contact!.isVerified).toBe(true); // Ory verified
    expect(contact!.source).toBe('auth');
  });

  it('links existing guest contact when user creates account', async () => {
    const email = `guest-${Date.now()}@example.com`;

    // Create guest contact first
    const guestContact = await createContact({
      kind: 'email',
      value: email,
      source: 'signup_form',
    });

    // User creates account with same email
    const userId = randomUUID();
    await syncOryContactToLocal(userId, email, false);

    const updatedContact = await db.query.contacts.findFirst({
      where: eq(contacts.id, guestContact.id),
    });

    expect(updatedContact!.userId).toBe(userId);
    expect(updatedContact!.isPrimary).toBe(true);
    expect(updatedContact!.isVerified).toBe(true);
  });

  it('creates newsletter subscription if user opts in', async () => {
    const userId = randomUUID();
    const email = `newuser-${Date.now()}@example.com`;

    const contactId = await syncOryContactToLocal(userId, email, true); // optIn = true

    // Get newsletter mailing list
    const newsletterList = await db.query.mailingLists.findFirst({
      where: eq(mailingLists.slug, 'newsletter'),
    });

    // Find newsletter subscription specifically
    const subscription = await db.query.contactSubscriptions.findFirst({
      where: and(
        eq(contactSubscriptions.contactId, contactId),
        eq(contactSubscriptions.mailingListId, newsletterList!.id)
      ),
      with: { mailingList: true },
    });

    expect(subscription).toBeDefined();
    expect(subscription!.mailingList.slug).toBe('newsletter');
    expect(subscription!.status).toBe('subscribed');
  });

  it('auto-subscribes to default lists', async () => {
    const userId = randomUUID();
    const email = `newuser-${Date.now()}@example.com`;

    const contactId = await syncOryContactToLocal(userId, email, false);

    const subscriptions = await db.query.contactSubscriptions.findMany({
      where: eq(contactSubscriptions.contactId, contactId),
      with: { mailingList: true },
    });

    const defaultSub = subscriptions.find(
      s => s.mailingList.isDefault === true
    );

    expect(defaultSub).toBeDefined();
    expect(defaultSub!.mailingList.slug).toBe('order-updates');
    expect(defaultSub!.status).toBe('subscribed');
  });

  it('preserves existing subscriptions when linking guest to user', async () => {
    const email = `guest-${Date.now()}@example.com`;

    // Guest subscribes to newsletter
    const guestContact = await createContact({
      kind: 'email',
      value: email,
      source: 'signup_form',
    });

    const newsletterList = await db.query.mailingLists.findFirst({
      where: eq(mailingLists.slug, 'newsletter'),
    });

    await subscribeToList(guestContact.id, newsletterList!.id);

    // User creates account
    const userId = randomUUID();
    await syncOryContactToLocal(userId, email, false);

    // Subscription should still exist
    const subscription = await db.query.contactSubscriptions.findFirst({
      where: and(
        eq(contactSubscriptions.contactId, guestContact.id),
        eq(contactSubscriptions.mailingListId, newsletterList!.id)
      ),
    });

    expect(subscription).toBeDefined();
    expect(subscription!.status).toBe('pending'); // Stays in pending state
  });
});
