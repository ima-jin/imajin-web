/**
 * Email verification token generation and validation
 */

import { db } from '@/db';
import { contacts, contactVerificationTokens, contactSubscriptions } from '@/db/schema-auth';
import { eq, and, gt } from 'drizzle-orm';
import { randomBytes } from 'crypto';

const TOKEN_EXPIRY_HOURS = 24;
const RATE_LIMIT_WINDOW_MINUTES = 1;
const MAX_TOKENS_PER_WINDOW = 3;

/**
 * Generate a verification token for email confirmation
 * @param contactId - Contact to verify
 * @param mailingListId - Mailing list to subscribe to upon verification
 * @returns Token record
 */
export async function createVerificationToken(
  contactId: string,
  mailingListId: string
) {
  // Rate limiting: check recent token generation
  const rateLimitTime = new Date(Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000);
  const recentTokens = await db.query.contactVerificationTokens.findMany({
    where: and(
      eq(contactVerificationTokens.contactId, contactId),
      gt(contactVerificationTokens.createdAt, rateLimitTime)
    ),
  });

  if (recentTokens.length >= MAX_TOKENS_PER_WINDOW) {
    throw new Error('Too many verification requests. Please try again later.');
  }

  // Generate secure random token
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

  const [tokenRecord] = await db
    .insert(contactVerificationTokens)
    .values({
      contactId,
      mailingListId,
      token,
      expiresAt,
    })
    .returning();

  return tokenRecord;
}

/**
 * Verify an email using a verification token
 * @param token - Verification token string
 * @returns Contact and subscription records after verification
 */
export async function verifyEmail(token: string) {
  // Find token
  const tokenRecord = await db.query.contactVerificationTokens.findFirst({
    where: eq(contactVerificationTokens.token, token),
  });

  if (!tokenRecord) {
    throw new Error('Invalid token');
  }

  // Check if already used
  if (tokenRecord.usedAt) {
    throw new Error('Token already used');
  }

  // Check if expired
  if (new Date() > tokenRecord.expiresAt) {
    throw new Error('Token expired');
  }

  // Mark contact as verified
  const [updatedContact] = await db
    .update(contacts)
    .set({
      isVerified: true,
      verifiedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(contacts.id, tokenRecord.contactId))
    .returning();

  // Update subscription status to subscribed
  const [updatedSubscription] = await db
    .update(contactSubscriptions)
    .set({
      status: 'subscribed',
      optInAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(contactSubscriptions.contactId, tokenRecord.contactId),
        eq(contactSubscriptions.mailingListId, tokenRecord.mailingListId)
      )
    )
    .returning();

  // Mark token as used
  await db
    .update(contactVerificationTokens)
    .set({ usedAt: new Date() })
    .where(eq(contactVerificationTokens.id, tokenRecord.id));

  return {
    contact: updatedContact,
    subscription: updatedSubscription,
  };
}
