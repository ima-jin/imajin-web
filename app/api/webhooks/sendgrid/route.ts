import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { contacts, contactSubscriptions } from '@/db/schema-auth';
import { eq } from 'drizzle-orm';
import { logger } from '@/lib/utils/logger';

interface SendGridEvent {
  event: string;
  email: string;
  type?: string;
  status?: string;
  reason?: string;
}

interface Contact {
  id: string;
  value: string;
  metadata: Record<string, unknown>;
  [key: string]: unknown;
}

async function handleHardBounce(contact: Contact, event: SendGridEvent): Promise<void> {
  logger.info('Processing hard bounce', {
    contactId: contact.id,
    email: event.email,
    status: event.status,
    reason: event.reason,
  });

  // Update contact to mark as bounced
  await db
    .update(contacts)
    .set({
      isVerified: false,
      metadata: {
        ...contact.metadata,
        bounceType: 'hard',
      },
      updatedAt: new Date(),
    })
    .where(eq(contacts.id, contact.id));

  // Update all subscriptions for this contact
  await db
    .update(contactSubscriptions)
    .set({
      status: 'bounced',
      metadata: {
        optOutReason: 'hard-bounce',
      },
      updatedAt: new Date(),
    })
    .where(eq(contactSubscriptions.contactId, contact.id));
}

async function handleSpamComplaint(contact: Contact, event: SendGridEvent): Promise<void> {
  logger.info('Processing spam complaint', {
    contactId: contact.id,
    email: event.email,
  });

  // Update all subscriptions for this contact
  await db
    .update(contactSubscriptions)
    .set({
      status: 'bounced',
      metadata: {
        optOutReason: 'spam-complaint',
        complaintType: 'spam',
      },
      updatedAt: new Date(),
    })
    .where(eq(contactSubscriptions.contactId, contact.id));
}

export async function POST(request: NextRequest) {
  try {
    const events: SendGridEvent[] = await request.json();

    logger.info('Received SendGrid webhook events', { count: events.length });

    for (const event of events) {
      // Find contact by email
      const contact = await db.query.contacts.findFirst({
        where: eq(contacts.value, event.email.toLowerCase()),
      });

      // Skip if contact doesn't exist
      if (!contact) {
        logger.debug('Ignoring event for non-existent contact', {
          email: event.email,
          event: event.event,
        });
        continue;
      }

      // Handle hard bounce (type !== 'soft')
      if (event.event === 'bounce' && event.type !== 'soft') {
        await handleHardBounce(contact, event);
      }

      // Handle spam complaint
      else if (event.event === 'spamreport') {
        await handleSpamComplaint(contact, event);
      }

      // Soft bounces are ignored (no action taken)
      else if (event.event === 'bounce' && event.type === 'soft') {
        logger.debug('Ignoring soft bounce', {
          email: event.email,
          reason: event.reason,
        });
      }
    }

    return NextResponse.json(
      {
        received: true,
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('Error processing SendGrid webhook', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
