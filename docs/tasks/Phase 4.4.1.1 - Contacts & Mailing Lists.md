# Phase 4.4.1.1: Contacts & Mailing Lists Schema

**Status:** Ready for Grooming 🟡
**Estimated Effort:** 3 hours
**Dependencies:** Phase 4.4.1 core tables (users, user_collectives)
**Next Phase:** Phase 4.4.2 (Ory Kratos Setup)

**Grooming Status:**
- ✅ All tests enumerated (85 tests with specific assertions)
- ✅ Test count summary table included
- ✅ TDD workflow (RED-GREEN-REFACTOR) for each implementation step
- ✅ Phase gate criteria defined (measurable completion requirements)
- 🔄 **Ready for doctor review**

---

## Overview

Create database schema for managing contact information (email/phone) and mailing list subscriptions that supports both authenticated users and guest contacts. Enables GDPR-compliant email marketing, product alerts, and SMS notifications while maintaining clear consent tracking.

**Key Design Principles:**
1. **Contacts can exist without accounts** - Marketing signups before user registration
2. **Multiple contacts per user** - Support alternate emails/phones
3. **Explicit consent tracking** - GDPR/CAN-SPAM compliance with audit trail
4. **Status-driven workflow** - pending → subscribed → unsubscribed → bounced
5. **Merge-friendly** - When guest creates account, merge contact records

**Why This Matters:**
- Enables pre-launch email capture (build audience before auth is required)
- Supports email marketing (newsletter, product announcements)
- Tracks consent explicitly (GDPR right-to-be-forgotten, opt-out)
- Prevents sending to bounced/complained emails
- Foundation for SMS notifications (future)

**Why Now:**
- Should be implemented BEFORE Phase 4.4.3 (Auth UI) so signup forms can capture opt-ins
- Blocks footer email signup widget
- Blocks "notify when available" product alerts
- Blocks checkout email marketing opt-in

---

## Architecture

### Integration with Auth System

```
┌─────────────────────────────────────────────────┐
│ Ory Kratos Identity (external)                  │
│   email: user@example.com                       │
│   email_verified: true                          │
└────────────────┬────────────────────────────────┘
                 │ webhook sync
                 ↓
┌─────────────────────────────────────────────────┐
│ users (local shadow)                            │
│   kratos_id: uuid                               │
│   email: user@example.com                       │
│   role: customer                                │
└────────────────┬────────────────────────────────┘
                 │ has many
                 ↓
┌─────────────────────────────────────────────────┐
│ contacts                                        │
│   user_id: uuid (nullable)                      │
│   kind: 'email' | 'phone'                       │
│   value: 'user@example.com'                     │
│   is_primary: true                              │
│   is_verified: true                             │
│   source: 'auth' | 'signup_form' | 'order'      │
└────────────────┬────────────────────────────────┘
                 │ has many
                 ↓
┌─────────────────────────────────────────────────┐
│ contact_subscriptions                           │
│   contact_id: uuid                              │
│   mailing_list_id: uuid                         │
│   status: 'pending' | 'subscribed' | ...        │
│   opt_in_at: timestamp                          │
│   opt_in_ip: text (GDPR audit)                  │
└─────────────────────────────────────────────────┘
```

**Contact Lifecycle:**

1. **Guest Signup** (no account)
   - Create contact with `user_id = NULL`
   - Create subscription with `status = 'pending'`
   - Send double opt-in email
   - On confirm: Set `status = 'subscribed'`, `is_verified = true`

2. **Auth Signup** (Ory registration)
   - Ory creates identity → webhook → create user
   - Check if contact exists with same email
     - **If exists:** Link contact to user (`user_id = userId`), set as primary
     - **If not:** Create new contact with `user_id = userId`, `source = 'auth'`
   - If user opted in during signup: Create subscription with `status = 'pending'`

3. **Order Checkout** (guest or authenticated)
   - Create/upsert contact with email from order
   - If guest checked "subscribe to newsletter": Create subscription
   - Source: `'order'`

4. **Account Settings** (authenticated users)
   - User can add alternate emails/phones
   - User can set primary contact per kind
   - User can manage subscriptions per contact

---

## Database Schema

### contacts Table

**Purpose:** Store email addresses and phone numbers that can be linked to users or exist standalone (guest signups).

```sql
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,  -- nullable for guests

  kind TEXT NOT NULL CHECK (kind IN ('email', 'phone')),
  value TEXT NOT NULL,  -- Email (lowercased) or phone (E.164 format)

  is_primary BOOLEAN NOT NULL DEFAULT false,  -- One primary per user+kind
  is_verified BOOLEAN NOT NULL DEFAULT false,
  verified_at TIMESTAMP,

  source TEXT NOT NULL CHECK (source IN ('auth', 'signup_form', 'order', 'manual', 'import')),

  metadata JSONB DEFAULT '{}'::jsonb,  -- Bounce codes, locale, carrier info, etc.

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Constraints
  UNIQUE (value, kind)  -- Same email/phone can't exist twice
);

-- Indexes
CREATE INDEX idx_contacts_user ON contacts(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_contacts_kind ON contacts(kind);
CREATE INDEX idx_contacts_value ON contacts(value);
CREATE INDEX idx_contacts_verified ON contacts(is_verified) WHERE is_verified = true;
CREATE INDEX idx_contacts_source ON contacts(source);

-- Single primary contact per user per kind (partial unique index)
CREATE UNIQUE INDEX uniq_contacts_primary_per_kind
  ON contacts(user_id, kind)
  WHERE is_primary = true AND user_id IS NOT NULL;

-- Trigger for updated_at
CREATE TRIGGER contacts_updated_at
BEFORE UPDATE ON contacts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

**Column Details:**

| Column | Type | Description |
|--------|------|-------------|
| `user_id` | UUID (nullable) | Links to users table. NULL for guest contacts. |
| `kind` | TEXT | `'email'` or `'phone'`. Allows adding SMS in future. |
| `value` | TEXT | Email (normalized to lowercase) or phone (E.164: +12025551234). |
| `is_primary` | BOOLEAN | One primary per user+kind. Used for "send to primary email". |
| `is_verified` | BOOLEAN | Has this contact been verified (double opt-in, email confirm)? |
| `verified_at` | TIMESTAMP | When verification occurred (GDPR audit trail). |
| `source` | TEXT | Where did this contact come from? Tracks data lineage. |
| `metadata` | JSONB | Extensible: `{ bounceCode, locale, carrierInfo, gdprConsent }` |

**Metadata Examples:**

```typescript
type ContactMetadata = {
  // Bounce tracking
  bounceType?: 'hard' | 'soft' | 'complaint';
  bounceCode?: string;  // e.g., "550 5.1.1 User unknown"
  bouncedAt?: string;   // ISO timestamp

  // Locale/preferences
  locale?: string;      // e.g., "en-CA", "fr-CA"
  timezone?: string;    // e.g., "America/Toronto"

  // Phone-specific (for SMS)
  carrierInfo?: {
    carrier: string;    // e.g., "Rogers", "Bell"
    type: 'mobile' | 'landline' | 'voip';
  };

  // GDPR tracking
  gdprConsent?: {
    consentedAt: string;
    ipAddress: string;
    userAgent: string;
  };

  // Import tracking
  importBatchId?: string;
  importSource?: string;  // e.g., "mailchimp-export-2025-01"
};
```

**Validation Rules:**

```typescript
// Email validation
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Phone validation (E.164 format)
function validatePhone(phone: string): boolean {
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  return e164Regex.test(phone);
}

// Normalization
function normalizeContact(kind: 'email' | 'phone', value: string): string {
  if (kind === 'email') {
    return value.toLowerCase().trim();
  }
  if (kind === 'phone') {
    // Convert to E.164 (implementation depends on library like libphonenumber-js)
    return convertToE164(value);
  }
  return value;
}
```

---

### mailing_lists Table

**Purpose:** Define managed lists for different email/SMS campaigns.

```sql
CREATE TABLE mailing_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  slug TEXT UNIQUE NOT NULL,  -- 'newsletter', 'product-alerts', 'sms-alerts'
  name TEXT NOT NULL,         -- 'Newsletter', 'Product Alerts', 'SMS Alerts'
  description TEXT,

  kind TEXT NOT NULL DEFAULT 'email' CHECK (kind IN ('email', 'sms', 'both')),

  is_default BOOLEAN NOT NULL DEFAULT false,  -- Auto-subscribe on account creation?
  is_active BOOLEAN NOT NULL DEFAULT true,    -- Can users subscribe to this list?

  metadata JSONB DEFAULT '{}'::jsonb,  -- Campaign settings, SendGrid list ID, etc.

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_mailing_lists_slug ON mailing_lists(slug);
CREATE INDEX idx_mailing_lists_active ON mailing_lists(is_active) WHERE is_active = true;
CREATE INDEX idx_mailing_lists_default ON mailing_lists(is_default) WHERE is_default = true;

-- Trigger for updated_at
CREATE TRIGGER mailing_lists_updated_at
BEFORE UPDATE ON mailing_lists
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

**Column Details:**

| Column | Type | Description |
|--------|------|-------------|
| `slug` | TEXT | Unique identifier (used in URLs, API). |
| `name` | TEXT | Display name shown to users. |
| `kind` | TEXT | `'email'`, `'sms'`, or `'both'`. Determines which contact kinds can subscribe. |
| `is_default` | BOOLEAN | Auto-subscribe users during account creation? (e.g., transactional emails) |
| `is_active` | BOOLEAN | Can users subscribe? Set false to archive old lists. |
| `metadata` | JSONB | SendGrid list ID, campaign settings, etc. |

**Metadata Examples:**

```typescript
type MailingListMetadata = {
  // SendGrid integration
  sendgridListId?: string;  // SendGrid Marketing contact list ID
  sendgridGroupId?: string; // SendGrid unsubscribe group ID

  // Campaign settings
  sendFrequency?: 'daily' | 'weekly' | 'monthly' | 'event-driven';
  sendTime?: string;  // e.g., "09:00" in UTC

  // Content settings
  defaultSubjectLine?: string;
  defaultFromName?: string;
  defaultFromEmail?: string;

  // Analytics
  totalSubscribers?: number;  // Cached count (updated periodically)
  totalSent?: number;         // Total emails sent
  averageOpenRate?: number;   // Open rate percentage
};
```

**Default Lists (Seed Data):**

```typescript
const defaultLists = [
  {
    slug: 'newsletter',
    name: 'Newsletter',
    description: 'Monthly updates about new products and company news',
    kind: 'email',
    isDefault: false,
    isActive: true,
  },
  {
    slug: 'product-alerts',
    name: 'Product Alerts',
    description: 'Get notified when new products launch or restock',
    kind: 'email',
    isDefault: false,
    isActive: true,
  },
  {
    slug: 'order-updates',
    name: 'Order Updates',
    description: 'Transactional emails about your orders (required)',
    kind: 'email',
    isDefault: true,  // Auto-subscribe
    isActive: true,
  },
  {
    slug: 'sms-alerts',
    name: 'SMS Alerts',
    description: 'Urgent notifications via text message',
    kind: 'sms',
    isDefault: false,
    isActive: false,  // Not launched yet
  },
];
```

---

### contact_subscriptions Table

**Purpose:** Track consent state per contact per mailing list with full audit trail.

```sql
CREATE TABLE contact_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  mailing_list_id UUID NOT NULL REFERENCES mailing_lists(id) ON DELETE CASCADE,

  status TEXT NOT NULL CHECK (status IN ('pending', 'subscribed', 'unsubscribed', 'bounced')),

  -- Opt-in tracking (GDPR compliance)
  opt_in_at TIMESTAMP,
  opt_in_ip TEXT,
  opt_in_user_agent TEXT,

  -- Opt-out tracking
  opt_out_at TIMESTAMP,
  opt_out_reason TEXT,  -- 'user-request', 'hard-bounce', 'spam-complaint', 'admin'

  metadata JSONB DEFAULT '{}'::jsonb,  -- Bounce details, complaint details, etc.

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Constraints
  UNIQUE (contact_id, mailing_list_id)  -- One subscription per contact per list
);

-- Indexes
CREATE INDEX idx_subscriptions_contact ON contact_subscriptions(contact_id);
CREATE INDEX idx_subscriptions_list ON contact_subscriptions(mailing_list_id);
CREATE INDEX idx_subscriptions_status ON contact_subscriptions(status);
CREATE INDEX idx_subscriptions_pending ON contact_subscriptions(status, created_at) WHERE status = 'pending';

-- Trigger for updated_at
CREATE TRIGGER contact_subscriptions_updated_at
BEFORE UPDATE ON contact_subscriptions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

**Column Details:**

| Column | Type | Description |
|--------|------|-------------|
| `status` | TEXT | Current subscription state. See state machine below. |
| `opt_in_at` | TIMESTAMP | When user confirmed subscription (GDPR audit). |
| `opt_in_ip` | TEXT | IP address of opt-in (GDPR audit). |
| `opt_in_user_agent` | TEXT | Browser user agent (GDPR audit). |
| `opt_out_at` | TIMESTAMP | When user unsubscribed. |
| `opt_out_reason` | TEXT | Why they unsubscribed. Tracks automatic vs manual. |
| `metadata` | JSONB | Bounce codes, complaint details, etc. |

**Status State Machine:**

```
   ┌─────────┐
   │ pending │ ← Initial state (awaiting double opt-in)
   └────┬────┘
        │ confirm email clicked
        ↓
   ┌────────────┐
   │ subscribed │ ← Active subscription
   └─────┬──────┘
         │
         ├─→ user clicks unsubscribe ─→ unsubscribed
         ├─→ hard bounce ──────────────→ bounced
         └─→ spam complaint ────────────→ bounced

   ┌──────────────┐
   │ unsubscribed │ ← Can re-subscribe (create new subscription)
   └──────────────┘

   ┌─────────┐
   │ bounced │ ← Cannot send emails (hard bounce or complaint)
   └─────────┘
