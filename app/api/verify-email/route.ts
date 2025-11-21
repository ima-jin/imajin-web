import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { contactSubscriptions } from '@/db/schema-auth';
import { eq, and } from 'drizzle-orm';
import { verifyEmail } from '@/lib/contacts/verify-email';

function getClientIp(request: NextRequest): string | undefined {
  // Check common headers for client IP
  const xForwardedFor = request.headers.get('x-forwarded-for');
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim();
  }

  const xRealIp = request.headers.get('x-real-ip');
  if (xRealIp) {
    return xRealIp;
  }

  return undefined;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    // Validate token parameter
    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      );
    }

    // Capture metadata before verification
    const clientIp = getClientIp(request);
    const userAgent = request.headers.get('user-agent') || undefined;

    // Verify email
    const { contact, subscription } = await verifyEmail(token);

    // Update subscription with opt-in metadata
    await db
      .update(contactSubscriptions)
      .set({
        optInIp: clientIp || subscription.optInIp,
        optInUserAgent: userAgent || subscription.optInUserAgent,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(contactSubscriptions.contactId, contact.id),
          eq(contactSubscriptions.mailingListId, subscription.mailingListId)
        )
      );

    // Redirect to success page
    return NextResponse.redirect(
      new URL('/subscription-confirmed', request.url),
      { status: 302 }
    );
  } catch (error) {
    if (error instanceof Error) {
      const message = error.message;

      if (message === 'Invalid token') {
        return NextResponse.json(
          { error: 'Invalid token' },
          { status: 400 }
        );
      }

      if (message === 'Token expired') {
        return NextResponse.json(
          { error: 'Token expired' },
          { status: 400 }
        );
      }

      if (message === 'Token already used') {
        return NextResponse.json(
          { error: 'Token already used' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
