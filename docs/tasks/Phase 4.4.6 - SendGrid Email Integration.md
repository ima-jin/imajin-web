# Phase 4.4.6: SendGrid Email Integration

**Status:** Ready for Implementation 🟡
**Estimated Effort:** 3 hours
**Dependencies:** Phase 4.4.5 complete (Auth flow integrated)
**Next Phase:** Phase 4.4.7 (Testing)

---

## Overview

Integrate SendGrid for email verification and password reset functionality. Set up email templates, configure sender authentication, and implement email sending logic.

**Email Types:**
1. Email verification (signup)
2. Password reset
3. Welcome email (optional)

---

## SendGrid Setup

### Create Account & API Key

1. Sign up at https://sendgrid.com (free tier: 100 emails/day)
2. Verify sender identity: `noreply@imajin.ca`
3. Create API key with "Mail Send" permission
4. Add to environment variables

### Sender Authentication

**Domain Authentication (Recommended):**
- Add DNS records to imajin.ca domain
- Improves deliverability
- Removes "via sendgrid.net" in email clients

**Single Sender Verification (Quick Start):**
- Verify single email address
- Click confirmation link sent to noreply@imajin.ca
- Good for development/testing

---

## Environment Variables

**File:** `.env.local`

```bash
# SendGrid
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@imajin.ca

# Base URL for email links
NEXT_PUBLIC_BASE_URL=http://localhost:30000
```

**File:** `.env.example`

```bash
# SendGrid Email Service
SENDGRID_API_KEY=your_sendgrid_api_key_here
EMAIL_FROM=noreply@imajin.ca
NEXT_PUBLIC_BASE_URL=http://localhost:30000
```

---

## SendGrid Client

**Install:**

```bash
npm install @sendgrid/mail
```

**File:** `lib/email/sendgrid.ts`

```typescript
import sgMail from '@sendgrid/mail';

// Initialize SendGrid with API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export type EmailOptions = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

/**
 * Send email via SendGrid
 * @param options - Email options
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  const { to, subject, html, text } = options;

  try {
    await sgMail.send({
      to,
      from: process.env.EMAIL_FROM!,
      subject,
      html,
      text: text || stripHtml(html), // Fallback to stripped HTML
    });

    console.log(`Email sent to ${to}: ${subject}`);
  } catch (error) {
    console.error('SendGrid error:', error);
    throw new Error('Failed to send email');
  }
}

/**
 * Strip HTML tags for plain text fallback
 * @param html - HTML string
 * @returns Plain text
 */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

/**
 * Send email verification
 * @param to - Recipient email
 * @param verificationUrl - Verification link
 */
export async function sendVerificationEmail(
  to: string,
  verificationUrl: string
): Promise<void> {
  const template = getVerificationEmailTemplate(verificationUrl);
  await sendEmail({
    to,
    subject: template.subject,
    html: template.html,
  });
}

/**
 * Send password reset email
 * @param to - Recipient email
 * @param resetUrl - Password reset link
 */
export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string
): Promise<void> {
  const template = getPasswordResetEmailTemplate(resetUrl);
  await sendEmail({
    to,
    subject: template.subject,
    html: template.html,
  });
}

/**
 * Send welcome email (optional)
 * @param to - Recipient email
 * @param name - User's name
 */
export async function sendWelcomeEmail(
  to: string,
  name: string
): Promise<void> {
  const template = getWelcomeEmailTemplate(name);
  await sendEmail({
    to,
    subject: template.subject,
    html: template.html,
  });
}
```

---

## Email Templates

**File:** `lib/email/templates.ts`

