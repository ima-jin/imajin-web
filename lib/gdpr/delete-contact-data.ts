/**
 * GDPR Data Deletion - Right to be Forgotten
 * Deletes all contact-related data for a user
 */

import { db } from '@/db';
import { contacts } from '@/db/schema-auth';
import { eq } from 'drizzle-orm';
import { logger } from '@/lib/utils/logger';

export async function deleteContactData(userId: string): Promise<void> {
  logger.info('GDPR: Deleting contact data', { userId });

  // Delete all contacts for the user
  // Subscriptions will cascade delete due to foreign key constraints
  const deleted = await db
    .delete(contacts)
    .where(eq(contacts.userId, userId))
    .returning();

  logger.info('GDPR: Contact data deleted', {
    userId,
    contactsDeleted: deleted.length,
  });
}