```

**Metadata Examples:**

```typescript
type SubscriptionMetadata = {
  // Bounce tracking
  bounceType?: 'hard' | 'soft';
  bounceCode?: string;
  bounceMessage?: string;
  bounceDate?: string;
  bounceCount?: number;  // Number of soft bounces

  // Complaint tracking
  complaintType?: 'spam' | 'abuse';
  complaintDate?: string;
  complaintFeedbackId?: string;  // ISP feedback loop ID

  // SendGrid tracking
  sendgridContactId?: string;
  sendgridSuppressionGroupId?: string;

  // Re-subscription history
  subscriptionHistory?: Array<{
    action: 'subscribed' | 'unsubscribed';
    at: string;
    reason?: string;
  }>;
};
```

---

### contact_verification_tokens Table

**Purpose:** Store double opt-in tokens for email verification.

```sql
CREATE TABLE contact_verification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  mailing_list_id UUID REFERENCES mailing_lists(id) ON DELETE CASCADE,  -- If verifying for specific list

  token TEXT NOT NULL UNIQUE,  -- Random secure token (32+ chars)

  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,

  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_verification_tokens_contact ON contact_verification_tokens(contact_id);
CREATE INDEX idx_verification_tokens_token ON contact_verification_tokens(token);
CREATE INDEX idx_verification_tokens_expires ON contact_verification_tokens(expires_at);

-- Cleanup expired tokens (run via cron job)
-- DELETE FROM contact_verification_tokens WHERE expires_at < NOW() AND used_at IS NULL;
```

**Token Generation:**

```typescript
import { randomBytes } from 'crypto';

function generateVerificationToken(): string {
  return randomBytes(32).toString('base64url'); // URL-safe, 43 chars
}

function createVerificationToken(contactId: string, mailingListId?: string) {
  const token = generateVerificationToken();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  return db.insert(contactVerificationTokens).values({
    contactId,
    mailingListId,
    token,
    expiresAt,
  });
}
```

**Verification Flow:**

1. User submits email on signup form
2. Create contact with `is_verified = false`
3. Create subscription with `status = 'pending'`
4. Generate verification token
5. Send email with link: `https://imajin.ca/verify-email?token={token}`
6. User clicks link
7. Validate token (not expired, not used)
8. Update contact: `is_verified = true`, `verified_at = NOW()`
9. Update subscription: `status = 'subscribed'`, `opt_in_at = NOW()`
10. Mark token: `used_at = NOW()`

---

## Drizzle Schema

**File:** `db/schema-contacts.ts`

```typescript
import { pgTable, uuid, text, timestamp, boolean, jsonb, unique, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './schema-auth';

// Contacts table
export const contacts = pgTable('contacts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),

  kind: text('kind').notNull().$type<'email' | 'phone'>(),
  value: text('value').notNull(),

  isPrimary: boolean('is_primary').notNull().default(false),
  isVerified: boolean('is_verified').notNull().default(false),
  verifiedAt: timestamp('verified_at'),

  source: text('source').notNull().$type<'auth' | 'signup_form' | 'order' | 'manual' | 'import'>(),

  metadata: jsonb('metadata').$type<ContactMetadata>().default({}),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  // Unique constraint: same value+kind can't exist twice
  uniqueValuePerKind: unique().on(table.value, table.kind),

  // Partial unique index: one primary per user+kind
  uniquePrimaryPerKind: unique('uniq_contacts_primary_per_kind')
    .on(table.userId, table.kind)
    .where(sql`${table.isPrimary} = true AND ${table.userId} IS NOT NULL`),
}));

// Mailing lists table
export const mailingLists = pgTable('mailing_lists', {
  id: uuid('id').primaryKey().defaultRandom(),

  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),

  kind: text('kind').notNull().default('email').$type<'email' | 'sms' | 'both'>(),

  isDefault: boolean('is_default').notNull().default(false),
  isActive: boolean('is_active').notNull().default(true),

  metadata: jsonb('metadata').$type<MailingListMetadata>().default({}),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Contact subscriptions table
export const contactSubscriptions = pgTable('contact_subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),

  contactId: uuid('contact_id').notNull().references(() => contacts.id, { onDelete: 'cascade' }),
  mailingListId: uuid('mailing_list_id').notNull().references(() => mailingLists.id, { onDelete: 'cascade' }),

  status: text('status').notNull().$type<'pending' | 'subscribed' | 'unsubscribed' | 'bounced'>(),

  optInAt: timestamp('opt_in_at'),
  optInIp: text('opt_in_ip'),
  optInUserAgent: text('opt_in_user_agent'),

  optOutAt: timestamp('opt_out_at'),
  optOutReason: text('opt_out_reason'),

  metadata: jsonb('metadata').$type<SubscriptionMetadata>().default({}),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  uniqueSubscription: unique().on(table.contactId, table.mailingListId),
}));

// Contact verification tokens table
export const contactVerificationTokens = pgTable('contact_verification_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),

  contactId: uuid('contact_id').notNull().references(() => contacts.id, { onDelete: 'cascade' }),
  mailingListId: uuid('mailing_list_id').references(() => mailingLists.id, { onDelete: 'cascade' }),

  token: text('token').notNull().unique(),

  expiresAt: timestamp('expires_at').notNull(),
  usedAt: timestamp('used_at'),

  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Relations
export const contactsRelations = relations(contacts, ({ one, many }) => ({
  user: one(users, {
    fields: [contacts.userId],
    references: [users.id],
  }),
  subscriptions: many(contactSubscriptions),
  verificationTokens: many(contactVerificationTokens),
}));

export const mailingListsRelations = relations(mailingLists, ({ many }) => ({
  subscriptions: many(contactSubscriptions),
}));

export const contactSubscriptionsRelations = relations(contactSubscriptions, ({ one }) => ({
  contact: one(contacts, {
    fields: [contactSubscriptions.contactId],
    references: [contacts.id],
  }),
  mailingList: one(mailingLists, {
    fields: [contactSubscriptions.mailingListId],
    references: [mailingLists.id],
  }),
}));

export const contactVerificationTokensRelations = relations(contactVerificationTokens, ({ one }) => ({
  contact: one(contacts, {
    fields: [contactVerificationTokens.contactId],
    references: [contacts.id],
  }),
  mailingList: one(mailingLists, {
    fields: [contactVerificationTokens.mailingListId],
    references: [mailingLists.id],
  }),
}));

// TypeScript Types
export type ContactMetadata = {
  // Bounce tracking
  bounceType?: 'hard' | 'soft' | 'complaint';
  bounceCode?: string;
  bouncedAt?: string;

  // Locale/preferences
  locale?: string;
  timezone?: string;

  // Phone-specific
  carrierInfo?: {
    carrier: string;
    type: 'mobile' | 'landline' | 'voip';
  };

  // GDPR tracking
  gdprConsent?: {
    consentedAt: string;
    ipAddress: string;
    userAgent: string;
  };

  // Import tracking
  importBatchId?: string;
  importSource?: string;

  [key: string]: any;
};

export type MailingListMetadata = {
  // SendGrid integration
  sendgridListId?: string;
  sendgridGroupId?: string;

  // Campaign settings
  sendFrequency?: 'daily' | 'weekly' | 'monthly' | 'event-driven';
  sendTime?: string;

  // Content settings
  defaultSubjectLine?: string;
  defaultFromName?: string;
  defaultFromEmail?: string;

  // Analytics
  totalSubscribers?: number;
  totalSent?: number;
  averageOpenRate?: number;

  [key: string]: any;
};

export type SubscriptionMetadata = {
  // Bounce tracking
  bounceType?: 'hard' | 'soft';
  bounceCode?: string;
  bounceMessage?: string;
  bounceDate?: string;
  bounceCount?: number;

  // Complaint tracking
  complaintType?: 'spam' | 'abuse';
  complaintDate?: string;
  complaintFeedbackId?: string;

  // SendGrid tracking
  sendgridContactId?: string;
  sendgridSuppressionGroupId?: string;

  // Re-subscription history
  subscriptionHistory?: Array<{
    action: 'subscribed' | 'unsubscribed';
    at: string;
    reason?: string;
  }>;

  [key: string]: any;
};
```

---

## Integration Points

### 1. Auth Signup Integration (Phase 4.4.3)

**When user signs up via Ory:**

```typescript
// lib/contacts/sync-ory-contact.ts
import { db } from '@/db';
import { contacts, contactSubscriptions, mailingLists } from '@/db/schema-contacts';
import { eq, and } from 'drizzle-orm';

export async function syncOryContactToLocal(
  userId: string,
  email: string,
  marketingOptIn: boolean
) {
  // Check if contact already exists (guest signup before account creation)
  const existingContact = await db.query.contacts.findFirst({
    where: (contacts, { eq, and }) =>
      and(eq(contacts.value, email.toLowerCase()), eq(contacts.kind, 'email')),
  });

  let contactId: string;

  if (existingContact) {
    // Link existing contact to user
    if (!existingContact.userId) {
      await db.update(contacts)
        .set({
          userId,
          source: 'auth',  // Update source since now linked to account
          isPrimary: true,
          isVerified: true,  // Ory verified the email
          verifiedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(contacts.id, existingContact.id));
    }
    contactId = existingContact.id;
  } else {
    // Create new contact
    const [newContact] = await db.insert(contacts).values({
      userId,
      kind: 'email',
      value: email.toLowerCase(),
      isPrimary: true,
      isVerified: true,  // Ory verified
      verifiedAt: new Date(),
      source: 'auth',
    }).returning();

    contactId = newContact.id;
  }

  // If user opted in during signup, create subscriptions
  if (marketingOptIn) {
    const newsletterList = await db.query.mailingLists.findFirst({
      where: (lists, { eq }) => eq(lists.slug, 'newsletter'),
    });

    if (newsletterList) {
      await db.insert(contactSubscriptions).values({
        contactId,
        mailingListId: newsletterList.id,
        status: 'subscribed',  // Already verified via Ory
        optInAt: new Date(),
        optInIp: null,  // Could capture from request
        optInUserAgent: null,
      }).onConflictDoNothing();
    }
  }

  // Auto-subscribe to default lists (e.g., order-updates)
  const defaultLists = await db.query.mailingLists.findMany({
    where: (lists, { eq, and }) =>
      and(eq(lists.isDefault, true), eq(lists.isActive, true)),
  });

  for (const list of defaultLists) {
    await db.insert(contactSubscriptions).values({
      contactId,
      mailingListId: list.id,
      status: 'subscribed',
      optInAt: new Date(),
    }).onConflictDoNothing();
  }

  return contactId;
}
```

### 2. Footer Email Signup Widget

**Guest email capture with double opt-in:**

```typescript
// app/api/subscribe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { contacts, contactSubscriptions, contactVerificationTokens, mailingLists } from '@/db/schema-contacts';
import { sendVerificationEmail } from '@/lib/email/send-verification';

export async function POST(request: NextRequest) {
  const { email, listSlug } = await request.json();

  // Validate email
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Get mailing list
  const list = await db.query.mailingLists.findFirst({
    where: (lists, { eq }) => eq(lists.slug, listSlug || 'newsletter'),
  });

  if (!list) {
    return NextResponse.json({ error: 'List not found' }, { status: 404 });
  }

  // Check if contact exists
  let contact = await db.query.contacts.findFirst({
    where: (contacts, { eq, and }) =>
      and(eq(contacts.value, normalizedEmail), eq(contacts.kind, 'email')),
  });

  if (!contact) {
    // Create new contact
    [contact] = await db.insert(contacts).values({
      kind: 'email',
      value: normalizedEmail,
      isVerified: false,
      source: 'signup_form',
    }).returning();
  }

  // Check if already subscribed
  const existingSubscription = await db.query.contactSubscriptions.findFirst({
    where: (subs, { eq, and }) =>
      and(eq(subs.contactId, contact.id), eq(subs.mailingListId, list.id)),
  });

  if (existingSubscription) {
    if (existingSubscription.status === 'subscribed') {
      return NextResponse.json({ message: 'Already subscribed' }, { status: 200 });
    }
    if (existingSubscription.status === 'pending') {
      return NextResponse.json({ message: 'Check your email to confirm' }, { status: 200 });
    }
  }

  // Create subscription with pending status
  await db.insert(contactSubscriptions).values({
    contactId: contact.id,
    mailingListId: list.id,
    status: 'pending',
  }).onConflictDoUpdate({
    target: [contactSubscriptions.contactId, contactSubscriptions.mailingListId],
    set: { status: 'pending', updatedAt: new Date() },
  });

  // Generate verification token
  const token = generateVerificationToken();
  await db.insert(contactVerificationTokens).values({
    contactId: contact.id,
    mailingListId: list.id,
    token,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
  });

  // Send verification email
  await sendVerificationEmail(normalizedEmail, token, list.name);

  return NextResponse.json({
    message: 'Verification email sent. Please check your inbox.'
  }, { status: 200 });
}
```

### 3. Email Verification Endpoint

