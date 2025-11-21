import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '@/db';
import { contacts, contactVerificationTokens, contactSubscriptions, mailingLists } from '@/db/schema-auth';
import { eq } from 'drizzle-orm';
import { createContact } from '@/lib/contacts/create-contact';
import { subscribeToList } from '@/lib/contacts/subscribe';
import { createVerificationToken } from '@/lib/contacts/verify-email';
import { GET } from '@/app/api/verify-email/route';
import { NextRequest } from 'next/server';

function createMockRequest(token?: string, headers?: Record<string, string>): NextRequest {
  const url = token
    ? `http://localhost:3000/api/verify-email?token=${token}`
    : 'http://localhost:3000/api/verify-email';

  return new NextRequest(url, {
    method: 'GET',
    headers: headers || {},
  });
}

describe('GET /api/verify-email', () => {
  let newsletterListId: string;

  beforeEach(async () => {
    // Get newsletter list for testing
    const newsletterList = await db.query.mailingLists.findFirst({
      where: eq(mailingLists.slug, 'newsletter'),
    });
    newsletterListId = newsletterList!.id;
  });

  afterEach(async () => {
    // Clean up test data
    await db.delete(contactVerificationTokens).execute();
    await db.delete(contactSubscriptions).execute();
    await db.delete(contacts).execute();
  });

  it('verifies email with valid token and redirects to success page', async () => {
    const email = `test-${Date.now()}@example.com`;
    const contact = await createContact({
      kind: 'email',
      value: email,
      source: 'signup_form',
    });

    await subscribeToList(contact.id, newsletterListId);
    const tokenRecord = await createVerificationToken(contact.id, newsletterListId);

    const request = createMockRequest(tokenRecord.token);
    const response = await GET(request);

    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toContain('/subscription-confirmed');

    // Verify contact is marked as verified
    const updatedContact = await db.query.contacts.findFirst({
      where: eq(contacts.id, contact.id),
    });
    expect(updatedContact!.isVerified).toBe(true);
    expect(updatedContact!.verifiedAt).toBeDefined();

    // Verify subscription status is updated
    const subscription = await db.query.contactSubscriptions.findFirst({
      where: eq(contactSubscriptions.contactId, contact.id),
    });
    expect(subscription!.status).toBe('subscribed');
    expect(subscription!.optInAt).toBeDefined();
  });

  it('returns 400 error when token is missing', async () => {
    const request = createMockRequest();
    const response = await GET(request);

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toBe('Verification token is required');
  });

  it('returns 400 error when token is expired', async () => {
    const email = `test-${Date.now()}@example.com`;
    const contact = await createContact({
      kind: 'email',
      value: email,
      source: 'signup_form',
    });

    await subscribeToList(contact.id, newsletterListId);

    // Create expired token
    const [expiredToken] = await db
      .insert(contactVerificationTokens)
      .values({
        contactId: contact.id,
        mailingListId: newsletterListId,
        token: 'expired-token-123',
        expiresAt: new Date(Date.now() - 1000), // 1 second ago
      })
      .returning();

    const request = createMockRequest(expiredToken.token);
    const response = await GET(request);

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toBe('Token expired');
  });

  it('captures opt-in metadata (IP address, user agent)', async () => {
    const email = `test-${Date.now()}@example.com`;
    const contact = await createContact({
      kind: 'email',
      value: email,
      source: 'signup_form',
    });

    await subscribeToList(contact.id, newsletterListId);
    const tokenRecord = await createVerificationToken(contact.id, newsletterListId);

    const request = createMockRequest(tokenRecord.token, {
      'User-Agent': 'Mozilla/5.0 (Test Browser)',
      'X-Forwarded-For': '192.168.1.100',
    });

    const response = await GET(request);

    expect(response.status).toBe(302);

    // Verify opt-in metadata was captured
    const subscription = await db.query.contactSubscriptions.findFirst({
      where: eq(contactSubscriptions.contactId, contact.id),
    });

    expect(subscription!.optInIp).toBeDefined();
    expect(subscription!.optInUserAgent).toBeDefined();
  });

  it('marks token as used after verification', async () => {
    const email = `test-${Date.now()}@example.com`;
    const contact = await createContact({
      kind: 'email',
      value: email,
      source: 'signup_form',
    });

    await subscribeToList(contact.id, newsletterListId);
    const tokenRecord = await createVerificationToken(contact.id, newsletterListId);

    const request1 = createMockRequest(tokenRecord.token);
    await GET(request1);

    // Verify token is marked as used
    const updatedToken = await db.query.contactVerificationTokens.findFirst({
      where: eq(contactVerificationTokens.id, tokenRecord.id),
    });

    expect(updatedToken!.usedAt).toBeDefined();

    // Try to use the same token again - should fail
    const request2 = createMockRequest(tokenRecord.token);
    const response = await GET(request2);

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toBe('Token already used');
  });
});
