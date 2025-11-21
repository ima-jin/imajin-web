import { db } from '@/db';
import { contacts, contactSubscriptions } from '@/db/schema-auth';
import { eq, and } from 'drizzle-orm';

export interface SubscribeOptions {
  optInIp?: string;
  optInUserAgent?: string;
  autoConfirm?: boolean;
}

/**
 * Creates a subscription to a mailing list
 * @param autoConfirm - If true, immediately sets status to 'subscribed' (for default lists, auth opt-ins)
 */
export async function subscribeToList(
  contactId: string,
  mailingListId: string,
  options?: SubscribeOptions
) {
  const isAutoConfirmed = options?.autoConfirm === true;

  const [subscription] = await db
    .insert(contactSubscriptions)
    .values({
      contactId,
      mailingListId,
      status: isAutoConfirmed ? 'subscribed' : 'pending',
      optInAt: isAutoConfirmed ? new Date() : null,
      optInIp: options?.optInIp || null,
      optInUserAgent: options?.optInUserAgent || null,
      metadata: {},
    })
    .returning();

  return subscription;
}

/**
 * Confirms a pending subscription (double opt-in)
 * Also marks the contact as verified
 */
export async function confirmSubscription(contactId: string, mailingListId: string) {
  // Update subscription to subscribed
  const [subscription] = await db
    .update(contactSubscriptions)
    .set({
      status: 'subscribed',
      optInAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(contactSubscriptions.contactId, contactId),
        eq(contactSubscriptions.mailingListId, mailingListId)
      )
    )
    .returning();

  // Mark contact as verified
  await db
    .update(contacts)
    .set({
      isVerified: true,
      verifiedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(contacts.id, contactId));

  return subscription;
}

/**
 * Unsubscribes from a mailing list
 */
export async function unsubscribeFromList(
  contactId: string,
  mailingListId: string,
  reason?: string
) {
  const [subscription] = await db
    .update(contactSubscriptions)
    .set({
      status: 'unsubscribed',
      optOutAt: new Date(),
      metadata: { reason: reason || 'unspecified' },
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(contactSubscriptions.contactId, contactId),
        eq(contactSubscriptions.mailingListId, mailingListId)
      )
    )
    .returning();

  return subscription;
}