```typescript
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:30000';

type EmailTemplate = {
  subject: string;
  html: string;
};

/**
 * Email verification template
 */
export function getVerificationEmailTemplate(
  verificationUrl: string
): EmailTemplate {
  return {
    subject: 'Verify your email - Imajin',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .button {
              display: inline-block;
              background: #000;
              color: #fff !important;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 4px;
              margin: 20px 0;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #eee;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <h1>Verify Your Email</h1>
          <p>Thank you for signing up for Imajin! Click the button below to verify your email address:</p>

          <a href="${verificationUrl}" class="button">Verify Email</a>

          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${verificationUrl}</p>

          <p>This link expires in 24 hours.</p>

          <div class="footer">
            <p>If you didn't create an account with Imajin, you can safely ignore this email.</p>
            <p>© ${new Date().getFullYear()} Imajin. All rights reserved.</p>
          </div>
        </body>
      </html>
    `,
  };
}

/**
 * Password reset template
 */
export function getPasswordResetEmailTemplate(resetUrl: string): EmailTemplate {
  return {
    subject: 'Reset your password - Imajin',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .button {
              display: inline-block;
              background: #000;
              color: #fff !important;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 4px;
              margin: 20px 0;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #eee;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <h1>Reset Your Password</h1>
          <p>You requested to reset your password. Click the button below to set a new password:</p>

          <a href="${resetUrl}" class="button">Reset Password</a>

          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${resetUrl}</p>

          <p>This link expires in 1 hour.</p>

          <div class="footer">
            <p>If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.</p>
            <p>© ${new Date().getFullYear()} Imajin. All rights reserved.</p>
          </div>
        </body>
      </html>
    `,
  };
}

/**
 * Welcome email template (optional)
 */
export function getWelcomeEmailTemplate(name: string): EmailTemplate {
  return {
    subject: 'Welcome to Imajin!',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .button {
              display: inline-block;
              background: #000;
              color: #fff !important;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 4px;
              margin: 20px 0;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #eee;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <h1>Welcome to Imajin, ${name}!</h1>
          <p>Thank you for creating an account. We're excited to have you join us.</p>

          <p>Explore our collection of modular LED fixtures:</p>

          <a href="${BASE_URL}/shop" class="button">Start Shopping</a>

          <p>If you have any questions, feel free to contact us.</p>

          <div class="footer">
            <p>© ${new Date().getFullYear()} Imajin. All rights reserved.</p>
          </div>
        </body>
      </html>
    `,
  };
}
```

---

## Email Verification Flow

### Update Signup API

**File:** `app/api/auth/signup/route.ts`

```typescript
import { sendVerificationEmail } from '@/lib/email/sendgrid';
import { randomBytes } from 'crypto';

export async function POST(request: NextRequest) {
  // ... existing validation

  // Create user
  const [newUser] = await db.insert(users).values({
    email,
    passwordHash,
    name,
    role: 'customer',
    emailVerified: null, // Not verified yet
  }).returning();

  // Generate verification token
  const token = randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  // Store verification token
  await db.insert(verificationTokens).values({
    identifier: email,
    token,
    expires,
  });

  // Send verification email
  const verificationUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/auth/verify/${token}?email=${encodeURIComponent(email)}`;
  await sendVerificationEmail(email, verificationUrl);

  return NextResponse.json(
    { message: 'User created successfully. Please check your email to verify your account.' },
    { status: 201 }
  );
}
```

### Verification Handler

**File:** `app/auth/verify/[token]/page.tsx`

```typescript
import { db } from '@/db';
import { users, verificationTokens } from '@/db/schema';
import { eq, and, gt } from 'drizzle-orm';
import { notFound, redirect } from 'next/navigation';
import { Container } from '@/components/ui/Container';
import { Heading } from '@/components/ui/Heading';

export default async function VerifyTokenPage({
  params,
  searchParams,
}: {
  params: { token: string };
  searchParams: { email?: string };
}) {
  const { token } = params;
  const email = searchParams.email;

  if (!email) {
    notFound();
  }

  // Find valid token
  const verificationToken = await db.query.verificationTokens.findFirst({
    where: and(
      eq(verificationTokens.identifier, email),
      eq(verificationTokens.token, token),
      gt(verificationTokens.expires, new Date())
    ),
  });

  if (!verificationToken) {
    return (
      <Container className="py-12">
        <div className="max-w-md mx-auto text-center">
          <Heading level={1} className="mb-4">
            Invalid or Expired Link
          </Heading>
          <p className="text-gray-600 mb-6">
            This verification link is invalid or has expired.
          </p>
          <a
            href="/auth/signin"
            className="inline-block bg-black text-white px-6 py-2 rounded hover:bg-gray-800"
          >
            Back to Sign In
          </a>
        </div>
      </Container>
    );
  }

  // Update user as verified
  await db
    .update(users)
    .set({ emailVerified: new Date() })
    .where(eq(users.email, email));

  // Delete used token
  await db
    .delete(verificationTokens)
    .where(and(
      eq(verificationTokens.identifier, email),
      eq(verificationTokens.token, token)
    ));

  // Success - redirect to sign in
  redirect('/auth/signin?verified=true');
}
```

---

## Password Reset Flow

### Reset Request API

**File:** `app/api/auth/reset-password/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, verificationTokens } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import { sendPasswordResetEmail } from '@/lib/email/sendgrid';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if user exists (don't reveal if email exists or not - security)
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    // Always return success even if user doesn't exist
    // This prevents email enumeration attacks
    if (!user) {
      return NextResponse.json(
        { message: 'If that email exists, a reset link has been sent.' },
        { status: 200 }
      );
    }

    // Generate reset token
    const token = randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store reset token
    await db.insert(verificationTokens).values({
      identifier: email,
      token,
      expires,
    });

    // Send reset email
    const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/auth/reset-password/${token}?email=${encodeURIComponent(email)}`;
    await sendPasswordResetEmail(email, resetUrl);

    return NextResponse.json(
      { message: 'If that email exists, a reset link has been sent.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Reset Form Page

**File:** `app/auth/reset-password/[token]/page.tsx`

```typescript
import { db } from '@/db';
import { verificationTokens } from '@/db/schema';
import { eq, and, gt } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { Container } from '@/components/ui/Container';
import { Heading } from '@/components/ui/Heading';
import { ResetPasswordTokenForm } from '@/components/auth/ResetPasswordTokenForm';

export default async function ResetPasswordTokenPage({
  params,
  searchParams,
}: {
  params: { token: string };
  searchParams: { email?: string };
}) {
  const { token } = params;
  const email = searchParams.email;

  if (!email) {
    notFound();
  }

  // Verify token exists and is valid
  const verificationToken = await db.query.verificationTokens.findFirst({
    where: and(
      eq(verificationTokens.identifier, email),
      eq(verificationTokens.token, token),
      gt(verificationTokens.expires, new Date())
    ),
  });

  if (!verificationToken) {
    return (
      <Container className="py-12">
        <div className="max-w-md mx-auto text-center">
          <Heading level={1} className="mb-4">
            Invalid or Expired Link
          </Heading>
          <p className="text-gray-600 mb-6">
            This password reset link is invalid or has expired.
          </p>
          <a
            href="/auth/reset-password"
            className="inline-block bg-black text-white px-6 py-2 rounded hover:bg-gray-800"
          >
            Request New Link
          </a>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-12">
      <div className="max-w-md mx-auto">
        <Heading level={1} className="text-center mb-8">
          Set New Password
        </Heading>
        <div className="bg-white border rounded-lg p-6">
          <ResetPasswordTokenForm token={token} email={email} />
        </div>
      </div>
    </Container>
  );
}
```

**File:** `components/auth/ResetPasswordTokenForm.tsx`

```typescript
'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/form/Input';
import { Label } from '@/components/ui/form/Label';
import { validatePasswordStrength } from '@/lib/auth/password';

export function ResetPasswordTokenForm({
  token,
  email,
}: {
  token: string;
  email: string;
}) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors([]);
    setLoading(true);

    // Validate passwords match
    if (password !== confirmPassword) {
      setErrors(['Passwords do not match']);
      setLoading(false);
      return;
    }

    // Validate password strength
    const validation = validatePasswordStrength(password);
    if (!validation.valid) {
      setErrors(validation.errors);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/reset-password/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, email, password }),
      });

      if (response.ok) {
        router.push('/auth/signin?reset=success');
      } else {
        const data = await response.json();
        setErrors([data.error || 'Something went wrong']);
      }
    } catch (err) {
      setErrors(['Something went wrong. Please try again.']);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          <ul className="text-sm space-y-1">
            {errors.map((error, i) => (
              <li key={i}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <Label htmlFor="password">New Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
        />
      </div>

      <div>
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <Input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          disabled={loading}
        />
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Resetting...' : 'Reset Password'}
      </Button>
    </form>
  );
}
```

**File:** `app/api/auth/reset-password/confirm/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, verificationTokens } from '@/db/schema';
import { eq, and, gt } from 'drizzle-orm';
import { hashPassword, validatePasswordStrength } from '@/lib/auth/password';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, email, password } = body;

    if (!token || !email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate password strength
    const validation = validatePasswordStrength(password);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.errors.join(', ') },
        { status: 400 }
      );
    }

    // Verify token
    const verificationToken = await db.query.verificationTokens.findFirst({
      where: and(
        eq(verificationTokens.identifier, email),
        eq(verificationTokens.token, token),
        gt(verificationTokens.expires, new Date())
      ),
    });

    if (!verificationToken) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 400 }
      );
    }

    // Hash new password
    const passwordHash = await hashPassword(password);

    // Update user password
    await db
      .update(users)
      .set({ passwordHash })
      .where(eq(users.email, email));

    // Delete used token
    await db
      .delete(verificationTokens)
      .where(and(
        eq(verificationTokens.identifier, email),
        eq(verificationTokens.token, token)
      ));

    return NextResponse.json(
      { message: 'Password reset successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Password reset confirm error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## Implementation Steps

### Step 1: SendGrid Setup (20 min)

- [ ] Create SendGrid account
- [ ] Verify sender identity (noreply@imajin.ca)
- [ ] Create API key
- [ ] Add to .env.local
- [ ] Test API key with curl

### Step 2: Email Client (30 min)

- [ ] Install @sendgrid/mail
- [ ] Create sendgrid.ts client
- [ ] Create email templates
- [ ] Test send function manually

### Step 3: Email Verification (45 min)

- [ ] Update signup API to send verification
- [ ] Create verification handler page
- [ ] Test verification flow
- [ ] Handle expired tokens

### Step 4: Password Reset (60 min)

- [ ] Create reset request API
- [ ] Create reset form page
- [ ] Create reset confirm API
- [ ] Test reset flow
- [ ] Handle expired tokens

### Step 5: Testing (45 min)

- [ ] Test email delivery (check spam folder)
- [ ] Test verification link click
- [ ] Test password reset link click
- [ ] Test expired tokens
- [ ] Test email formatting (multiple clients)

---

## Acceptance Criteria

- [ ] SendGrid configured and working
- [ ] Verification email sends on signup
- [ ] Verification link verifies account
- [ ] Password reset email sends
- [ ] Password reset link works
- [ ] Expired tokens handled gracefully
- [ ] Emails render correctly (HTML + plain text)
- [ ] No sensitive info leaked in error messages

---

## Testing

### Manual Testing Checklist

**Email Verification:**
- [ ] Sign up → Verification email received
- [ ] Click link → Account verified
- [ ] Try expired link → Error message
- [ ] Try invalid link → Error message

**Password Reset:**
- [ ] Request reset → Email received
- [ ] Click link → Reset form loads
- [ ] Set new password → Success
- [ ] Sign in with new password → Works
- [ ] Try expired link → Error message

**Email Formatting:**
- [ ] Gmail renders correctly
- [ ] Outlook renders correctly
- [ ] Mobile email clients render correctly
- [ ] Plain text fallback works

---

## Next Steps

After Phase 4.4.6 complete:
1. **Phase 4.4.7:** Comprehensive testing (unit, integration, E2E)

---

**See Also:**
- `docs/tasks/Phase 4.4.5 - Integration with Existing Features.md` - Previous phase
- `docs/tasks/Phase 4.4.7 - Testing.md` - Next phase
- SendGrid documentation: https://docs.sendgrid.com