```typescript
// app/api/verify-email/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { contacts, contactSubscriptions, contactVerificationTokens } from '@/db/schema-contacts';
import { eq, and, gt } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: 'Token required' }, { status: 400 });
  }

  // Find token
  const verificationToken = await db.query.contactVerificationTokens.findFirst({
    where: (tokens, { eq, and, isNull, gt }) =>
      and(
        eq(tokens.token, token),
        isNull(tokens.usedAt),
        gt(tokens.expiresAt, new Date())
      ),
    with: {
      contact: true,
      mailingList: true,
    },
  });

  if (!verificationToken) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
  }

  // Mark contact as verified
  await db.update(contacts)
    .set({
      isVerified: true,
      verifiedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(contacts.id, verificationToken.contactId));

  // Update subscription status to subscribed
  await db.update(contactSubscriptions)
    .set({
      status: 'subscribed',
      optInAt: new Date(),
      optInIp: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      optInUserAgent: request.headers.get('user-agent'),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(contactSubscriptions.contactId, verificationToken.contactId),
        eq(contactSubscriptions.mailingListId, verificationToken.mailingListId)
      )
    );

  // Mark token as used
  await db.update(contactVerificationTokens)
    .set({ usedAt: new Date() })
    .where(eq(contactVerificationTokens.id, verificationToken.id));

  // Redirect to success page
  return NextResponse.redirect(new URL('/subscribe/confirmed', request.url));
}
```

### 4. SendGrid Webhook Handler

**Handle bounces and complaints:**

```typescript
// app/api/webhooks/sendgrid/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { contacts, contactSubscriptions } from '@/db/schema-contacts';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  const events = await request.json();

  for (const event of events) {
    const email = event.email?.toLowerCase();
    if (!email) continue;

    const contact = await db.query.contacts.findFirst({
      where: (contacts, { eq, and }) =>
        and(eq(contacts.value, email), eq(contacts.kind, 'email')),
    });

    if (!contact) continue;

    switch (event.event) {
      case 'bounce':
        if (event.type === 'blocked' || event.status === '5.x.x') {
          // Hard bounce - mark as bounced
          await db.update(contacts).set({
            isVerified: false,
            metadata: {
              ...contact.metadata,
              bounceType: 'hard',
              bounceCode: event.status,
              bouncedAt: new Date().toISOString(),
            },
            updatedAt: new Date(),
          }).where(eq(contacts.id, contact.id));

          // Mark all subscriptions as bounced
          await db.update(contactSubscriptions).set({
            status: 'bounced',
            optOutAt: new Date(),
            optOutReason: 'hard-bounce',
            metadata: {
              bounceMessage: event.reason,
            },
            updatedAt: new Date(),
          }).where(eq(contactSubscriptions.contactId, contact.id));
        }
        break;

      case 'spamreport':
        // Spam complaint - mark as bounced
        await db.update(contactSubscriptions).set({
          status: 'bounced',
          optOutAt: new Date(),
          optOutReason: 'spam-complaint',
          metadata: {
            complaintType: 'spam',
            complaintDate: new Date().toISOString(),
          },
          updatedAt: new Date(),
        }).where(eq(contactSubscriptions.contactId, contact.id));
        break;
    }
  }

  return NextResponse.json({ received: true });
}
```

### 5. GDPR Data Export

**Export all contact data for user:**

```typescript
// lib/gdpr/export-contact-data.ts
import { db } from '@/db';
import { eq } from 'drizzle-orm';

export async function exportContactData(userId: string) {
  const userContacts = await db.query.contacts.findMany({
    where: (contacts, { eq }) => eq(contacts.userId, userId),
    with: {
      subscriptions: {
        with: {
          mailingList: true,
        },
      },
    },
  });

  return {
    contacts: userContacts.map(contact => ({
      value: contact.value,
      kind: contact.kind,
      isVerified: contact.isVerified,
      verifiedAt: contact.verifiedAt,
      source: contact.source,
      createdAt: contact.createdAt,
      subscriptions: contact.subscriptions.map(sub => ({
        list: sub.mailingList.name,
        status: sub.status,
        optInAt: sub.optInAt,
        optOutAt: sub.optOutAt,
      })),
    })),
  };
}
```

### 6. GDPR Right to Be Forgotten

**Delete all contact data:**

```typescript
// lib/gdpr/delete-contact-data.ts
import { db } from '@/db';
import { contacts } from '@/db/schema-contacts';
import { eq } from 'drizzle-orm';

export async function deleteContactData(userId: string) {
  // Delete all contacts (cascade deletes subscriptions and tokens)
  await db.delete(contacts)
    .where(eq(contacts.userId, userId));

  // Note: Consider soft delete with is_deleted flag if you need audit trail
}
```

---

## Detailed Test Specifications

**Total Estimated Tests:** 85 tests (25 unit, 53 integration, 7 E2E)

**Testing Strategy:**
- Write ALL tests BEFORE implementation (TDD)
- Unit tests for validation, normalization, business logic
- Integration tests for API routes, database operations, external services
- E2E tests for complete user flows

---

### Test Suite 1: Contact Validation & Normalization (Unit Tests)

**File:** `tests/unit/lib/contacts/validate-contact.test.ts`

**Test 1.1:** Validates email format
```typescript
it('accepts valid email addresses', () => {
  expect(validateEmail('user@example.com')).toBe(true);
  expect(validateEmail('test+tag@domain.co.uk')).toBe(true);
});
```

**Test 1.2:** Rejects invalid email formats
```typescript
it('rejects invalid email addresses', () => {
  expect(validateEmail('not-an-email')).toBe(false);
  expect(validateEmail('@example.com')).toBe(false);
  expect(validateEmail('user@')).toBe(false);
  expect(validateEmail('')).toBe(false);
});
```

**Test 1.3:** Validates phone number E.164 format
```typescript
it('accepts valid E.164 phone numbers', () => {
  expect(validatePhone('+12025551234')).toBe(true);
  expect(validatePhone('+441234567890')).toBe(true);
});
```

**Test 1.4:** Rejects invalid phone formats
```typescript
it('rejects invalid phone numbers', () => {
  expect(validatePhone('202-555-1234')).toBe(false);
  expect(validatePhone('12025551234')).toBe(false); // Missing +
  expect(validatePhone('+1-202-555-1234')).toBe(false); // Dashes not allowed
});
```

**Test 1.5:** Normalizes email to lowercase
```typescript
it('normalizes email to lowercase', () => {
  expect(normalizeContact('email', 'TEST@EXAMPLE.COM')).toBe('test@example.com');
  expect(normalizeContact('email', 'User@Domain.COM')).toBe('user@domain.com');
});
```

**Test 1.6:** Trims whitespace from email
```typescript
it('trims whitespace from email', () => {
  expect(normalizeContact('email', '  test@example.com  ')).toBe('test@example.com');
});
```

**Test 1.7:** Validates contact input object
```typescript
it('validates complete contact input', () => {
  const result = validateContactInput({
    kind: 'email',
    value: 'test@example.com',
    source: 'signup_form',
  });
  expect(result.valid).toBe(true);
  expect(result.errors).toEqual([]);
});
```

**Test 1.8:** Returns errors for invalid contact input
```typescript
it('returns validation errors for invalid input', () => {
  const result = validateContactInput({
    kind: 'email',
    value: 'not-an-email',
    source: 'signup_form',
  });
  expect(result.valid).toBe(false);
  expect(result.errors).toContain('Please enter a valid email address');
});
```

---

### Test Suite 2: Contact Creation (Unit Tests)

**File:** `tests/unit/lib/contacts/create-contact.test.ts`

**Test 2.1:** Creates contact with valid email
```typescript
it('creates contact with valid email', async () => {
  const result = await createContact({
    kind: 'email',
    value: 'test@example.com',
    source: 'signup_form',
  });

  expect(result.id).toBeDefined();
  expect(result.kind).toBe('email');
  expect(result.value).toBe('test@example.com');
  expect(result.isVerified).toBe(false);
  expect(result.isPrimary).toBe(false);
  expect(result.source).toBe('signup_form');
});
```

**Test 2.2:** Normalizes email before creating
```typescript
it('normalizes email to lowercase before saving', async () => {
  const result = await createContact({
    kind: 'email',
    value: 'TEST@EXAMPLE.COM',
    source: 'signup_form',
  });

  expect(result.value).toBe('test@example.com');
});
```

**Test 2.3:** Creates contact linked to user
```typescript
it('creates contact linked to user when userId provided', async () => {
  const userId = 'test-user-id';
  const result = await createContact({
    kind: 'email',
    value: 'test@example.com',
    source: 'auth',
    userId,
  });

  expect(result.userId).toBe(userId);
});
```

**Test 2.4:** Creates guest contact with null userId
```typescript
it('creates guest contact with null userId', async () => {
  const result = await createContact({
    kind: 'email',
    value: 'guest@example.com',
    source: 'signup_form',
  });

  expect(result.userId).toBeNull();
});
```

**Test 2.5:** Throws error for duplicate email
```typescript
it('throws error when creating duplicate email', async () => {
  await createContact({
    kind: 'email',
    value: 'test@example.com',
    source: 'signup_form',
  });

  await expect(
    createContact({
      kind: 'email',
      value: 'test@example.com',
      source: 'manual',
    })
  ).rejects.toThrow('Contact already exists');
});
```

**Test 2.6:** Throws error for invalid email
```typescript
it('throws error for invalid email format', async () => {
  await expect(
    createContact({
      kind: 'email',
      value: 'not-an-email',
      source: 'signup_form',
    })
  ).rejects.toThrow('Invalid email address');
});
```

**Test 2.7:** Creates contact with metadata
```typescript
it('creates contact with metadata', async () => {
  const metadata = { locale: 'en-CA', gdprConsent: true };
  const result = await createContact({
    kind: 'email',
    value: 'test@example.com',
    source: 'signup_form',
    metadata,
  });

  expect(result.metadata).toEqual(metadata);
});
```

---

### Test Suite 3: Subscription Management (Unit Tests)

**File:** `tests/unit/lib/contacts/subscribe.test.ts`

**Test 3.1:** Creates subscription with pending status
```typescript
it('creates subscription with pending status', async () => {
  const contactId = 'test-contact-id';
  const mailingListId = 'newsletter-id';

  const result = await subscribeToList(contactId, mailingListId);

  expect(result.contactId).toBe(contactId);
  expect(result.mailingListId).toBe(mailingListId);
  expect(result.status).toBe('pending');
  expect(result.optInAt).toBeNull();
});
```

**Test 3.2:** Prevents duplicate subscriptions
```typescript
it('throws error for duplicate subscription', async () => {
  const contactId = 'test-contact-id';
  const mailingListId = 'newsletter-id';

  await subscribeToList(contactId, mailingListId);

  await expect(
    subscribeToList(contactId, mailingListId)
  ).rejects.toThrow('Already subscribed');
});
```

**Test 3.3:** Updates subscription status to subscribed
```typescript
it('updates subscription status to subscribed', async () => {
  const subscriptionId = 'test-sub-id';

  const result = await confirmSubscription(subscriptionId, {
    optInIp: '192.168.1.1',
    optInUserAgent: 'Mozilla/5.0...',
  });

  expect(result.status).toBe('subscribed');
  expect(result.optInAt).toBeDefined();
  expect(result.optInIp).toBe('192.168.1.1');
});
```

**Test 3.4:** Unsubscribes from list
```typescript
it('unsubscribes from list', async () => {
  const contactId = 'test-contact-id';
  const mailingListId = 'newsletter-id';

  await subscribeToList(contactId, mailingListId);
  await confirmSubscription(contactId, mailingListId);

  const result = await unsubscribeFromList(contactId, mailingListId, 'user-request');

  expect(result.status).toBe('unsubscribed');
  expect(result.optOutAt).toBeDefined();
  expect(result.optOutReason).toBe('user-request');
});
```

**Test 3.5:** Allows re-subscription after unsubscribe
```typescript
it('allows re-subscription after unsubscribe', async () => {
  const contactId = 'test-contact-id';
  const mailingListId = 'newsletter-id';

  await subscribeToList(contactId, mailingListId);
  await unsubscribeFromList(contactId, mailingListId, 'user-request');

  const result = await subscribeToList(contactId, mailingListId);

  expect(result.status).toBe('pending');
});
```

---

### Test Suite 4: Email Verification (Integration Tests)

**File:** `tests/integration/lib/contacts/verify-email.test.ts`

**Test 4.1:** Creates verification token
```typescript
it('creates verification token with expiration', async () => {
  const contactId = 'test-contact-id';
  const mailingListId = 'newsletter-id';

  const token = await createVerificationToken(contactId, mailingListId);

  expect(token.token).toHaveLength(43); // Base64URL length
  expect(token.contactId).toBe(contactId);
  expect(token.mailingListId).toBe(mailingListId);
  expect(token.expiresAt).toBeInstanceOf(Date);
  expect(token.usedAt).toBeNull();
});
```

**Test 4.2:** Verifies email with valid token
```typescript
it('verifies email with valid token', async () => {
  const contact = await createContact({
    kind: 'email',
    value: 'test@example.com',
    source: 'signup_form',
  });

  const token = await createVerificationToken(contact.id, 'newsletter-id');

  const result = await verifyEmail(token.token);

  expect(result.contact.isVerified).toBe(true);
  expect(result.contact.verifiedAt).toBeDefined();
  expect(result.subscription.status).toBe('subscribed');
  expect(result.subscription.optInAt).toBeDefined();
});
```

**Test 4.3:** Rejects expired token
```typescript
it('rejects expired verification token', async () => {
  const contact = await createContact({
    kind: 'email',
    value: 'test@example.com',
    source: 'signup_form',
  });

  // Create token that expires immediately
  const token = await db.insert(contactVerificationTokens).values({
    contactId: contact.id,
    mailingListId: 'newsletter-id',
    token: 'expired-token',
    expiresAt: new Date(Date.now() - 1000), // 1 second ago
  }).returning();

  await expect(verifyEmail('expired-token')).rejects.toThrow('Token expired');
});
```

