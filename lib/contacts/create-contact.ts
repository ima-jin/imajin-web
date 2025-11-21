import { db } from '@/db';
import { contacts } from '@/db/schema-auth';
import { eq, and } from 'drizzle-orm';
import { validateEmail, normalizeContact } from './validate-contact';

export interface CreateContactInput {
  kind: 'email' | 'phone';
  value: string;
  source: 'auth' | 'signup_form' | 'order' | 'manual' | 'import';
  userId?: string;
  isPrimary?: boolean;
  isVerified?: boolean;
  metadata?: Record<string, any>;
}

/**
 * Creates a new contact record
 */
export async function createContact(input: CreateContactInput) {
  // Validate input
  if (input.kind === 'email' && !validateEmail(input.value)) {
    throw new Error('Invalid email format');
  }

  // Normalize value
  const normalizedValue = normalizeContact(input.kind, input.value);

  // Insert contact
  const [contact] = await db
    .insert(contacts)
    .values({
      kind: input.kind,
      value: normalizedValue,
      source: input.source,
      userId: input.userId || null,
      isPrimary: input.isPrimary || false,
      isVerified: input.isVerified || false,
      metadata: input.metadata || {},
    })
    .returning();

  return contact;
}

/**
 * Creates a new contact or updates existing one
 * Useful for merging guest contacts with user accounts
 */
export async function createOrUpdateContact(input: CreateContactInput) {
  // Normalize value
  const normalizedValue = normalizeContact(input.kind, input.value);

  // Check if contact exists
  const existing = await db.query.contacts.findFirst({
    where: and(eq(contacts.kind, input.kind), eq(contacts.value, normalizedValue)),
  });

  if (existing) {
    // Update existing contact
    const [updated] = await db
      .update(contacts)
      .set({
        source: input.source,
        userId: input.userId || existing.userId,
        isPrimary: input.isPrimary !== undefined ? input.isPrimary : existing.isPrimary,
        isVerified: input.isVerified !== undefined ? input.isVerified : existing.isVerified,
        metadata: input.metadata || existing.metadata,
        updatedAt: new Date(),
      })
      .where(eq(contacts.id, existing.id))
      .returning();

    return updated;
  }

  // Create new contact
  return createContact(input);
}
