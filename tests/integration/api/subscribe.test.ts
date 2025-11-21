import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '@/db';
import { contacts, contactSubscriptions, contactVerificationTokens, mailingLists } from '@/db/schema-auth';
import { eq } from 'drizzle-orm';
import { POST } from '@/app/api/subscribe/route';
import { NextRequest } from 'next/server';

function createMockRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost:3000/api/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/subscribe', () => {
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

  it('creates contact and pending subscription with valid email', async () => {
    const email = `test-${Date.now()}@example.com`;

    const request = createMockRequest({
      email,
      mailingListId: newsletterListId,
    });

    const response = await POST(request);

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.message).toBe('Please check your email to confirm your subscription');

    // Verify contact was created
    const contact = await db.query.contacts.findFirst({
      where: eq(contacts.value, email),
    });
    expect(contact).toBeDefined();
    expect(contact!.kind).toBe('email');
    expect(contact!.isVerified).toBe(false);

    // Verify subscription was created
    const subscription = await db.query.contactSubscriptions.findFirst({
      where: eq(contactSubscriptions.contactId, contact!.id),
    });
    expect(subscription).toBeDefined();
    expect(subscription!.status).toBe('pending');
    expect(subscription!.mailingListId).toBe(newsletterListId);
  });

  it('sends verification email with valid token', async () => {
    const email = `test-${Date.now()}@example.com`;

    const request = createMockRequest({
      email,
      mailingListId: newsletterListId,
    });

    await POST(request);

    // Verify token was created
    const contact = await db.query.contacts.findFirst({
      where: eq(contacts.value, email),
    });

    const token = await db.query.contactVerificationTokens.findFirst({
      where: eq(contactVerificationTokens.contactId, contact!.id),
    });

    expect(token).toBeDefined();
    expect(token!.token).toHaveLength(43); // Base64URL length
    expect(token!.mailingListId).toBe(newsletterListId);
    expect(token!.expiresAt).toBeInstanceOf(Date);
  });

  it('rejects invalid email format', async () => {
    const request = createMockRequest({
      email: 'not-an-email',
      mailingListId: newsletterListId,
    });

    const response = await POST(request);

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toBe('Invalid email address');
  });

  it('rejects non-existent mailing list', async () => {
    const email = `test-${Date.now()}@example.com`;
    const fakeListId = '00000000-0000-0000-0000-000000000000';

    const request = createMockRequest({
      email,
      mailingListId: fakeListId,
    });

    const response = await POST(request);

    expect(response.status).toBe(404);

    const data = await response.json();
    expect(data.error).toBe('Mailing list not found');
  });

  it('handles already subscribed contact gracefully', async () => {
    const email = `test-${Date.now()}@example.com`;

    // Subscribe once
    const request1 = createMockRequest({
      email,
      mailingListId: newsletterListId,
    });
    await POST(request1);

    // Manually verify the subscription
    const contact = await db.query.contacts.findFirst({
      where: eq(contacts.value, email),
    });

    await db
      .update(contactSubscriptions)
      .set({ status: 'subscribed', optInAt: new Date() })
      .where(eq(contactSubscriptions.contactId, contact!.id));

    // Try to subscribe again
    const request2 = createMockRequest({
      email,
      mailingListId: newsletterListId,
    });

    const response = await POST(request2);

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.message).toBe('You are already subscribed to this list');
  });

  it('handles pending verification without creating duplicate tokens', async () => {
    const email = `test-${Date.now()}@example.com`;

    // Subscribe once
    const request1 = createMockRequest({
      email,
      mailingListId: newsletterListId,
    });
    await POST(request1);

    // Try to subscribe again immediately
    const request2 = createMockRequest({
      email,
      mailingListId: newsletterListId,
    });

    const response = await POST(request2);

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.message).toBe('Verification email already sent. Please check your inbox.');

    // Verify only one token exists
    const contact = await db.query.contacts.findFirst({
      where: eq(contacts.value, email),
    });

    const tokens = await db.query.contactVerificationTokens.findMany({
      where: eq(contactVerificationTokens.contactId, contact!.id),
    });

    expect(tokens.length).toBe(1);
  });

  it('normalizes email address (lowercase, trim)', async () => {
    const email = '  TEST@EXAMPLE.COM  ';
    const normalized = 'test@example.com';

    const request = createMockRequest({
      email,
      mailingListId: newsletterListId,
    });

    const response = await POST(request);

    expect(response.status).toBe(200);

    // Verify contact was created with normalized email
    const contact = await db.query.contacts.findFirst({
      where: eq(contacts.value, normalized),
    });

    expect(contact).toBeDefined();
    expect(contact!.value).toBe(normalized);
  });

  it('allows subscribing to multiple different lists', async () => {
    const email = `test-${Date.now()}@example.com`;

    // Get a second mailing list
    const orderUpdatesList = await db.query.mailingLists.findFirst({
      where: eq(mailingLists.slug, 'order-updates'),
    });

    // Subscribe to newsletter
    const request1 = createMockRequest({
      email,
      mailingListId: newsletterListId,
    });
    await POST(request1);

    // Subscribe to order-updates
    const request2 = createMockRequest({
      email,
      mailingListId: orderUpdatesList!.id,
    });

    const response = await POST(request2);

    expect(response.status).toBe(200);

    // Verify two subscriptions exist
    const contact = await db.query.contacts.findFirst({
      where: eq(contacts.value, email),
    });

    const subscriptions = await db.query.contactSubscriptions.findMany({
      where: eq(contactSubscriptions.contactId, contact!.id),
    });

    expect(subscriptions.length).toBe(2);
    const listIds = subscriptions.map(s => s.mailingListId);
    expect(listIds).toContain(newsletterListId);
    expect(listIds).toContain(orderUpdatesList!.id);
  });
});