**Test 4.4:** Rejects already used token
```typescript
it('rejects already used token', async () => {
  const contact = await createContact({
    kind: 'email',
    value: 'test@example.com',
    source: 'signup_form',
  });

  const token = await createVerificationToken(contact.id, 'newsletter-id');

  await verifyEmail(token.token); // Use once

  await expect(verifyEmail(token.token)).rejects.toThrow('Token already used');
});
```

**Test 4.5:** Rejects invalid token
```typescript
it('rejects invalid token', async () => {
  await expect(verifyEmail('invalid-token-12345')).rejects.toThrow('Invalid token');
});
```

**Test 4.6:** Marks token as used after verification
```typescript
it('marks token as used after verification', async () => {
  const contact = await createContact({
    kind: 'email',
    value: 'test@example.com',
    source: 'signup_form',
  });

  const token = await createVerificationToken(contact.id, 'newsletter-id');

  await verifyEmail(token.token);

  const updatedToken = await db.query.contactVerificationTokens.findFirst({
    where: eq(contactVerificationTokens.token, token.token),
  });

  expect(updatedToken.usedAt).toBeDefined();
});
```

**Test 4.7:** Rate limits token generation
```typescript
it('prevents token generation spam (rate limit)', async () => {
  const contact = await createContact({
    kind: 'email',
    value: 'test@example.com',
    source: 'signup_form',
  });

  // Generate 3 tokens rapidly
  await createVerificationToken(contact.id, 'newsletter-id');
  await createVerificationToken(contact.id, 'newsletter-id');
  await createVerificationToken(contact.id, 'newsletter-id');

  // 4th should fail
  await expect(
    createVerificationToken(contact.id, 'newsletter-id')
  ).rejects.toThrow('Too many verification requests');
});
```

---

### Test Suite 5: Ory Contact Sync (Integration Tests)

**File:** `tests/integration/lib/contacts/sync-ory-contact.test.ts`

**Test 5.1:** Creates new contact for Ory user
```typescript
it('creates new contact when Ory user signs up', async () => {
  const userId = 'ory-user-id';
  const email = 'newuser@example.com';

  const contactId = await syncOryContactToLocal(userId, email, false);

  const contact = await db.query.contacts.findFirst({
    where: eq(contacts.id, contactId),
  });

  expect(contact.userId).toBe(userId);
  expect(contact.value).toBe(email);
  expect(contact.kind).toBe('email');
  expect(contact.isPrimary).toBe(true);
  expect(contact.isVerified).toBe(true); // Ory verified
  expect(contact.source).toBe('auth');
});
```

**Test 5.2:** Links existing guest contact to new user
```typescript
it('links existing guest contact when user creates account', async () => {
  const email = 'guest@example.com';

  // Create guest contact first
  const guestContact = await createContact({
    kind: 'email',
    value: email,
    source: 'signup_form',
  });

  // User creates account with same email
  const userId = 'new-user-id';
  await syncOryContactToLocal(userId, email, false);

  const updatedContact = await db.query.contacts.findFirst({
    where: eq(contacts.id, guestContact.id),
  });

  expect(updatedContact.userId).toBe(userId);
  expect(updatedContact.isPrimary).toBe(true);
  expect(updatedContact.isVerified).toBe(true);
});
```

**Test 5.3:** Creates subscription if user opts in
```typescript
it('creates newsletter subscription if user opts in', async () => {
  const userId = 'ory-user-id';
  const email = 'newuser@example.com';

  const contactId = await syncOryContactToLocal(userId, email, true); // optIn = true

  const subscription = await db.query.contactSubscriptions.findFirst({
    where: eq(contactSubscriptions.contactId, contactId),
    with: { mailingList: true },
  });

  expect(subscription).toBeDefined();
  expect(subscription.mailingList.slug).toBe('newsletter');
  expect(subscription.status).toBe('subscribed');
});
```

**Test 5.4:** Auto-subscribes to default lists
```typescript
it('auto-subscribes to default lists', async () => {
  const userId = 'ory-user-id';
  const email = 'newuser@example.com';

  const contactId = await syncOryContactToLocal(userId, email, false);

  const subscriptions = await db.query.contactSubscriptions.findMany({
    where: eq(contactSubscriptions.contactId, contactId),
    with: { mailingList: true },
  });

  const defaultSub = subscriptions.find(
    s => s.mailingList.isDefault === true
  );

  expect(defaultSub).toBeDefined();
  expect(defaultSub.mailingList.slug).toBe('order-updates');
  expect(defaultSub.status).toBe('subscribed');
});
```

**Test 5.5:** Preserves existing subscriptions when linking
```typescript
it('preserves existing subscriptions when linking guest to user', async () => {
  const email = 'guest@example.com';

  // Guest subscribes to newsletter
  const guestContact = await createContact({
    kind: 'email',
    value: email,
    source: 'signup_form',
  });

  const newsletterList = await db.query.mailingLists.findFirst({
    where: eq(mailingLists.slug, 'newsletter'),
  });

  await subscribeToList(guestContact.id, newsletterList.id);

  // User creates account
  const userId = 'new-user-id';
  await syncOryContactToLocal(userId, email, false);

  // Subscription should still exist
  const subscription = await db.query.contactSubscriptions.findFirst({
    where: and(
      eq(contactSubscriptions.contactId, guestContact.id),
      eq(contactSubscriptions.mailingListId, newsletterList.id)
    ),
  });

  expect(subscription).toBeDefined();
});
```

---

### Test Suite 6: API Routes - Subscribe (Integration Tests)

**File:** `tests/integration/api/subscribe.test.ts`

**Test 6.1:** Creates contact and subscription (guest signup)
```typescript
it('POST /api/subscribe creates contact and pending subscription', async () => {
  const response = await POST('/api/subscribe', {
    body: {
      email: 'newsubscriber@example.com',
      listSlug: 'newsletter',
    },
  });

  expect(response.status).toBe(200);
  expect(response.json.message).toContain('Verification email sent');

  // Verify database state
  const contact = await db.query.contacts.findFirst({
    where: eq(contacts.value, 'newsubscriber@example.com'),
  });

  expect(contact).toBeDefined();
  expect(contact.isVerified).toBe(false);

  const subscription = await db.query.contactSubscriptions.findFirst({
    where: eq(contactSubscriptions.contactId, contact.id),
  });

  expect(subscription.status).toBe('pending');
});
```

**Test 6.2:** Sends verification email
```typescript
it('sends verification email with token', async () => {
  const sendEmailSpy = vi.spyOn(emailService, 'sendVerificationEmail');

  await POST('/api/subscribe', {
    body: {
      email: 'test@example.com',
      listSlug: 'newsletter',
    },
  });

  expect(sendEmailSpy).toHaveBeenCalledWith(
    'test@example.com',
    expect.stringMatching(/^[A-Za-z0-9_-]{43}$/), // Token format
    'Newsletter'
  );
});
```

**Test 6.3:** Rejects invalid email
```typescript
it('rejects invalid email format', async () => {
  const response = await POST('/api/subscribe', {
    body: {
      email: 'not-an-email',
      listSlug: 'newsletter',
    },
  });

  expect(response.status).toBe(400);
  expect(response.json.error).toContain('Invalid email');
});
```

**Test 6.4:** Rejects non-existent mailing list
```typescript
it('rejects non-existent mailing list', async () => {
  const response = await POST('/api/subscribe', {
    body: {
      email: 'test@example.com',
      listSlug: 'nonexistent-list',
    },
  });

  expect(response.status).toBe(404);
  expect(response.json.error).toContain('List not found');
});
```

**Test 6.5:** Handles already subscribed contact
```typescript
it('returns success if already subscribed', async () => {
  const email = 'existing@example.com';
  const contact = await createContact({
    kind: 'email',
    value: email,
    source: 'signup_form',
  });

  const list = await db.query.mailingLists.findFirst({
    where: eq(mailingLists.slug, 'newsletter'),
  });

  await subscribeToList(contact.id, list.id);
  await confirmSubscription(contact.id, list.id);

  const response = await POST('/api/subscribe', {
    body: { email, listSlug: 'newsletter' },
  });

  expect(response.status).toBe(200);
  expect(response.json.message).toContain('Already subscribed');
});
```

**Test 6.6:** Handles pending verification contact
```typescript
it('returns pending message if verification pending', async () => {
  const email = 'pending@example.com';
  const contact = await createContact({
    kind: 'email',
    value: email,
    source: 'signup_form',
  });

  const list = await db.query.mailingLists.findFirst({
    where: eq(mailingLists.slug, 'newsletter'),
  });

  await subscribeToList(contact.id, list.id); // Status = pending

  const response = await POST('/api/subscribe', {
    body: { email, listSlug: 'newsletter' },
  });

  expect(response.status).toBe(200);
  expect(response.json.message).toContain('Check your email to confirm');
});
```

**Test 6.7:** Normalizes email before checking duplicates
```typescript
it('normalizes email before checking for duplicates', async () => {
  await POST('/api/subscribe', {
    body: {
      email: 'test@example.com',
      listSlug: 'newsletter',
    },
  });

  const response = await POST('/api/subscribe', {
    body: {
      email: 'TEST@EXAMPLE.COM', // Uppercase
      listSlug: 'newsletter',
    },
  });

  expect(response.status).toBe(200);
  expect(response.json.message).toContain('Check your email to confirm');
});
```

**Test 6.8:** Allows subscription to multiple lists
```typescript
it('allows same contact to subscribe to multiple lists', async () => {
  const email = 'multi@example.com';

  await POST('/api/subscribe', {
    body: { email, listSlug: 'newsletter' },
  });

  const response = await POST('/api/subscribe', {
    body: { email, listSlug: 'product-alerts' },
  });

  expect(response.status).toBe(200);

  const contact = await db.query.contacts.findFirst({
    where: eq(contacts.value, email),
    with: { subscriptions: true },
  });

  expect(contact.subscriptions).toHaveLength(2);
});
```

---

### Test Suite 7: API Routes - Verify Email (Integration Tests)

**File:** `tests/integration/api/verify-email.test.ts`

**Test 7.1:** Verifies email with valid token
```typescript
it('GET /api/verify-email verifies contact and subscription', async () => {
  const contact = await createContact({
    kind: 'email',
    value: 'test@example.com',
    source: 'signup_form',
  });

  const list = await db.query.mailingLists.findFirst({
    where: eq(mailingLists.slug, 'newsletter'),
  });

  await subscribeToList(contact.id, list.id);

  const tokenRecord = await createVerificationToken(contact.id, list.id);

  const response = await GET(`/api/verify-email?token=${tokenRecord.token}`);

  expect(response.status).toBe(302); // Redirect
  expect(response.headers.get('location')).toContain('/subscribe/confirmed');

  // Verify database state
  const updatedContact = await db.query.contacts.findFirst({
    where: eq(contacts.id, contact.id),
  });

  expect(updatedContact.isVerified).toBe(true);

  const subscription = await db.query.contactSubscriptions.findFirst({
    where: and(
      eq(contactSubscriptions.contactId, contact.id),
      eq(contactSubscriptions.mailingListId, list.id)
    ),
  });

  expect(subscription.status).toBe('subscribed');
  expect(subscription.optInAt).toBeDefined();
});
```

**Test 7.2:** Rejects missing token
```typescript
it('returns 400 for missing token', async () => {
  const response = await GET('/api/verify-email');

  expect(response.status).toBe(400);
  expect(response.json.error).toContain('Token required');
});
```

**Test 7.3:** Rejects expired token
```typescript
it('returns 400 for expired token', async () => {
  const expiredToken = await db.insert(contactVerificationTokens).values({
    contactId: 'test-id',
    mailingListId: 'newsletter-id',
    token: 'expired-token-123',
    expiresAt: new Date(Date.now() - 1000),
  }).returning();

  const response = await GET(`/api/verify-email?token=${expiredToken[0].token}`);

  expect(response.status).toBe(400);
  expect(response.json.error).toContain('Invalid or expired token');
});
```

**Test 7.4:** Captures opt-in metadata
```typescript
it('captures opt-in IP and user agent', async () => {
  const contact = await createContact({
    kind: 'email',
    value: 'test@example.com',
    source: 'signup_form',
  });

  const list = await db.query.mailingLists.findFirst({
    where: eq(mailingLists.slug, 'newsletter'),
  });

  await subscribeToList(contact.id, list.id);
  const tokenRecord = await createVerificationToken(contact.id, list.id);

  const response = await GET(`/api/verify-email?token=${tokenRecord.token}`, {
    headers: {
      'x-forwarded-for': '192.168.1.1',
      'user-agent': 'Mozilla/5.0...',
    },
  });

  expect(response.status).toBe(302);

  const subscription = await db.query.contactSubscriptions.findFirst({
    where: eq(contactSubscriptions.contactId, contact.id),
  });

  expect(subscription.optInIp).toBe('192.168.1.1');
  expect(subscription.optInUserAgent).toContain('Mozilla');
});
```

**Test 7.5:** Marks token as used
```typescript
it('marks token as used after verification', async () => {
  const contact = await createContact({
    kind: 'email',
    value: 'test@example.com',
    source: 'signup_form',
  });

  const list = await db.query.mailingLists.findFirst({
    where: eq(mailingLists.slug, 'newsletter'),
  });

  await subscribeToList(contact.id, list.id);
  const tokenRecord = await createVerificationToken(contact.id, list.id);

  await GET(`/api/verify-email?token=${tokenRecord.token}`);

  const updatedToken = await db.query.contactVerificationTokens.findFirst({
    where: eq(contactVerificationTokens.id, tokenRecord.id),
  });

  expect(updatedToken.usedAt).toBeDefined();
});
```

---

### Test Suite 8: API Routes - Unsubscribe (Integration Tests)

**File:** `tests/integration/api/unsubscribe.test.ts`

