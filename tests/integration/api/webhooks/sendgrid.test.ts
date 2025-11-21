import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '@/db';
import { contacts, contactSubscriptions, mailingLists } from '@/db/schema-auth';
import { eq, and } from 'drizzle-orm';
import { createContact } from '@/lib/contacts/create-contact';
import { subscribeToList, confirmSubscription } from '@/lib/contacts/subscribe';
import { POST } from '@/app/api/webhooks/sendgrid/route';
import { NextRequest } from 'next/server';

function createMockRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost:3000/api/webhooks/sendgrid', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/webhooks/sendgrid', () => {
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

  it('handles hard bounce event', async () => {
    const email = `bounced-${Date.now()}@example.com`;
    const contact = await createContact({
      kind: 'email',
      value: email,
      source: 'signup_form',
    });

    await subscribeToList(contact.id, newsletterListId);
    await confirmSubscription(contact.id, newsletterListId);

    const request = createMockRequest([
      {
        event: 'bounce',
        email,
        type: 'blocked',
        status: '5.1.1',
        reason: 'User unknown',
      },
    ]);

    const response = await POST(request);

    expect(response.status).toBe(200);

    const updatedContact = await db.query.contacts.findFirst({
      where: eq(contacts.id, contact.id),
    });

    expect(updatedContact!.isVerified).toBe(false);
    expect(updatedContact!.metadata).toHaveProperty('bounceType', 'hard');

    const subscription = await db.query.contactSubscriptions.findFirst({
      where: and(
        eq(contactSubscriptions.contactId, contact.id),
        eq(contactSubscriptions.mailingListId, newsletterListId)
      ),
    });

    expect(subscription!.status).toBe('bounced');
    expect(subscription!.metadata).toHaveProperty('optOutReason', 'hard-bounce');
  });

  it('handles spam complaint event', async () => {
    const email = `complainer-${Date.now()}@example.com`;
    const contact = await createContact({
      kind: 'email',
      value: email,
      source: 'signup_form',
    });

    await subscribeToList(contact.id, newsletterListId);
    await confirmSubscription(contact.id, newsletterListId);

    const request = createMockRequest([
      {
        event: 'spamreport',
        email,
      },
    ]);

    const response = await POST(request);

    expect(response.status).toBe(200);

    const subscription = await db.query.contactSubscriptions.findFirst({
      where: and(
        eq(contactSubscriptions.contactId, contact.id),
        eq(contactSubscriptions.mailingListId, newsletterListId)
      ),
    });

    expect(subscription!.status).toBe('bounced');
    expect(subscription!.metadata).toHaveProperty('optOutReason', 'spam-complaint');
    expect(subscription!.metadata).toHaveProperty('complaintType', 'spam');
  });

  it('ignores soft bounce events', async () => {
    const email = `softbounce-${Date.now()}@example.com`;
    const contact = await createContact({
      kind: 'email',
      value: email,
      source: 'signup_form',
    });

    await subscribeToList(contact.id, newsletterListId);
    await confirmSubscription(contact.id, newsletterListId);

    const request = createMockRequest([
      {
        event: 'bounce',
        email,
        type: 'soft',
        status: '4.2.2',
        reason: 'Mailbox full',
      },
    ]);

    await POST(request);

    const subscription = await db.query.contactSubscriptions.findFirst({
      where: and(
        eq(contactSubscriptions.contactId, contact.id),
        eq(contactSubscriptions.mailingListId, newsletterListId)
      ),
    });

    expect(subscription!.status).toBe('subscribed'); // Still subscribed
  });

  it('handles multiple events in single request', async () => {
    const email1 = `user1-${Date.now()}@example.com`;
    const email2 = `user2-${Date.now()}@example.com`;

    const contact1 = await createContact({
      kind: 'email',
      value: email1,
      source: 'signup_form',
    });

    const contact2 = await createContact({
      kind: 'email',
      value: email2,
      source: 'signup_form',
    });

    await subscribeToList(contact1.id, newsletterListId);
    await confirmSubscription(contact1.id, newsletterListId);

    await subscribeToList(contact2.id, newsletterListId);
    await confirmSubscription(contact2.id, newsletterListId);

    const request = createMockRequest([
      {
        event: 'bounce',
        email: email1,
        type: 'blocked',
        status: '5.1.1',
      },
      {
        event: 'spamreport',
        email: email2,
      },
    ]);

    const response = await POST(request);

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.received).toBe(true);
  });

  it('ignores events for non-existent contacts', async () => {
    const request = createMockRequest([
      {
        event: 'bounce',
        email: 'nonexistent@example.com',
        type: 'blocked',
      },
    ]);

    const response = await POST(request);

    expect(response.status).toBe(200);
    // Should not throw error
  });
});
