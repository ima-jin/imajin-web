import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { contactSubscriptions } from '@/db/schema-auth';
import { eq, and } from 'drizzle-orm';
import { verifyEmail } from '@/lib/contacts/verify-email';

function htmlResponse(title: string, body: string, status = 200): NextResponse {
  const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} — Imajin</title>
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        line-height: 1.6;
        color: #333;
        max-width: 600px;
        margin: 80px auto;
        padding: 20px;
        text-align: center;
      }
      h1 { font-size: 2rem; margin-bottom: 1rem; }
      p { color: #666; }
      a { color: #000; }
    </style>
  </head>
  <body>${body}</body>
</html>`;
  return new NextResponse(html, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

function getClientIp(request: NextRequest): string | undefined {
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
      return htmlResponse(
        'Invalid Link',
        `<h1>Invalid Link</h1><p>This verification link is missing required information.</p>`,
        400
      );
    }

    // Capture metadata before verification
    const clientIp = getClientIp(request);
    const userAgent = request.headers.get('user-agent') || undefined;

    // Verify email and flip subscription to 'subscribed'
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

    return htmlResponse(
      'You are now subscribed!',
      `<h1>You are now subscribed!</h1>
      <p>Your email address has been confirmed. You&rsquo;re all set.</p>
      <p><a href="/">Back to Imajin</a></p>`
    );
  } catch (error) {
    if (error instanceof Error) {
      const message = error.message;

      if (message === 'Invalid token') {
        return htmlResponse(
          'Invalid Link',
          `<h1>Invalid Link</h1><p>This verification link is not valid. It may have already been used or is malformed.</p>`,
          400
        );
      }

      if (message === 'Token expired') {
        return htmlResponse(
          'Link Expired',
          `<h1>Link Expired</h1><p>This verification link has expired. Please subscribe again to receive a new confirmation email.</p>`,
          400
        );
      }

      if (message === 'Token already used') {
        return htmlResponse(
          'Already Subscribed',
          `<h1>Already Subscribed</h1><p>This verification link has already been used. You are already subscribed.</p>`,
          200
        );
      }
    }

    return htmlResponse(
      'Something Went Wrong',
      `<h1>Something Went Wrong</h1><p>An unexpected error occurred. Please try again later.</p>`,
      500
    );
  }
}