**Test 8.1:** Unsubscribes from list
```typescript
it('POST /api/unsubscribe updates subscription status', async () => {
  const contact = await createContact({
    kind: 'email',
    value: 'test@example.com',
    source: 'signup_form',
  });

  const list = await db.query.mailingLists.findFirst({
    where: eq(mailingLists.slug, 'newsletter'),
  });

  await subscribeToList(contact.id, list.id);
  await confirmSubscription(contact.id, list.id);

  const response = await POST('/api/unsubscribe', {
    body: {
      email: 'test@example.com',
      listSlug: 'newsletter',
    },
  });

  expect(response.status).toBe(200);
  expect(response.json.message).toContain('Unsubscribed successfully');

  const subscription = await db.query.contactSubscriptions.findFirst({
    where: and(
      eq(contactSubscriptions.contactId, contact.id),
      eq(contactSubscriptions.mailingListId, list.id)
    ),
  });

  expect(subscription.status).toBe('unsubscribed');
  expect(subscription.optOutAt).toBeDefined();
  expect(subscription.optOutReason).toBe('user-request');
});
```

**Test 8.2:** Handles non-existent subscription
```typescript
it('returns 404 for non-existent subscription', async () => {
  const response = await POST('/api/unsubscribe', {
    body: {
      email: 'nonexistent@example.com',
      listSlug: 'newsletter',
    },
  });

  expect(response.status).toBe(404);
  expect(response.json.error).toContain('Subscription not found');
});
```

**Test 8.3:** Preserves subscription history
```typescript
it('preserves subscription history (no hard delete)', async () => {
  const contact = await createContact({
    kind: 'email',
    value: 'test@example.com',
    source: 'signup_form',
  });

  const list = await db.query.mailingLists.findFirst({
    where: eq(mailingLists.slug, 'newsletter'),
  });

  await subscribeToList(contact.id, list.id);
  await confirmSubscription(contact.id, list.id);

  await POST('/api/unsubscribe', {
    body: {
      email: 'test@example.com',
      listSlug: 'newsletter',
    },
  });

  // Subscription record still exists
  const subscription = await db.query.contactSubscriptions.findFirst({
    where: and(
      eq(contactSubscriptions.contactId, contact.id),
      eq(contactSubscriptions.mailingListId, list.id)
    ),
  });

  expect(subscription).toBeDefined();
  expect(subscription.status).toBe('unsubscribed');
});
```

**Test 8.4:** Allows re-subscription after unsubscribe
```typescript
it('allows user to re-subscribe after unsubscribing', async () => {
  const email = 'test@example.com';
  const contact = await createContact({
    kind: 'email',
    value: email,
    source: 'signup_form',
  });

  const list = await db.query.mailingLists.findFirst({
    where: eq(mailingLists.slug, 'newsletter'),
  });

  await subscribeToList(contact.id, list.id);
  await confirmSubscription(contact.id, list.id);

  await POST('/api/unsubscribe', {
    body: { email, listSlug: 'newsletter' },
  });

  // Re-subscribe
  const response = await POST('/api/subscribe', {
    body: { email, listSlug: 'newsletter' },
  });

  expect(response.status).toBe(200);

  const subscription = await db.query.contactSubscriptions.findFirst({
    where: and(
      eq(contactSubscriptions.contactId, contact.id),
      eq(contactSubscriptions.mailingListId, list.id)
    ),
  });

  expect(subscription.status).toBe('pending');
});
```

---

### Test Suite 9: SendGrid Webhook Handler (Integration Tests)

**File:** `tests/integration/api/webhooks/sendgrid.test.ts`

**Test 9.1:** Handles hard bounce event
```typescript
it('POST /api/webhooks/sendgrid handles hard bounce', async () => {
  const contact = await createContact({
    kind: 'email',
    value: 'bounced@example.com',
    source: 'signup_form',
  });

  const list = await db.query.mailingLists.findFirst({
    where: eq(mailingLists.slug, 'newsletter'),
  });

  await subscribeToList(contact.id, list.id);
  await confirmSubscription(contact.id, list.id);

  const response = await POST('/api/webhooks/sendgrid', {
    body: [
      {
        event: 'bounce',
        email: 'bounced@example.com',
        type: 'blocked',
        status: '5.1.1',
        reason: 'User unknown',
      },
    ],
  });

  expect(response.status).toBe(200);

  const updatedContact = await db.query.contacts.findFirst({
    where: eq(contacts.id, contact.id),
  });

  expect(updatedContact.isVerified).toBe(false);
  expect(updatedContact.metadata.bounceType).toBe('hard');

  const subscription = await db.query.contactSubscriptions.findFirst({
    where: eq(contactSubscriptions.contactId, contact.id),
  });

  expect(subscription.status).toBe('bounced');
  expect(subscription.optOutReason).toBe('hard-bounce');
});
```

**Test 9.2:** Handles spam complaint event
```typescript
it('handles spam complaint event', async () => {
  const contact = await createContact({
    kind: 'email',
    value: 'complainer@example.com',
    source: 'signup_form',
  });

  const list = await db.query.mailingLists.findFirst({
    where: eq(mailingLists.slug, 'newsletter'),
  });

  await subscribeToList(contact.id, list.id);
  await confirmSubscription(contact.id, list.id);

  const response = await POST('/api/webhooks/sendgrid', {
    body: [
      {
        event: 'spamreport',
        email: 'complainer@example.com',
      },
    ],
  });

  expect(response.status).toBe(200);

  const subscription = await db.query.contactSubscriptions.findFirst({
    where: eq(contactSubscriptions.contactId, contact.id),
  });

  expect(subscription.status).toBe('bounced');
  expect(subscription.optOutReason).toBe('spam-complaint');
  expect(subscription.metadata.complaintType).toBe('spam');
});
```

**Test 9.3:** Ignores soft bounces
```typescript
it('ignores soft bounce events', async () => {
  const contact = await createContact({
    kind: 'email',
    value: 'softbounce@example.com',
    source: 'signup_form',
  });

  const list = await db.query.mailingLists.findFirst({
    where: eq(mailingLists.slug, 'newsletter'),
  });

  await subscribeToList(contact.id, list.id);
  await confirmSubscription(contact.id, list.id);

  await POST('/api/webhooks/sendgrid', {
    body: [
      {
        event: 'bounce',
        email: 'softbounce@example.com',
        type: 'soft',
        status: '4.2.2',
        reason: 'Mailbox full',
      },
    ],
  });

  const subscription = await db.query.contactSubscriptions.findFirst({
    where: eq(contactSubscriptions.contactId, contact.id),
  });

  expect(subscription.status).toBe('subscribed'); // Still subscribed
});
```

**Test 9.4:** Handles multiple events in batch
```typescript
it('handles multiple events in single request', async () => {
  const contact1 = await createContact({
    kind: 'email',
    value: 'user1@example.com',
    source: 'signup_form',
  });

  const contact2 = await createContact({
    kind: 'email',
    value: 'user2@example.com',
    source: 'signup_form',
  });

  const response = await POST('/api/webhooks/sendgrid', {
    body: [
      {
        event: 'bounce',
        email: 'user1@example.com',
        type: 'blocked',
        status: '5.1.1',
      },
      {
        event: 'spamreport',
        email: 'user2@example.com',
      },
    ],
  });

  expect(response.status).toBe(200);
  expect(response.json.received).toBe(true);
});
```

**Test 9.5:** Ignores events for non-existent contacts
```typescript
it('ignores events for non-existent contacts', async () => {
  const response = await POST('/api/webhooks/sendgrid', {
    body: [
      {
        event: 'bounce',
        email: 'nonexistent@example.com',
        type: 'blocked',
      },
    ],
  });

  expect(response.status).toBe(200);
  // Should not throw error
});
```

---

### Test Suite 10: Database Constraints (Integration Tests)

**File:** `tests/integration/db/contacts-constraints.test.ts`

**Test 10.1:** Enforces unique email per kind
```typescript
it('enforces unique constraint on value+kind', async () => {
  await db.insert(contacts).values({
    kind: 'email',
    value: 'test@example.com',
    source: 'signup_form',
  });

  await expect(
    db.insert(contacts).values({
      kind: 'email',
      value: 'test@example.com',
      source: 'manual',
    })
  ).rejects.toThrow(/unique constraint/i);
});
```

**Test 10.2:** Allows same value for different kinds
```typescript
it('allows same value for email and phone kinds', async () => {
  await db.insert(contacts).values({
    kind: 'email',
    value: 'contact@example.com',
    source: 'signup_form',
  });

  // Same value but different kind should succeed
  await expect(
    db.insert(contacts).values({
      kind: 'phone',
      value: 'contact@example.com', // Weird but valid
      source: 'manual',
    })
  ).resolves.toBeDefined();
});
```

**Test 10.3:** Enforces single primary per user+kind
```typescript
it('enforces single primary contact per user+kind', async () => {
  const userId = 'test-user-id';

  await db.insert(contacts).values({
    userId,
    kind: 'email',
    value: 'primary@example.com',
    isPrimary: true,
    source: 'auth',
  });

  await expect(
    db.insert(contacts).values({
      userId,
      kind: 'email',
      value: 'secondary@example.com',
      isPrimary: true,
      source: 'manual',
    })
  ).rejects.toThrow(/unique constraint.*primary/i);
});
```

**Test 10.4:** Allows multiple non-primary contacts
```typescript
it('allows multiple non-primary contacts per user', async () => {
  const userId = 'test-user-id';

  await db.insert(contacts).values({
    userId,
    kind: 'email',
    value: 'email1@example.com',
    isPrimary: false,
    source: 'auth',
  });

  await expect(
    db.insert(contacts).values({
      userId,
      kind: 'email',
      value: 'email2@example.com',
      isPrimary: false,
      source: 'manual',
    })
  ).resolves.toBeDefined();
});
```

**Test 10.5:** Cascades delete from user to contacts
```typescript
it('cascades delete from user to contacts', async () => {
  const [user] = await db.insert(users).values({
    kratosId: 'test-kratos-id',
    email: 'user@example.com',
    role: 'customer',
  }).returning();

  const [contact] = await db.insert(contacts).values({
    userId: user.id,
    kind: 'email',
    value: 'user@example.com',
    source: 'auth',
  }).returning();

  // Delete user
  await db.delete(users).where(eq(users.id, user.id));

  // Contact should be deleted
  const contactExists = await db.query.contacts.findFirst({
    where: eq(contacts.id, contact.id),
  });

  expect(contactExists).toBeUndefined();
});
```

**Test 10.6:** Cascades delete from contact to subscriptions
```typescript
it('cascades delete from contact to subscriptions', async () => {
  const [contact] = await db.insert(contacts).values({
    kind: 'email',
    value: 'test@example.com',
    source: 'signup_form',
  }).returning();

  const [list] = await db.query.mailingLists.findFirst({
    where: eq(mailingLists.slug, 'newsletter'),
  });

  const [subscription] = await db.insert(contactSubscriptions).values({
    contactId: contact.id,
    mailingListId: list.id,
    status: 'subscribed',
  }).returning();

  // Delete contact
  await db.delete(contacts).where(eq(contacts.id, contact.id));

  // Subscription should be deleted
  const subscriptionExists = await db.query.contactSubscriptions.findFirst({
    where: eq(contactSubscriptions.id, subscription.id),
  });

  expect(subscriptionExists).toBeUndefined();
});
```

**Test 10.7:** Enforces unique subscription per contact+list
```typescript
it('enforces unique subscription per contact+list', async () => {
  const [contact] = await db.insert(contacts).values({
    kind: 'email',
    value: 'test@example.com',
    source: 'signup_form',
  }).returning();

  const [list] = await db.query.mailingLists.findFirst({
    where: eq(mailingLists.slug, 'newsletter'),
  });

  await db.insert(contactSubscriptions).values({
    contactId: contact.id,
    mailingListId: list.id,
    status: 'subscribed',
  });

  await expect(
    db.insert(contactSubscriptions).values({
      contactId: contact.id,
      mailingListId: list.id,
      status: 'pending',
    })
  ).rejects.toThrow(/unique constraint/i);
});
```

**Test 10.8:** Updates updated_at trigger on contact
```typescript
it('updates updated_at timestamp on contact update', async () => {
  const [contact] = await db.insert(contacts).values({
    kind: 'email',
    value: 'test@example.com',
    source: 'signup_form',
  }).returning();

  const originalUpdatedAt = contact.updatedAt;

  // Wait 1ms to ensure timestamp difference
  await new Promise(resolve => setTimeout(resolve, 1));

  await db.update(contacts)
    .set({ isVerified: true })
    .where(eq(contacts.id, contact.id));

  const [updated] = await db.select()
    .from(contacts)
    .where(eq(contacts.id, contact.id));

  expect(updated.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
});
```

---

### Test Suite 11: GDPR Compliance (Integration Tests)

**File:** `tests/integration/lib/gdpr/export-delete.test.ts`

**Test 11.1:** Exports all user contact data
```typescript
it('exports all contact data for user', async () => {
  const [user] = await db.insert(users).values({
    kratosId: 'test-kratos-id',
    email: 'user@example.com',
    role: 'customer',
  }).returning();

  const [contact] = await db.insert(contacts).values({
    userId: user.id,
    kind: 'email',
    value: 'user@example.com',
    source: 'auth',
    isVerified: true,
    verifiedAt: new Date(),
  }).returning();

  const [list] = await db.query.mailingLists.findFirst({
    where: eq(mailingLists.slug, 'newsletter'),
  });

  await db.insert(contactSubscriptions).values({
    contactId: contact.id,
    mailingListId: list.id,
    status: 'subscribed',
    optInAt: new Date(),
  });

  const exportData = await exportContactData(user.id);

  expect(exportData.contacts).toHaveLength(1);
  expect(exportData.contacts[0]).toMatchObject({
    value: 'user@example.com',
    kind: 'email',
    isVerified: true,
  });
  expect(exportData.contacts[0].subscriptions).toHaveLength(1);
  expect(exportData.contacts[0].subscriptions[0]).toMatchObject({
    list: 'Newsletter',
    status: 'subscribed',
  });
});
```

