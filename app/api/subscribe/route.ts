import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { contacts, mailingLists, contactSubscriptions } from '@/db/schema-auth';
import { eq, and } from 'drizzle-orm';
import { createOrUpdateContact } from '@/lib/contacts/create-contact';
import { subscribeToList } from '@/lib/contacts/subscribe';
import { createVerificationToken } from '@/lib/contacts/verify-email';
import { validateEmail, normalizeContact } from '@/lib/contacts/validate-contact';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email: rawEmail, mailingListId } = body;

    // Normalize and validate email
    if (!rawEmail) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    const email = normalizeContact('email', rawEmail);

    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Check if mailing list exists
    const mailingList = await db.query.mailingLists.findFirst({
      where: eq(mailingLists.id, mailingListId),
    });

    if (!mailingList) {
      return NextResponse.json(
        { error: 'Mailing list not found' },
        { status: 404 }
      );
    }

    // Check if contact already exists
    let contact = await db.query.contacts.findFirst({
      where: eq(contacts.value, email),
    });

    if (!contact) {
      // Create new contact
      contact = await createOrUpdateContact({
        kind: 'email',
        value: email,
        source: 'signup_form',
      });
    }

    // Check if already subscribed to this list
    const existingSubscription = await db.query.contactSubscriptions.findFirst({
      where: and(
        eq(contactSubscriptions.contactId, contact.id),
        eq(contactSubscriptions.mailingListId, mailingListId)
      ),
    });

    if (existingSubscription) {
      if (existingSubscription.status === 'subscribed') {
        return NextResponse.json(
          {
            success: true,
            message: 'You are already subscribed to this list',
          },
          { status: 200 }
        );
      }

      if (existingSubscription.status === 'pending') {
        return NextResponse.json(
          {
            success: true,
            message: 'Verification email already sent. Please check your inbox.',
          },
          { status: 200 }
        );
      }

      // If unsubscribed, update to pending
      await db
        .update(contactSubscriptions)
        .set({
          status: 'pending',
          optInAt: null,
          optOutAt: null,
          updatedAt: new Date(),
        })
        .where(eq(contactSubscriptions.id, existingSubscription.id));
    } else {
      // Create new pending subscription
      await subscribeToList(contact.id, mailingListId);
    }

    // Create verification token
    await createVerificationToken(contact.id, mailingListId);

    // TODO: Send verification email via SendGrid (Step 9)

    return NextResponse.json(
      {
        success: true,
        message: 'Please check your email to confirm your subscription',
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes('Too many verification requests')) {
      return NextResponse.json(
        { error: error.message },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
