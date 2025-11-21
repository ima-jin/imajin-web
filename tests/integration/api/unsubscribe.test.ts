import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '@/db';
import { contacts, contactSubscriptions, mailingLists } from '@/db/schema-auth';
import { eq, and } from 'drizzle-orm';
import { createContact } from '@/lib/contacts/create-contact';
import { subscribeToList } from '@/lib/contacts/subscribe';
import { POST as unsubscribePost } from '@/app/api/unsubscribe/route';
import { POST as subscribePost } from '@/app/api/subscribe/route';
import { NextRequest } from 'next/server';

function createMockRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost:3000/api/unsubscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function createSubscribeMockRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost:3000/api/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/unsubscribe', () => {
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
    await db.delete(contactSubscriptions).execute();
    await db.delete(contacts).execute();
  });

  it('unsubscribes contact from mailing list', async () => {
    const email = `test-${Date.now()}@example.com`;
    const contact = await createContact({
      kind: 'email',
      value: email,
      source: 'signup_form',
    });

    // Create subscription
    await subscribeToList(contact.id, newsletterListId, { autoConfirm: true });

    const request = createMockRequest({
      contactId: contact.id,
      mailingListId: newsletterListId,
      reason: 'No longer interested',
    });

    const response = await unsubscribePost(request);

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.message).toBe('Successfully unsubscribed from mailing list');

    // Verify subscription status is updated
    const subscription = await db.query.contactSubscriptions.findFirst({
      where: and(
        eq(contactSubscriptions.contactId, contact.id),
        eq(contactSubscriptions.mailingListId, newsletterListId)
      ),
    });

    expect(subscription!.status).toBe('unsubscribed');
    expect(subscription!.optOutAt).toBeDefined();
    expect(subscription!.metadata).toHaveProperty('reason', 'No longer interested');
  });

  it('returns 404 when subscription does not exist', async () => {
    const fakeContactId = '00000000-0000-0000-0000-000000000000';

    const request = createMockRequest({
      contactId: fakeContactId,
      mailingListId: newsletterListId,
    });

    const response = await unsubscribePost(request);

    expect(response.status).toBe(404);

    const data = await response.json();
    expect(data.error).toBe('Subscription not found');
  });

  it('preserves subscription history (soft delete)', async () => {
    const email = `test-${Date.now()}@example.com`;
    const contact = await createContact({
      kind: 'email',
      value: email,
      source: 'signup_form',
    });

    await subscribeToList(contact.id, newsletterListId, { autoConfirm: true });

    // Unsubscribe
    const request = createMockRequest({
      contactId: contact.id,
      mailingListId: newsletterListId,
    });

    await unsubscribePost(request);

    // Verify subscription record still exists
    const subscription = await db.query.contactSubscriptions.findFirst({
      where: and(
        eq(contactSubscriptions.contactId, contact.id),
        eq(contactSubscriptions.mailingListId, newsletterListId)
      ),
    });

    expect(subscription).toBeDefined();
    expect(subscription!.status).toBe('unsubscribed');
    expect(subscription!.optInAt).toBeDefined(); // Original opt-in date preserved
  });

  it('allows re-subscription after unsubscribe', async () => {
    const email = `test-${Date.now()}@example.com`;
    const contact = await createContact({
      kind: 'email',
      value: email,
      source: 'signup_form',
    });

    await subscribeToList(contact.id, newsletterListId, { autoConfirm: true });

    // Unsubscribe
    const unsubscribeRequest = createMockRequest({
      contactId: contact.id,
      mailingListId: newsletterListId,
    });

    await unsubscribePost(unsubscribeRequest);

    // Re-subscribe via API
    const subscribeRequest = createSubscribeMockRequest({
      email,
      mailingListId: newsletterListId,
    });

    const response = await subscribePost(subscribeRequest);

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);

    // Verify subscription is pending again
    const subscription = await db.query.contactSubscriptions.findFirst({
      where: and(
        eq(contactSubscriptions.contactId, contact.id),
        eq(contactSubscriptions.mailingListId, newsletterListId)
      ),
    });

    expect(subscription!.status).toBe('pending');
  });
});
