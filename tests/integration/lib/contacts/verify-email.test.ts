import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '@/db';
import { contacts, contactVerificationTokens, mailingLists } from '@/db/schema-auth';
import { eq, and } from 'drizzle-orm';
import { createContact } from '@/lib/contacts/create-contact';
import { subscribeToList } from '@/lib/contacts/subscribe';
import { createVerificationToken, verifyEmail } from '@/lib/contacts/verify-email';

describe('Email Verification', () => {
  let testMailingListId: string;

  beforeEach(async () => {
    // Get newsletter mailing list for testing
    const newsletterList = await db.query.mailingLists.findFirst({
      where: eq(mailingLists.slug, 'newsletter'),
    });
    testMailingListId = newsletterList!.id;
  });

  afterEach(async () => {
    // Clean up test data
    await db.delete(contactVerificationTokens).execute();
    await db.delete(contacts).execute();
  });

  describe('createVerificationToken', () => {
    it('creates verification token with expiration', async () => {
      const contact = await createContact({
        kind: 'email',
        value: `test-${Date.now()}@example.com`,
        source: 'signup_form',
      });

      const token = await createVerificationToken(contact.id, testMailingListId);

      expect(token.token).toHaveLength(43); // Base64URL length
      expect(token.contactId).toBe(contact.id);
      expect(token.mailingListId).toBe(testMailingListId);
      expect(token.expiresAt).toBeInstanceOf(Date);
      expect(token.usedAt).toBeNull();
    });

    it('prevents token generation spam (rate limit)', async () => {
      const contact = await createContact({
        kind: 'email',
        value: `test-${Date.now()}@example.com`,
        source: 'signup_form',
      });

      // Generate 3 tokens rapidly
      await createVerificationToken(contact.id, testMailingListId);
      await createVerificationToken(contact.id, testMailingListId);
      await createVerificationToken(contact.id, testMailingListId);

      // 4th should fail
      await expect(
        createVerificationToken(contact.id, testMailingListId)
      ).rejects.toThrow('Too many verification requests');
    });
  });

  describe('verifyEmail', () => {
    it('verifies email with valid token', async () => {
      const contact = await createContact({
        kind: 'email',
        value: `test-${Date.now()}@example.com`,
        source: 'signup_form',
      });

      // Create pending subscription
      await subscribeToList(contact.id, testMailingListId);

      const token = await createVerificationToken(contact.id, testMailingListId);

      const result = await verifyEmail(token.token);

      expect(result.contact.isVerified).toBe(true);
      expect(result.contact.verifiedAt).toBeDefined();
      expect(result.subscription.status).toBe('subscribed');
      expect(result.subscription.optInAt).toBeDefined();
    });

    it('rejects expired verification token', async () => {
      const contact = await createContact({
        kind: 'email',
        value: `test-${Date.now()}@example.com`,
        source: 'signup_form',
      });

      // Create token that expires immediately
      const [token] = await db.insert(contactVerificationTokens).values({
        contactId: contact.id,
        mailingListId: testMailingListId,
        token: 'expired-token',
        expiresAt: new Date(Date.now() - 1000), // 1 second ago
      }).returning();

      await expect(verifyEmail('expired-token')).rejects.toThrow('Token expired');
    });

    it('rejects already used token', async () => {
      const contact = await createContact({
        kind: 'email',
        value: `test-${Date.now()}@example.com`,
        source: 'signup_form',
      });

      const token = await createVerificationToken(contact.id, testMailingListId);

      await verifyEmail(token.token); // Use once

      await expect(verifyEmail(token.token)).rejects.toThrow('Token already used');
    });

    it('rejects invalid token', async () => {
      await expect(verifyEmail('invalid-token-12345')).rejects.toThrow('Invalid token');
    });

    it('marks token as used after verification', async () => {
      const contact = await createContact({
        kind: 'email',
        value: `test-${Date.now()}@example.com`,
        source: 'signup_form',
      });

      const token = await createVerificationToken(contact.id, testMailingListId);

      await verifyEmail(token.token);

      const updatedToken = await db.query.contactVerificationTokens.findFirst({
        where: eq(contactVerificationTokens.token, token.token),
      });

      expect(updatedToken!.usedAt).toBeDefined();
    });
  });
});
