import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createContact, createOrUpdateContact } from '@/lib/contacts/create-contact';
import { db } from '@/db';
import { contacts } from '@/db/schema-auth';
import { eq } from 'drizzle-orm';

describe('Contact Creation', () => {
  const testEmail = `test-${Date.now()}@example.com`;
  // Use a valid UUID format for userId
  const testUserId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

  afterEach(async () => {
    // Clean up test contacts
    await db.delete(contacts).where(eq(contacts.value, testEmail));
  });

  describe('createContact', () => {
    it('should create a new email contact', async () => {
      const contact = await createContact({
        kind: 'email',
        value: testEmail,
        source: 'signup_form',
        isPrimary: true,
      });

      expect(contact).toBeDefined();
      expect(contact.kind).toBe('email');
      expect(contact.value).toBe(testEmail.toLowerCase());
      expect(contact.source).toBe('signup_form');
      expect(contact.isPrimary).toBe(true);
      expect(contact.isVerified).toBe(false);
    });

    it('should normalize email to lowercase', async () => {
      const uppercaseEmail = `TEST-${Date.now()}@EXAMPLE.COM`;
      const contact = await createContact({
        kind: 'email',
        value: uppercaseEmail,
        source: 'signup_form',
      });

      expect(contact.value).toBe(uppercaseEmail.toLowerCase());

      // Clean up
      await db.delete(contacts).where(eq(contacts.id, contact.id));
    });

    it('should create contact linked to a user', async () => {
      const contact = await createContact({
        kind: 'email',
        value: testEmail,
        source: 'auth',
        userId: testUserId,
        isPrimary: true,
      });

      expect(contact.userId).toBe(testUserId);
      expect(contact.isPrimary).toBe(true);
    });

    it('should reject invalid email format', async () => {
      await expect(
        createContact({
          kind: 'email',
          value: 'invalid-email',
          source: 'signup_form',
        })
      ).rejects.toThrow('Invalid email format');
    });

    it('should reject duplicate email', async () => {
      // Create first contact
      await createContact({
        kind: 'email',
        value: testEmail,
        source: 'signup_form',
      });

      // Attempt to create duplicate
      await expect(
        createContact({
          kind: 'email',
          value: testEmail,
          source: 'signup_form',
        })
      ).rejects.toThrow();
    });

    it('should create contact with metadata', async () => {
      const contact = await createContact({
        kind: 'email',
        value: testEmail,
        source: 'signup_form',
        metadata: {
          locale: 'en-CA',
          campaignSource: 'homepage',
        },
      });

      expect(contact.metadata).toEqual({
        locale: 'en-CA',
        campaignSource: 'homepage',
      });
    });

    it('should set timestamps correctly', async () => {
      const beforeCreate = new Date();
      const contact = await createContact({
        kind: 'email',
        value: testEmail,
        source: 'signup_form',
      });
      const afterCreate = new Date();

      expect(contact.createdAt).toBeDefined();
      expect(contact.updatedAt).toBeDefined();
      expect(contact.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(contact.createdAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
    });
  });

  describe('createOrUpdateContact', () => {
    it('should create contact if it does not exist', async () => {
      const contact = await createOrUpdateContact({
        kind: 'email',
        value: testEmail,
        source: 'signup_form',
      });

      expect(contact).toBeDefined();
      expect(contact.value).toBe(testEmail.toLowerCase());
    });

    it('should update existing contact with new source', async () => {
      // Create initial contact
      const first = await createContact({
        kind: 'email',
        value: testEmail,
        source: 'signup_form',
      });

      // Update with new source
      const updated = await createOrUpdateContact({
        kind: 'email',
        value: testEmail,
        source: 'order',
      });

      expect(updated.id).toBe(first.id);
      expect(updated.source).toBe('order');
      expect(updated.updatedAt.getTime()).toBeGreaterThan(first.updatedAt.getTime());
    });

    it('should link existing contact to user', async () => {
      // Create guest contact
      const guest = await createContact({
        kind: 'email',
        value: testEmail,
        source: 'signup_form',
      });

      expect(guest.userId).toBeNull();

      // Link to user
      const linked = await createOrUpdateContact({
        kind: 'email',
        value: testEmail,
        source: 'auth',
        userId: testUserId,
        isPrimary: true,
      });

      expect(linked.id).toBe(guest.id);
      expect(linked.userId).toBe(testUserId);
      expect(linked.isPrimary).toBe(true);
    });
  });
});
