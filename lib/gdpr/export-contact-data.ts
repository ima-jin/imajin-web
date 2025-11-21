/**
 * GDPR Data Export - Right to Data Portability
 * Exports all contact-related data for a user
 */

import { db } from '@/db';
import { contacts, contactSubscriptions, mailingLists } from '@/db/schema-auth';
import { eq } from 'drizzle-orm';

export interface ContactExport {
  value: string;
  kind: string;
  isVerified: boolean;
  verifiedAt: Date | null;
  source: string;
  createdAt: Date;
  subscriptions: SubscriptionExport[];
}

export interface SubscriptionExport {
  list: string;
  status: string;
  optInAt: Date | null;
  optOutAt: Date | null;
  metadata: Record<string, unknown>;
}

export interface ContactDataExport {
  userId: string;
  exportDate: Date;
  contacts: ContactExport[];
}

export async function exportContactData(userId: string): Promise<ContactDataExport> {
  // Get all contacts for the user
  const userContacts = await db.query.contacts.findMany({
    where: eq(contacts.userId, userId),
  });

  const contactsWithSubscriptions: ContactExport[] = [];

  for (const contact of userContacts) {
    // Get all subscriptions for this contact
    const subscriptions = await db.query.contactSubscriptions.findMany({
      where: eq(contactSubscriptions.contactId, contact.id),
      with: {
        mailingList: true,
      },
    });

    const subscriptionExports: SubscriptionExport[] = subscriptions.map(sub => ({
      list: sub.mailingList.name,
      status: sub.status,
      optInAt: sub.optInAt,
      optOutAt: sub.optOutAt,
      metadata: sub.metadata || {},
    }));

    contactsWithSubscriptions.push({
      value: contact.value,
      kind: contact.kind,
      isVerified: contact.isVerified,
      verifiedAt: contact.verifiedAt,
      source: contact.source,
      createdAt: contact.createdAt,
      subscriptions: subscriptionExports,
    });
  }

  return {
    userId,
    exportDate: new Date(),
    contacts: contactsWithSubscriptions,
  };
}
