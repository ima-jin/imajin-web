import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { contactSubscriptions } from '@/db/schema-auth';
import { eq, and } from 'drizzle-orm';
import { unsubscribeFromList } from '@/lib/contacts/subscribe';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contactId, mailingListId, reason } = body;

    // Check if subscription exists
    const subscription = await db.query.contactSubscriptions.findFirst({
      where: and(
        eq(contactSubscriptions.contactId, contactId),
        eq(contactSubscriptions.mailingListId, mailingListId)
      ),
    });

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    // Unsubscribe
    await unsubscribeFromList(contactId, mailingListId, reason);

    return NextResponse.json(
      {
        success: true,
        message: 'Successfully unsubscribed from mailing list',
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