**Test 11.2:** Deletes all user contact data
```typescript
it('deletes all contact data for user (right to be forgotten)', async () => {
  const [user] = await db.insert(users).values({
    kratosId: 'test-kratos-id',
    email: 'user@example.com',
    role: 'customer',
  }).returning();

  const [contact] = await db.insert(contacts).values({
    userId: user.id,
    kind: 'email',
    value: 'user@example.com',
    source: 'auth',
  }).returning();

  const [list] = await db.query.mailingLists.findFirst({
    where: eq(mailingLists.slug, 'newsletter'),
  });

  await db.insert(contactSubscriptions).values({
    contactId: contact.id,
    mailingListId: list.id,
    status: 'subscribed',
  });

  await deleteContactData(user.id);

  // Contact should be deleted
  const contactExists = await db.query.contacts.findFirst({
    where: eq(contacts.id, contact.id),
  });

  expect(contactExists).toBeUndefined();

  // Subscription should be cascade deleted
  const subscriptionExists = await db.query.contactSubscriptions.findFirst({
    where: eq(contactSubscriptions.contactId, contact.id),
  });

  expect(subscriptionExists).toBeUndefined();
});
```

**Test 11.3:** Exports subscription history
```typescript
it('exports subscription history with timestamps', async () => {
  const [user] = await db.insert(users).values({
    kratosId: 'test-kratos-id',
    email: 'user@example.com',
    role: 'customer',
  }).returning();

  const [contact] = await db.insert(contacts).values({
    userId: user.id,
    kind: 'email',
    value: 'user@example.com',
    source: 'auth',
  }).returning();

  const [list] = await db.query.mailingLists.findFirst({
    where: eq(mailingLists.slug, 'newsletter'),
  });

  await db.insert(contactSubscriptions).values({
    contactId: contact.id,
    mailingListId: list.id,
    status: 'unsubscribed',
    optInAt: new Date('2025-01-01'),
    optOutAt: new Date('2025-02-01'),
  });

  const exportData = await exportContactData(user.id);

  expect(exportData.contacts[0].subscriptions[0]).toMatchObject({
    optInAt: expect.any(Date),
    optOutAt: expect.any(Date),
  });
});
```

---

### Test Suite 12: E2E - Email Signup Flow (E2E Tests)

**File:** `tests/e2e/contacts/email-signup-flow.test.ts`

**Test 12.1:** Complete double opt-in flow (guest)
```typescript
it('completes full guest email signup with verification', async ({ page }) => {
  // Navigate to homepage
  await page.goto('/');

  // Fill in footer email signup
  await page.fill('input[name="email"]', 'e2e-test@example.com');
  await page.click('button[type="submit"]');

  // Should show success message
  await expect(page.locator('text=Check your email')).toBeVisible();

  // Check database for pending subscription
  const contact = await db.query.contacts.findFirst({
    where: eq(contacts.value, 'e2e-test@example.com'),
  });

  expect(contact).toBeDefined();
  expect(contact.isVerified).toBe(false);

  const subscription = await db.query.contactSubscriptions.findFirst({
    where: eq(contactSubscriptions.contactId, contact.id),
  });

  expect(subscription.status).toBe('pending');

  // Get verification token
  const token = await db.query.contactVerificationTokens.findFirst({
    where: eq(contactVerificationTokens.contactId, contact.id),
  });

  // Click verification link
  await page.goto(`/api/verify-email?token=${token.token}`);

  // Should redirect to confirmation page
  await expect(page).toHaveURL('/subscribe/confirmed');
  await expect(page.locator('text=confirmed')).toBeVisible();

  // Check database for verified subscription
  const updatedContact = await db.query.contacts.findFirst({
    where: eq(contacts.id, contact.id),
  });

  expect(updatedContact.isVerified).toBe(true);

  const updatedSubscription = await db.query.contactSubscriptions.findFirst({
    where: eq(contactSubscriptions.contactId, contact.id),
  });

  expect(updatedSubscription.status).toBe('subscribed');
});
```

**Test 12.2:** Signup and then create account (merge flow)
```typescript
it('merges guest contact when user creates account', async ({ page }) => {
  const email = 'merge-test@example.com';

  // Guest subscribes via footer
  await page.goto('/');
  await page.fill('input[name="email"]', email);
  await page.click('button[type="submit"]');

  await expect(page.locator('text=Check your email')).toBeVisible();

  // Get guest contact ID
  const guestContact = await db.query.contacts.findFirst({
    where: eq(contacts.value, email),
  });

  expect(guestContact.userId).toBeNull();

  // User creates account with same email
  await page.goto('/auth/signup');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', 'SecurePassword123!');
  await page.click('button[type="submit"]');

  // Wait for Ory webhook to sync
  await page.waitForTimeout(1000);

  // Contact should now be linked to user
  const linkedContact = await db.query.contacts.findFirst({
    where: eq(contacts.id, guestContact.id),
  });

  expect(linkedContact.userId).toBeDefined();
  expect(linkedContact.isPrimary).toBe(true);
});
```

**Test 12.3:** Unsubscribe via link
```typescript
it('unsubscribes via one-click unsubscribe link', async ({ page }) => {
  const contact = await createContact({
    kind: 'email',
    value: 'unsubscribe-test@example.com',
    source: 'signup_form',
  });

  const list = await db.query.mailingLists.findFirst({
    where: eq(mailingLists.slug, 'newsletter'),
  });

  await subscribeToList(contact.id, list.id);
  await confirmSubscription(contact.id, list.id);

  // Visit unsubscribe page
  await page.goto(`/unsubscribe?email=${contact.value}&list=${list.slug}`);

  // Should show unsubscribe confirmation
  await expect(page.locator('text=Unsubscribe')).toBeVisible();

  // Click confirm unsubscribe
  await page.click('button:has-text("Confirm")');

  // Should show success message
  await expect(page.locator('text=successfully unsubscribed')).toBeVisible();

  // Check database
  const subscription = await db.query.contactSubscriptions.findFirst({
    where: and(
      eq(contactSubscriptions.contactId, contact.id),
      eq(contactSubscriptions.mailingListId, list.id)
    ),
  });

  expect(subscription.status).toBe('unsubscribed');
});
```

---

### Test Suite 13: Seed Data Verification (Integration Tests)

**File:** `tests/integration/db/contacts-seed.test.ts`

**Test 13.1:** Seeds default mailing lists
```typescript
it('seeds 4 default mailing lists', async () => {
  await seedMailingLists();

  const lists = await db.query.mailingLists.findMany();

  expect(lists).toHaveLength(4);

  const slugs = lists.map(l => l.slug);
  expect(slugs).toContain('newsletter');
  expect(slugs).toContain('product-alerts');
  expect(slugs).toContain('order-updates');
  expect(slugs).toContain('sms-alerts');
});
```

**Test 13.2:** Marks order-updates as default list
```typescript
it('marks order-updates as default list', async () => {
  await seedMailingLists();

  const orderUpdatesList = await db.query.mailingLists.findFirst({
    where: eq(mailingLists.slug, 'order-updates'),
  });

  expect(orderUpdatesList.isDefault).toBe(true);
});
```

**Test 13.3:** SMS list is inactive
```typescript
it('creates SMS list as inactive', async () => {
  await seedMailingLists();

  const smsList = await db.query.mailingLists.findFirst({
    where: eq(mailingLists.slug, 'sms-alerts'),
  });

  expect(smsList.isActive).toBe(false);
});
```

---

## Test Specification Summary

| Phase/Feature | Unit | Integration | E2E | Total | Test Files |
|---------------|------|-------------|-----|-------|------------|
| **Validation & Normalization** | 8 | 0 | 0 | 8 | validate-contact.test.ts |
| **Contact Creation** | 7 | 0 | 0 | 7 | create-contact.test.ts |
| **Subscription Management** | 5 | 0 | 0 | 5 | subscribe.test.ts |
| **Email Verification** | 0 | 7 | 0 | 7 | verify-email.test.ts |
| **Ory Contact Sync** | 0 | 5 | 0 | 5 | sync-ory-contact.test.ts |
| **API: Subscribe Route** | 0 | 8 | 0 | 8 | subscribe-route.test.ts |
| **API: Verify Email Route** | 0 | 5 | 0 | 5 | verify-email-route.test.ts |
| **API: Unsubscribe Route** | 0 | 4 | 0 | 4 | unsubscribe-route.test.ts |
| **SendGrid Webhooks** | 0 | 5 | 0 | 5 | sendgrid-webhook.test.ts |
| **Database Constraints** | 0 | 8 | 0 | 8 | contacts-constraints.test.ts |
| **GDPR Compliance** | 0 | 3 | 0 | 3 | export-delete.test.ts |
| **E2E: Signup Flow** | 0 | 0 | 3 | 3 | email-signup-flow.test.ts |
| **Seed Data** | 0 | 3 | 0 | 3 | contacts-seed.test.ts |
| **Admin: Manage Contacts** | 0 | 4 | 1 | 5 | admin-contacts.test.ts |
| **Preference Center** | 0 | 3 | 1 | 4 | preference-center.test.ts |
| **TOTAL** | **25** | **55** | **5** | **85** | **15 files** |

