/**
 * Sync Ory Kratos identities to local contacts database
 */

import { db } from '@/db';
import { contacts, mailingLists } from '@/db/schema-auth';
import { eq } from 'drizzle-orm';
import { createOrUpdateContact } from './create-contact';
import { subscribeToList } from './subscribe';

/**
 * Sync Ory identity to local contacts database
 * Called when:
 * - User signs up (new identity)
 * - User verifies email in Ory
 * - User adds additional email addresses
 *
 * @param userId - Ory Kratos identity ID
 * @param email - Email address from Ory
 * @param newsletterOptIn - Whether user opted into newsletter during signup
 * @returns Contact ID
 */
export async function syncOryContactToLocal(
  userId: string,
  email: string,
  newsletterOptIn: boolean = false
): Promise<string> {
  // Check if contact already exists with this email
  const existingContact = await db.query.contacts.findFirst({
    where: eq(contacts.value, email.toLowerCase()),
  });

  let contactId: string;

  if (existingContact) {
    // Link existing guest contact to user
    const [updatedContact] = await db
      .update(contacts)
      .set({
        userId,
        isPrimary: true,
        isVerified: true, // Ory has verified this email
        verifiedAt: new Date(),
        source: 'auth', // Update source to reflect Ory auth
        updatedAt: new Date(),
      })
      .where(eq(contacts.id, existingContact.id))
      .returning();

    contactId = updatedContact.id;
  } else {
    // Create new contact linked to user
    const newContact = await createOrUpdateContact({
      kind: 'email',
      value: email,
      source: 'auth',
      userId,
      isPrimary: true,
      isVerified: true, // Ory has verified this email
    });

    contactId = newContact.id;
  }

  // Auto-subscribe to default lists (e.g., order-updates)
  const defaultLists = await db.query.mailingLists.findMany({
    where: eq(mailingLists.isDefault, true),
  });

  for (const list of defaultLists) {
    await subscribeToList(contactId, list.id, {
      autoConfirm: true, // Default lists are auto-confirmed
    });
  }

  // Subscribe to newsletter if user opted in during signup
  if (newsletterOptIn) {
    const newsletterList = await db.query.mailingLists.findFirst({
      where: eq(mailingLists.slug, 'newsletter'),
    });

    if (newsletterList) {
      await subscribeToList(contactId, newsletterList.id, {
        autoConfirm: true, // Opt-in during signup is auto-confirmed
      });
    }
  }

  return contactId;
}
