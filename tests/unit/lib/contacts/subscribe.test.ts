import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  subscribeToList,
  confirmSubscription,
  unsubscribeFromList,
} from '@/lib/contacts/subscribe';
import { db } from '@/db';
import { contacts, mailingLists, contactSubscriptions } from '@/db/schema-auth';
import { eq, and } from 'drizzle-orm';

describe('Subscription Management', () => {
  let testContact: any;
  let testList: any;
  const testEmail = `subscribe-test-${Date.now()}@example.com`;

  beforeEach(async () => {
    // Create test contact
    const [contact] = await db
      .insert(contacts)
      .values({
        kind: 'email',
        value: testEmail,
        source: 'signup_form',
        isPrimary: false,
        isVerified: false,
      })
      .returning();
    testContact = contact;

    // Get test mailing list
    testList = await db.query.mailingLists.findFirst({
      where: eq(mailingLists.slug, 'newsletter'),
    });
  });

  afterEach(async () => {
    // Clean up
    await db.delete(contactSubscriptions).where(eq(contactSubscriptions.contactId, testContact.id));
    await db.delete(contacts).where(eq(contacts.id, testContact.id));
  });

  describe('subscribeToList', () => {
    it('should create pending subscription', async () => {
      const subscription = await subscribeToList(testContact.id, testList.id, {
        optInIp: '127.0.0.1',
        optInUserAgent: 'test-agent',
      });

      expect(subscription).toBeDefined();
      expect(subscription.contactId).toBe(testContact.id);
      expect(subscription.mailingListId).toBe(testList.id);
      expect(subscription.status).toBe('pending');
      expect(subscription.optInIp).toBe('127.0.0.1');
      expect(subscription.optInUserAgent).toBe('test-agent');
    });

    it('should reject duplicate subscription', async () => {
      // Create first subscription
      await subscribeToList(testContact.id, testList.id);

      // Attempt duplicate
      await expect(subscribeToList(testContact.id, testList.id)).rejects.toThrow();
    });
  });

  describe('confirmSubscription', () => {
    it('should confirm pending subscription', async () => {
      // Create pending subscription
      await subscribeToList(testContact.id, testList.id);

      // Confirm subscription
      const confirmed = await confirmSubscription(testContact.id, testList.id);

      expect(confirmed.status).toBe('subscribed');
      expect(confirmed.optInAt).toBeDefined();
    });

    it('should mark contact as verified', async () => {
      // Create pending subscription
      await subscribeToList(testContact.id, testList.id);

      // Confirm subscription
      await confirmSubscription(testContact.id, testList.id);

      // Check contact is verified
      const contact = await db.query.contacts.findFirst({
        where: eq(contacts.id, testContact.id),
      });

      expect(contact?.isVerified).toBe(true);
      expect(contact?.verifiedAt).toBeDefined();
    });
  });

  describe('unsubscribeFromList', () => {
    it('should unsubscribe from list', async () => {
      // Create and confirm subscription
      await subscribeToList(testContact.id, testList.id);
      await confirmSubscription(testContact.id, testList.id);

      // Unsubscribe
      const unsubscribed = await unsubscribeFromList(testContact.id, testList.id, 'user_request');

      expect(unsubscribed.status).toBe('unsubscribed');
      expect(unsubscribed.optOutAt).toBeDefined();
      expect(unsubscribed.metadata).toEqual({ reason: 'user_request' });
    });
  });
});