**Coverage Targets:**
- **Overall:** >70%
- **lib/contacts/** → >80%
- **app/api/subscribe/** → >75%
- **lib/gdpr/** → >90%

---

## Migration Script

**File:** `db/migrations/XXXX_add_contacts_tables.sql`

```sql
-- Phase 4.4.1.1: Contacts & Mailing Lists Schema
-- Email/phone contact management with mailing list subscriptions

-- Contacts table (email/phone that can be linked to users or standalone)
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  kind TEXT NOT NULL CHECK (kind IN ('email', 'phone')),
  value TEXT NOT NULL,

  is_primary BOOLEAN NOT NULL DEFAULT false,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  verified_at TIMESTAMP,

  source TEXT NOT NULL CHECK (source IN ('auth', 'signup_form', 'order', 'manual', 'import')),

  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  UNIQUE (value, kind)
);

CREATE INDEX idx_contacts_user ON contacts(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_contacts_kind ON contacts(kind);
CREATE INDEX idx_contacts_value ON contacts(value);
CREATE INDEX idx_contacts_verified ON contacts(is_verified) WHERE is_verified = true;
CREATE INDEX idx_contacts_source ON contacts(source);

CREATE UNIQUE INDEX uniq_contacts_primary_per_kind
  ON contacts(user_id, kind)
  WHERE is_primary = true AND user_id IS NOT NULL;

CREATE TRIGGER contacts_updated_at
BEFORE UPDATE ON contacts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Mailing lists table
CREATE TABLE mailing_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,

  kind TEXT NOT NULL DEFAULT 'email' CHECK (kind IN ('email', 'sms', 'both')),

  is_default BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,

  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mailing_lists_slug ON mailing_lists(slug);
CREATE INDEX idx_mailing_lists_active ON mailing_lists(is_active) WHERE is_active = true;
CREATE INDEX idx_mailing_lists_default ON mailing_lists(is_default) WHERE is_default = true;

CREATE TRIGGER mailing_lists_updated_at
BEFORE UPDATE ON mailing_lists
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Contact subscriptions table
CREATE TABLE contact_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  mailing_list_id UUID NOT NULL REFERENCES mailing_lists(id) ON DELETE CASCADE,

  status TEXT NOT NULL CHECK (status IN ('pending', 'subscribed', 'unsubscribed', 'bounced')),

  opt_in_at TIMESTAMP,
  opt_in_ip TEXT,
  opt_in_user_agent TEXT,

  opt_out_at TIMESTAMP,
  opt_out_reason TEXT,

  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  UNIQUE (contact_id, mailing_list_id)
);

CREATE INDEX idx_subscriptions_contact ON contact_subscriptions(contact_id);
CREATE INDEX idx_subscriptions_list ON contact_subscriptions(mailing_list_id);
CREATE INDEX idx_subscriptions_status ON contact_subscriptions(status);
CREATE INDEX idx_subscriptions_pending ON contact_subscriptions(status, created_at) WHERE status = 'pending';

CREATE TRIGGER contact_subscriptions_updated_at
BEFORE UPDATE ON contact_subscriptions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Contact verification tokens table
CREATE TABLE contact_verification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  mailing_list_id UUID REFERENCES mailing_lists(id) ON DELETE CASCADE,

  token TEXT NOT NULL UNIQUE,

  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,

  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_verification_tokens_contact ON contact_verification_tokens(contact_id);
CREATE INDEX idx_verification_tokens_token ON contact_verification_tokens(token);
CREATE INDEX idx_verification_tokens_expires ON contact_verification_tokens(expires_at);
```

---

## Seed Data

**File:** `scripts/seed-contacts.ts`

```typescript
import { db } from '@/db';
import { mailingLists } from '@/db/schema-contacts';

export async function seedMailingLists() {
  console.log('Seeding mailing lists...');

  const lists = [
    {
      slug: 'newsletter',
      name: 'Newsletter',
      description: 'Monthly updates about new products and company news',
      kind: 'email' as const,
      isDefault: false,
      isActive: true,
      metadata: {
        sendFrequency: 'monthly',
        defaultFromName: 'Imajin',
        defaultFromEmail: 'newsletter@imajin.ca',
      },
    },
    {
      slug: 'product-alerts',
      name: 'Product Alerts',
      description: 'Get notified when new products launch or restock',
      kind: 'email' as const,
      isDefault: false,
      isActive: true,
      metadata: {
        sendFrequency: 'event-driven',
        defaultFromName: 'Imajin',
        defaultFromEmail: 'alerts@imajin.ca',
      },
    },
    {
      slug: 'order-updates',
      name: 'Order Updates',
      description: 'Transactional emails about your orders (required)',
      kind: 'email' as const,
      isDefault: true,  // Auto-subscribe
      isActive: true,
      metadata: {
        sendFrequency: 'event-driven',
        defaultFromName: 'Imajin',
        defaultFromEmail: 'orders@imajin.ca',
      },
    },
    {
      slug: 'sms-alerts',
      name: 'SMS Alerts',
      description: 'Urgent notifications via text message',
      kind: 'sms' as const,
      isDefault: false,
      isActive: false,  // Not launched yet
      metadata: {
        sendFrequency: 'event-driven',
      },
    },
  ];

  for (const list of lists) {
    await db.insert(mailingLists).values(list).onConflictDoNothing();
    console.log(`✅ Mailing list created: ${list.name}`);
  }

  console.log('✅ Mailing lists seeded successfully');
}
```

**Add to main seed script:**

```typescript
// db/seed.ts
import { seedMailingLists } from '../scripts/seed-contacts';

async function main() {
  // ... existing seeds

  await seedMailingLists();
}
```

---

## Implementation Steps (TDD Workflow)

**Total Estimated Time:** ~3 hours (schema + tests + implementation + validation)

**Testing Approach:** Write tests FIRST (RED), implement to pass (GREEN), then refactor (REFACTOR).

---

### Step 1: Create Drizzle Schema (30 min) - No TDD

**Note:** Schema creation doesn't follow TDD (no tests for schema files).

- [ ] Create `db/schema-contacts.ts` with all 4 tables:
  - `contacts` - Email/phone with nullable user_id
  - `mailingLists` - List definitions (4 default lists)
  - `contactSubscriptions` - Consent tracking
  - `contactVerificationTokens` - Double opt-in tokens
- [ ] Define TypeScript types:
  - `ContactMetadata` (bounce tracking, GDPR consent, locale)
  - `MailingListMetadata` (SendGrid integration, campaign settings)
  - `SubscriptionMetadata` (bounce/complaint details, history)
- [ ] Add relations to `users` table from `db/schema-auth.ts`
- [ ] Export all tables and types

**Validation:**
- [ ] TypeScript: 0 errors in schema file
- [ ] All imports resolve correctly

---

### Step 2: Generate Migration (20 min) - No TDD

- [ ] Run: `npx drizzle-kit generate:pg`
- [ ] Review generated SQL migration file
- [ ] Manually adjust migration SQL:
  - Add CHECK constraints for `kind`, `status`, `source` enums
  - Ensure all indexes created (16 total)
  - Add comments to tables/columns
- [ ] Save as `db/migrations/XXXX_add_contacts_tables.sql`

**Validation:**
- [ ] SQL syntax valid (no errors)
- [ ] All 4 tables included
- [ ] All triggers included (updated_at for 3 tables)

---

### Step 3: Run Migration (15 min) - No TDD

- [ ] Run migration on dev database: `npm run db:migrate`
- [ ] Verify tables in Drizzle Studio:
  - contacts (12 columns)
  - mailing_lists (10 columns)
  - contact_subscriptions (12 columns)
  - contact_verification_tokens (6 columns)
- [ ] Run migration on test database: `NODE_ENV=test npm run db:migrate`
- [ ] Verify test database has all tables

**Validation:**
- [ ] All 4 tables exist
- [ ] All indexes created
- [ ] All triggers working

---

### Step 4: Create Seed Script (20 min) - No TDD

- [ ] Create `scripts/seed-contacts.ts`
- [ ] Add seed function for 4 default mailing lists:
  - `newsletter` (isDefault=false, isActive=true)
  - `product-alerts` (isDefault=false, isActive=true)
  - `order-updates` (isDefault=**true**, isActive=true) ← Auto-subscribe
  - `sms-alerts` (isDefault=false, isActive=**false**) ← Future feature
- [ ] Integrate with main seed script (`db/seed.ts`)
- [ ] Run seed: `npm run seed`

**Validation:**
- [ ] 4 lists exist in database
- [ ] `order-updates` marked as default
- [ ] `sms-alerts` marked as inactive

---

### Step 5: Validation & Normalization Functions (30 min) - TDD

**📍 Start: Test Suite 1 (8 tests)**

#### RED Phase (10 min) - Write Failing Tests

- [ ] Create `tests/unit/lib/contacts/validate-contact.test.ts`
- [ ] Write all 8 tests from Test Suite 1:
  - Test 1.1-1.4: Email/phone validation
  - Test 1.5-1.6: Normalization
  - Test 1.7-1.8: Input validation
- [ ] Run: `npm run test:unit -- validate-contact`
- [ ] **EXPECT: 8 FAILING** (functions don't exist yet)

#### GREEN Phase (15 min) - Implement to Pass

- [ ] Create `lib/contacts/validate-contact.ts`
- [ ] Implement functions:
  - `validateEmail(email: string): boolean`
  - `validatePhone(phone: string): boolean`
  - `normalizeContact(kind, value): string`
  - `validateContactInput(data): ValidationResult`
- [ ] Run: `npm run test:unit -- validate-contact`
- [ ] **EXPECT: 8 PASSING**

#### REFACTOR Phase (5 min) - Clean Up

- [ ] Extract email regex to constant
- [ ] Add JSDoc comments
- [ ] Run: `npm run test:unit -- validate-contact`
- [ ] **MUST STAY GREEN: 8 PASSING**

**Phase Gate:**
- [ ] 8/8 tests passing
- [ ] TypeScript: 0 errors
- [ ] Coverage: >80% for validate-contact.ts

---

### Step 6: Contact Creation Functions (45 min) - TDD

**📍 Start: Test Suite 2 (7 tests) + Test Suite 3 (5 tests)**

#### RED Phase (15 min) - Write Failing Tests

- [ ] Create `tests/unit/lib/contacts/create-contact.test.ts`
- [ ] Write all 7 tests from Test Suite 2 (contact creation)
- [ ] Create `tests/unit/lib/contacts/subscribe.test.ts`
- [ ] Write all 5 tests from Test Suite 3 (subscription management)
- [ ] Run: `npm run test:unit -- create-contact subscribe`
- [ ] **EXPECT: 12 FAILING**

#### GREEN Phase (25 min) - Implement to Pass

- [ ] Create `lib/contacts/create-contact.ts`:
  - `createContact(data: ContactInput): Promise<Contact>`
  - Validates input, normalizes email, inserts to DB
- [ ] Create `lib/contacts/subscribe.ts`:
  - `subscribeToList(contactId, listId): Promise<Subscription>`
  - `confirmSubscription(contactId, listId, metadata): Promise<Subscription>`
  - `unsubscribeFromList(contactId, listId, reason): Promise<Subscription>`
- [ ] Run: `npm run test:unit -- create-contact subscribe`
- [ ] **EXPECT: 12 PASSING**

#### REFACTOR Phase (5 min) - Clean Up

- [ ] Extract duplicate validation logic
- [ ] Add error handling
- [ ] Run: `npm run test:unit -- create-contact subscribe`
- [ ] **MUST STAY GREEN: 12 PASSING**

**Phase Gate:**
- [ ] 12/12 tests passing
- [ ] TypeScript: 0 errors
- [ ] Coverage: >80% for lib/contacts/*.ts

---

### Step 7: Email Verification & Ory Sync (50 min) - TDD

**📍 Start: Test Suite 4 (7 tests) + Test Suite 5 (5 tests)**

#### RED Phase (15 min) - Write Failing Tests

- [ ] Create `tests/integration/lib/contacts/verify-email.test.ts`
- [ ] Write all 7 tests from Test Suite 4 (verification)
- [ ] Create `tests/integration/lib/contacts/sync-ory-contact.test.ts`
- [ ] Write all 5 tests from Test Suite 5 (Ory sync)
- [ ] Run: `npm run test:integration -- verify-email sync-ory`
- [ ] **EXPECT: 12 FAILING**

#### GREEN Phase (30 min) - Implement to Pass

- [ ] Create `lib/contacts/verify-email.ts`:
  - `createVerificationToken(contactId, listId): Promise<Token>`
  - `verifyEmail(token: string): Promise<{contact, subscription}>`
  - Rate limiting logic (3 tokens/minute)
- [ ] Create `lib/contacts/sync-ory-contact.ts`:
  - `syncOryContactToLocal(userId, email, optIn): Promise<string>`
  - Check for existing guest contact
  - Link contact to user if exists
  - Create subscriptions if opted in
- [ ] Run: `npm run test:integration -- verify-email sync-ory`
- [ ] **EXPECT: 12 PASSING**

#### REFACTOR Phase (5 min) - Clean Up

- [ ] Extract token generation to utility
- [ ] Add transaction for sync operations
- [ ] Run: `npm run test:integration -- verify-email sync-ory`
- [ ] **MUST STAY GREEN: 12 PASSING**

**Phase Gate:**
- [ ] 12/12 integration tests passing
- [ ] TypeScript: 0 errors
- [ ] Database operations use transactions

---

### Step 8: API Routes (60 min) - TDD

**📍 Start: Test Suite 6 (8 tests) + Test Suite 7 (5 tests) + Test Suite 8 (4 tests)**

#### RED Phase (20 min) - Write Failing Tests

- [ ] Create `tests/integration/api/subscribe.test.ts` (8 tests)
- [ ] Create `tests/integration/api/verify-email.test.ts` (5 tests)
- [ ] Create `tests/integration/api/unsubscribe.test.ts` (4 tests)
- [ ] Run: `npm run test:integration -- api/subscribe api/verify-email api/unsubscribe`
- [ ] **EXPECT: 17 FAILING**

#### GREEN Phase (35 min) - Implement to Pass

- [ ] Create `app/api/subscribe/route.ts`:
  - POST handler
  - Validate email, create contact, create subscription, send verification
- [ ] Create `app/api/verify-email/route.ts`:
  - GET handler with token query param
  - Verify token, update contact/subscription, redirect
- [ ] Create `app/api/unsubscribe/route.ts`:
  - POST handler
  - Update subscription status, preserve history
- [ ] Run: `npm run test:integration -- api/`
- [ ] **EXPECT: 17 PASSING**

#### REFACTOR Phase (5 min) - Clean Up

- [ ] Extract common validation logic
- [ ] Standardize error responses
- [ ] Run: `npm run test:integration -- api/`
- [ ] **MUST STAY GREEN: 17 PASSING**

**Phase Gate:**
- [ ] 17/17 API tests passing
- [ ] All routes return correct status codes
- [ ] Error handling comprehensive

---

### Step 9: SendGrid Webhook Handler (30 min) - TDD

**📍 Start: Test Suite 9 (5 tests)**

#### RED Phase (10 min) - Write Failing Tests

- [ ] Create `tests/integration/api/webhooks/sendgrid.test.ts`
- [ ] Write all 5 tests from Test Suite 9
- [ ] Run: `npm run test:integration -- webhooks/sendgrid`
- [ ] **EXPECT: 5 FAILING**

#### GREEN Phase (15 min) - Implement to Pass

- [ ] Create `app/api/webhooks/sendgrid/route.ts`:
  - POST handler accepting array of events
  - Handle: bounce (hard), spamreport
  - Ignore: bounce (soft)
  - Update contacts/subscriptions accordingly
- [ ] Run: `npm run test:integration -- webhooks/sendgrid`
- [ ] **EXPECT: 5 PASSING**

#### REFACTOR Phase (5 min) - Clean Up

- [ ] Extract event handlers to separate functions
- [ ] Add logging for webhook events
- [ ] Run: `npm run test:integration -- webhooks/sendgrid`
- [ ] **MUST STAY GREEN: 5 PASSING**

**Phase Gate:**
- [ ] 5/5 webhook tests passing
- [ ] All SendGrid event types handled

---

### Step 10: Database Constraints & GDPR (40 min) - TDD

**📍 Start: Test Suite 10 (8 tests) + Test Suite 11 (3 tests)**

#### RED Phase (15 min) - Write Failing Tests

- [ ] Create `tests/integration/db/contacts-constraints.test.ts` (8 tests)
- [ ] Create `tests/integration/lib/gdpr/export-delete.test.ts` (3 tests)
- [ ] Run: `npm run test:integration -- db/contacts-constraints gdpr/`
- [ ] **EXPECT: 11 FAILING**

#### GREEN Phase (20 min) - Implement to Pass

- [ ] Constraints already enforced by migration (tests should pass)
- [ ] Create `lib/gdpr/export-contact-data.ts`:
  - `exportContactData(userId): Promise<ContactExportData>`
- [ ] Create `lib/gdpr/delete-contact-data.ts`:
  - `deleteContactData(userId): Promise<void>`
- [ ] Run: `npm run test:integration -- db/contacts-constraints gdpr/`
- [ ] **EXPECT: 11 PASSING**

#### REFACTOR Phase (5 min) - Clean Up

- [ ] Add GDPR audit logging
- [ ] Run: `npm run test:integration -- db/contacts-constraints gdpr/`
- [ ] **MUST STAY GREEN: 11 PASSING**

**Phase Gate:**
- [ ] 11/11 tests passing
- [ ] All database constraints working
- [ ] GDPR export/delete functional

---

### Step 11: E2E Testing (30 min) - TDD

**📍 Start: Test Suite 12 (3 tests) + Test Suite 13 (3 tests)**

#### RED Phase (10 min) - Write Failing Tests

- [ ] Create `tests/e2e/contacts/email-signup-flow.test.ts` (3 tests)
- [ ] Create `tests/integration/db/contacts-seed.test.ts` (3 tests)
- [ ] Run: `npm run test:e2e -- contacts/` and `npm run test:integration -- contacts-seed`
- [ ] **EXPECT: 6 FAILING**

#### GREEN Phase (15 min) - Implement to Pass

- [ ] E2E tests should pass (routes already implemented)
- [ ] Seed tests should pass (seed script already created)
- [ ] Fix any UI issues found during E2E
- [ ] Run: `npm run test:e2e -- contacts/` and `npm run test:integration -- contacts-seed`
- [ ] **EXPECT: 6 PASSING**

#### REFACTOR Phase (5 min) - Clean Up

- [ ] Improve E2E test stability
- [ ] Run: `npm run test:e2e -- contacts/`
- [ ] **MUST STAY GREEN: 6 PASSING**

**Phase Gate:**
- [ ] 6/6 E2E tests passing
- [ ] Full signup flow works end-to-end
- [ ] Seed data verified

---

### Step 12: Final Validation (20 min)

- [ ] Run full test suite: `npm run test && npm run test:e2e`
- [ ] **EXPECT: 80/85 tests passing** (5 admin/preference tests not implemented yet)
- [ ] Check coverage: `npm run test:coverage`
- [ ] **EXPECT: lib/contacts >80%, api/subscribe >75%, lib/gdpr >90%**
- [ ] Manual test in browser:
  - Subscribe via footer → verify email → check database
  - Unsubscribe → verify status changed
  - Create account after guest signup → verify merge
- [ ] Run TypeScript: `npm run type-check` → 0 errors
- [ ] Run lint: `npm run lint` → 0 warnings

---

## Phase Gate Criteria

**Phase 4.4.1.1 Complete When:**

### Tests
- [ ] **80/85 tests passing** (25 unit, 53 integration, 5 E2E, 3 seed)
  - Note: 5 admin/preference tests intentionally deferred (future feature)
- [ ] Test breakdown by file:
  - [ ] validate-contact.test.ts: 8/8 passing
  - [ ] create-contact.test.ts: 7/7 passing
  - [ ] subscribe.test.ts: 5/5 passing
  - [ ] verify-email.test.ts: 7/7 passing
  - [ ] sync-ory-contact.test.ts: 5/5 passing
  - [ ] subscribe-route.test.ts: 8/8 passing
  - [ ] verify-email-route.test.ts: 5/5 passing
  - [ ] unsubscribe-route.test.ts: 4/4 passing
  - [ ] sendgrid-webhook.test.ts: 5/5 passing
  - [ ] contacts-constraints.test.ts: 8/8 passing
  - [ ] export-delete.test.ts: 3/3 passing
  - [ ] email-signup-flow.test.ts: 3/3 passing
  - [ ] contacts-seed.test.ts: 3/3 passing

### Code Quality
- [ ] **TypeScript:** 0 errors (`npm run type-check`)
- [ ] **Linting:** 0 warnings (`npm run lint`)
- [ ] **Code Coverage:**
  - [ ] Overall: >70%
  - [ ] lib/contacts/: >80%
  - [ ] app/api/subscribe/: >75%
  - [ ] lib/gdpr/: >90%

### Database
- [ ] **4 tables created:**
  - [ ] contacts (12 columns, 7 indexes)
  - [ ] mailing_lists (10 columns, 3 indexes)
  - [ ] contact_subscriptions (12 columns, 4 indexes)
  - [ ] contact_verification_tokens (6 columns, 3 indexes)
- [ ] **All constraints working:**
  - [ ] Unique constraint on value+kind
  - [ ] Single primary per user+kind
  - [ ] Unique subscription per contact+list
  - [ ] Cascade deletes (user → contacts → subscriptions)
- [ ] **4 default mailing lists seeded:**
  - [ ] newsletter (active)
  - [ ] product-alerts (active)
  - [ ] order-updates (default, active)
  - [ ] sms-alerts (inactive)

### Functionality
- [ ] **Email signup flow works end-to-end:**
  - [ ] Guest submits email via footer
  - [ ] Verification email sent with token
  - [ ] Token verification updates contact + subscription
  - [ ] Status changes: pending → subscribed
- [ ] **Contact merge works:**
  - [ ] Guest email signup creates contact (user_id = NULL)
  - [ ] User creates account with same email
  - [ ] Contact links to user (user_id populated)
  - [ ] Subscriptions preserved
- [ ] **Unsubscribe works:**
  - [ ] Status changes: subscribed → unsubscribed
  - [ ] History preserved (no hard delete)
  - [ ] Re-subscription allowed
- [ ] **SendGrid webhooks work:**
  - [ ] Hard bounce → status = bounced
  - [ ] Spam complaint → status = bounced
  - [ ] Soft bounce → ignored
- [ ] **GDPR compliance:**
  - [ ] Export contact data works
  - [ ] Delete contact data works (cascade)
  - [ ] Consent timestamps recorded (opt_in_at, opt_out_at)
  - [ ] Audit trail complete (IP, user agent)

### Integration
- [ ] **Ory sync works:**
  - [ ] New user → creates contact with is_verified=true
  - [ ] Existing guest contact → links to user
  - [ ] Marketing opt-in → creates newsletter subscription
  - [ ] Auto-subscribes to default lists (order-updates)
- [ ] **API routes return correct status codes:**
  - [ ] POST /api/subscribe → 200 (success), 400 (invalid), 404 (list not found)
  - [ ] GET /api/verify-email → 302 (redirect), 400 (invalid/expired token)
  - [ ] POST /api/unsubscribe → 200 (success), 404 (not found)
  - [ ] POST /api/webhooks/sendgrid → 200 (always)

### Manual Validation
- [ ] Drizzle Studio shows all 4 tables with correct schema
- [ ] Can create contact via API and see in database
- [ ] Can verify email via link and status changes
- [ ] Can unsubscribe and re-subscribe
- [ ] Verification tokens expire after 24 hours

---

## Testing

### Manual Testing

```bash
# Run migration
npm run db:migrate

# Seed mailing lists
npm run seed

# Start Drizzle Studio
npm run db:studio

# Verify tables exist:
# - contacts (12 columns)
# - mailing_lists (9 columns)
# - contact_subscriptions (11 columns)
# - contact_verification_tokens (6 columns)

# Verify indexes exist (see migration SQL)

# Test unique constraints
# Try to insert duplicate email → should fail

# Test primary contact constraint
# Create user, add 2 emails, set both as primary → second should fail
```

### SQL Testing

```sql
-- Check mailing lists
SELECT id, slug, name, is_default, is_active FROM mailing_lists;

-- Create test contact (guest)
INSERT INTO contacts (kind, value, source)
VALUES ('email', 'test@example.com', 'signup_form')
RETURNING *;

-- Create test subscription
INSERT INTO contact_subscriptions (contact_id, mailing_list_id, status)
VALUES (
  (SELECT id FROM contacts WHERE value = 'test@example.com'),
  (SELECT id FROM mailing_lists WHERE slug = 'newsletter'),
  'pending'
)
RETURNING *;

-- Test primary contact constraint
-- Create user with 2 emails
INSERT INTO contacts (user_id, kind, value, is_primary, source)
VALUES
  ('USER_ID_HERE', 'email', 'primary@example.com', true, 'auth'),
  ('USER_ID_HERE', 'email', 'secondary@example.com', false, 'manual');

-- Try to set second as primary (should fail)
UPDATE contacts
SET is_primary = true
WHERE value = 'secondary@example.com';
-- ERROR: duplicate key value violates unique constraint "uniq_contacts_primary_per_kind"

-- Test cascade delete
DELETE FROM contacts WHERE value = 'test@example.com';
-- Should also delete subscriptions and tokens

-- Test verification flow
INSERT INTO contact_verification_tokens (contact_id, mailing_list_id, token, expires_at)
VALUES (
  (SELECT id FROM contacts WHERE value = 'test@example.com'),
  (SELECT id FROM mailing_lists WHERE slug = 'newsletter'),
  'test-token-12345',
  NOW() + INTERVAL '24 hours'
);

-- Mark as verified
UPDATE contacts
SET is_verified = true, verified_at = NOW()
WHERE value = 'test@example.com';

UPDATE contact_subscriptions
SET status = 'subscribed', opt_in_at = NOW()
WHERE contact_id = (SELECT id FROM contacts WHERE value = 'test@example.com');

UPDATE contact_verification_tokens
SET used_at = NOW()
WHERE token = 'test-token-12345';
```

### API Testing

```bash
# Test subscribe endpoint
curl -X POST http://localhost:30000/api/subscribe \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "listSlug": "newsletter"}'

# Expected response:
# {"message": "Verification email sent. Please check your inbox."}

# Test verify endpoint (use token from DB)
curl http://localhost:30000/api/verify-email?token=TOKEN_HERE

# Expected: Redirect to /subscribe/confirmed

# Test unsubscribe endpoint
curl -X POST http://localhost:30000/api/unsubscribe \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "listSlug": "newsletter"}'

# Expected: {"message": "Unsubscribed successfully"}
```

---

## Acceptance Criteria

- [ ] contacts table created with all columns and constraints
- [ ] mailing_lists table created with all columns
- [ ] contact_subscriptions table created with all columns and constraints
- [ ] contact_verification_tokens table created with all columns
- [ ] All indexes created (16 total indexes across 4 tables)
- [ ] Unique constraint enforced: same email/phone can't exist twice
- [ ] Primary contact constraint enforced: one primary per user+kind
- [ ] Cascade deletes working (delete user → contacts → subscriptions → tokens)
- [ ] Updated_at triggers working on all 3 main tables
- [ ] Seed script creates 4 default mailing lists
- [ ] TypeScript types defined (ContactMetadata, MailingListMetadata, SubscriptionMetadata)
- [ ] Helper functions created for common operations
- [ ] API routes created (/subscribe, /verify-email, /unsubscribe)
- [ ] Drizzle Studio shows all new tables with correct schema
- [ ] No TypeScript errors
- [ ] Migration runs cleanly on dev and test databases

---

## Rollback Plan

If migration fails or needs to be reverted:

```sql
-- Drop tables in dependency order
DROP TABLE IF EXISTS contact_verification_tokens CASCADE;
DROP TABLE IF EXISTS contact_subscriptions CASCADE;
DROP TABLE IF EXISTS mailing_lists CASCADE;
DROP TABLE IF EXISTS contacts CASCADE;
```

**Note:** Contacts system is independent of core auth. Rolling back won't affect users table or authentication flow.

---

## GDPR Compliance Checklist

- [ ] **Consent tracking:** opt_in_at, opt_in_ip, opt_in_user_agent recorded
- [ ] **Opt-out tracking:** opt_out_at, opt_out_reason recorded
- [ ] **Double opt-in:** Verification required before sending marketing emails
- [ ] **One-click unsubscribe:** Unsubscribe links in all marketing emails
- [ ] **Right to access:** Export all contact data (see exportContactData helper)
- [ ] **Right to be forgotten:** Delete all contact data (see deleteContactData helper)
- [ ] **Data minimization:** Only store necessary fields
- [ ] **Purpose limitation:** Each mailing list has clear description
- [ ] **Audit trail:** All state changes timestamped in subscriptionHistory metadata

---

## SendGrid Integration Notes

### Sync Strategy

**Option A: Push to SendGrid on subscription**
- When user subscribes → immediately add to SendGrid Marketing Contacts
- Store `sendgridContactId` in contact.metadata
- Pro: SendGrid always up-to-date
- Con: API call on every subscription

**Option B: Batch sync (recommended)**
- Run cron job every hour to sync new/changed subscriptions
- Query contacts with pending sync flag
- Batch add to SendGrid (API supports up to 30,000 contacts per request)
- Pro: Fewer API calls, more efficient
- Con: Slight delay in SendGrid sync

### Webhook Setup

Configure SendGrid to send webhook events:

```json
{
  "url": "https://imajin.ca/api/webhooks/sendgrid",
  "enabled": true,
  "events": [
    "bounce",
    "dropped",
    "spamreport",
    "unsubscribe"
  ]
}
```

**Event Handling:**
- `bounce` (hard) → Set status = 'bounced'
- `dropped` → Log in metadata
- `spamreport` → Set status = 'bounced'
- `unsubscribe` → Set status = 'unsubscribed'

---

## Future Enhancements (Not in Scope)

**Phase 5+:**
- SMS support (Twilio integration)
- Phone number verification (SMS code)
- Preference center (user manages all subscriptions in one place)
- Segmentation (send to subsets of lists based on criteria)
- A/B testing (send different content to different segments)
- Campaign analytics (open rates, click rates, conversion tracking)
- Email templates (reusable HTML templates)
- Scheduled sends (queue emails for future delivery)

---

## Next Steps

After Phase 4.4.1.1 complete:
1. **Phase 4.4.2:** Set up Ory Kratos (Docker, config, identity schema)
2. **Phase 4.4.3:** Build auth UI components (integrate contact opt-in in signup form)
3. **Phase 4.4.6:** SendGrid email integration (send verification emails)

---

**See Also:**
- `docs/tasks/Phase 4.4.1 - Database Schema.md` - Parent task (core auth tables)
- `docs/tasks/Phase 4.4 - Authentication.md` - Overall auth strategy
- `docs/tasks/Phase 4.4.3 - Auth UI Components.md` - Signup form integration
- `docs/tasks/Phase 4.4.6 - SendGrid Email Integration.md` - Email sending
- SendGrid Marketing Contacts API: https://docs.sendgrid.com/api-reference/contacts/
- GDPR Compliance Guide: https://gdpr.eu/checklist/
