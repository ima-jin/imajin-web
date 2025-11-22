# contacts/verify-email

**Double opt-in email verification system for mailing list subscriptions**

## Module Overview

The `verify-email` module implements secure email verification for mailing list subscriptions. When someone signs up for updates, they receive a verification link—no subscription is activated until they click it.

This prevents spam signups and ensures compliance with email marketing regulations. The module handles token generation, expiration, and the complete verification workflow including database updates.

Use this when you need to verify email addresses before adding contacts to mailing lists, particularly for marketing communications where consent verification is required.

## Functions Reference

### createVerificationToken

**Generates a verification token for email confirmation**

#### Purpose
Creates a secure, time-limited token that links an email address to a mailing list subscription. The token expires after a set period to prevent replay attacks and maintain security.

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `contactId` | `string` | Contact ID to verify |
| `mailingListId` | `string` | Mailing list ID to subscribe to upon verification |

#### Returns
`Promise<VerificationToken>` - Token record with expiration and metadata

```typescript
{
  id: string;
  contactId: string;
  mailingListId: string;
  token: string;
  createdAt: Date;
  expiresAt: Date;
  usedAt: Date | null;
}
```

#### Example

```typescript
import { createVerificationToken } from '@/lib/contacts/verify-email';

// After creating a contact, generate verification token
const token = await createVerificationToken(
  'contact_abc123',
  'updates_general'
);

// Send verification email with token.token
const verificationUrl = `https://imajin.ca/verify-email?token=${token.token}`;
```

#### Error Handling
- Throws database errors if contact or mailing list doesn't exist
- Token generation uses cryptographically secure random values
- Each token is single-use and expires automatically

#### Implementation Notes
Tokens expire after a configured time period (typically 24 hours). The token string is URL-safe and cryptographically secure. Each verification attempt creates a new token—old tokens remain in the database for audit purposes but cannot be reused.

---

### verifyEmail

**Verifies an email using a verification token**

#### Purpose
Completes the double opt-in process by validating a verification token and activating the mailing list subscription. Updates the contact record to mark the email as verified and creates an active subscription.

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `token` | `string` | Verification token string from the email link |

#### Returns
`Promise<{ contact: Contact; subscription: Subscription }>` - Updated records after verification

```typescript
{
  contact: {
    id: string;
    userId: string | null;
    kind: string;
    value: string;
    isPrimary: boolean;
    isVerified: boolean;  // Now true
    verifiedAt: Date | null;  // Now set
    source: string;
    metadata: ContactMetadata | null;
    createdAt: Date;
    updatedAt: Date;
  };
  subscription: {
    id: string;
    contactId: string;
    mailingListId: string;
    status: string;  // Now 'active'
    optInAt: Date | null;  // Now set
    optOutAt: Date | null;
    optInIp: string | null;
    optInUserAgent: string | null;
    metadata: SubscriptionMetadata | null;
    createdAt: Date;
    updatedAt: Date;
  };
}
```

#### Example

```typescript
import { verifyEmail } from '@/lib/contacts/verify-email';

// In your verification endpoint
export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  
  if (!token) {
    return new Response('Missing token', { status: 400 });
  }
  
  try {
    const result = await verifyEmail(token);
    
    // Verification successful
    return new Response('Email verified! You\'re now subscribed to updates.', {
      status: 200
    });
  } catch (error) {
    return new Response('Invalid or expired token', { status: 400 });
  }
}
```

#### Error Handling
- **Invalid token**: Throws error if token doesn't exist in database
- **Expired token**: Throws error if token is past expiration time
- **Already used**: Throws error if token was previously consumed
- **Database constraints**: Throws error if contact or mailing list was deleted

Handle errors gracefully in your UI—show clear messages about expired links and offer to resend verification emails.

#### Implementation Notes
The verification process runs in a database transaction to ensure atomicity. If any step fails, no changes are committed. The token is marked as used (`usedAt` timestamp) to prevent replay attacks. Contact verification status and subscription activation happen simultaneously.

## Common Patterns

### Complete Double Opt-In Flow

```typescript
// 1. User submits email on website
const contact = await createContact({
  kind: 'email',
  value: 'user@example.com',
  source: 'newsletter_signup'
});

// 2. Generate verification token
const token = await createVerificationToken(
  contact.id,
  'updates_general'
);

// 3. Send verification email (your email service)
await sendVerificationEmail(contact.value, token.token);

// 4. User clicks link, verification endpoint processes
const verified = await verifyEmail(token.token);

// 5. User is now subscribed and can receive emails
```

### Token Expiration Handling

Check token expiration before attempting verification to provide better user experience:

```typescript
// In your verification handler
try {
  const result = await verifyEmail(token);
  return { success: true, message: 'Email verified successfully!' };
} catch (error) {
  if (error.message.includes('expired')) {
    return { 
      success: false, 
      message: 'Verification link expired. Request a new one.',
      canResend: true 
    };
  }
  return { success: false, message: 'Invalid verification link.' };
}
```

### Best Practices

- **Generate tokens immediately** after contact creation—don't delay the verification email
- **Set clear expiration times**—24 hours is typical, but adjust based on your audience
- **Provide resend mechanisms**—users often need new verification links
- **Log verification attempts**—useful for debugging and compliance audits
- **Handle edge cases gracefully**—deleted contacts, changed email addresses, etc.

## Error Scenarios

### Token Not Found
User clicks an invalid or malformed verification link. Show friendly error message and offer to resend.

### Token Expired
Common scenario—users often verify emails days later. Provide clear messaging and resend option.

### Already Verified
If the same token is used twice, the second attempt fails. Check if the contact is already verified and show appropriate success message.

### Contact Deleted
Rare edge case where the contact was deleted between token generation and verification. Handle gracefully with generic error message.

## Related Modules

- **contacts/create-contact** - Creates the initial contact record before verification
- **mailing-lists/manage** - Manages the mailing lists that contacts subscribe to
- **email/notifications** - Sends the actual verification emails with tokens

This module fits into the broader contact management system, providing the security layer between contact creation and active subscription status.