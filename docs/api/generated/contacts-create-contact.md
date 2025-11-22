# contacts/create-contact

The `contacts/create-contact` module manages contact record creation and updates for the Imajin platform's authentication and user management system.

## Module Overview

This module handles contact information (emails and phone numbers) for both authenticated users and guest shoppers. It's built to support Imajin's federated architecture where contact records need to be portable across trust hubs while maintaining data integrity.

**Primary use cases:**
- Creating contact records during order checkout (guest users)
- Linking contact information to authenticated user accounts
- Merging guest contacts with user accounts during registration
- Bulk contact imports for administrative purposes

**Architecture context:** Part of Phase 4.4 authentication infrastructure using Ory Kratos for identity management with shadow contact records for federation support.

## Functions Reference

### createContact

Creates a new contact record in the database.

#### Purpose

Inserts a contact record with specified verification status and metadata. Used when you know the contact doesn't exist or want to create a duplicate record for tracking purposes (different sources, different users, etc.).

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `input` | `CreateContactInput` | Contact creation data |
| `input.kind` | `"email" \| "phone"` | Type of contact information |
| `input.value` | `string` | Email address or phone number |
| `input.source` | `"order" \| "auth" \| "signup_form" \| "manual" \| "import"` | How this contact was obtained |
| `input.userId?` | `string` | Optional user ID to link this contact |
| `input.isPrimary?` | `boolean` | Whether this is the user's primary contact (default: `false`) |
| `input.isVerified?` | `boolean` | Verification status (default: `false`) |
| `input.metadata?` | `Record<string, any>` | Additional context data |

#### Returns

`Promise<Contact>` - Complete contact record with generated ID and timestamps

#### Example

```typescript
import { createContact } from '@/lib/contacts/create-contact';

// Create email contact from order checkout
const contact = await createContact({
  kind: 'email',
  value: 'maker@example.com',
  source: 'order',
  metadata: {
    orderId: 'order_123',
    checkoutSessionId: 'cs_test_123'
  }
});

// Create verified phone contact for authenticated user
const phoneContact = await createContact({
  kind: 'phone',
  value: '+1234567890',
  source: 'auth',
  userId: 'user_456',
  isPrimary: true,
  isVerified: true
});
```

#### Error Handling

- **Database constraint violations**: Throws if required fields are missing
- **Invalid contact values**: No validation occurs at this level—validate emails/phones before calling
- **Transaction failures**: Database transaction rolls back completely on any error

#### Implementation Notes

- Uses Drizzle ORM with automatic timestamp generation
- No duplicate checking—use `createOrUpdateContact` if you need upsert behavior
- Metadata is stored as JSONB for efficient querying
- `verifiedAt` is automatically set when `isVerified: true`

---

### createOrUpdateContact

Creates a new contact or updates existing one based on kind, value, and userId combination.

#### Purpose

Upserts contact records to prevent duplicates while preserving the most recent source information. Essential for merging guest contacts with authenticated user accounts and handling repeat customers.

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `input` | `CreateContactInput` | Same as `createContact` input |

#### Returns

`Promise<Contact>` - The created or updated contact record

#### Example

```typescript
import { createOrUpdateContact } from '@/lib/contacts/create-contact';

// Guest makes order, then creates account
// First: guest checkout
const guestContact = await createOrUpdateContact({
  kind: 'email',
  value: 'maker@example.com',
  source: 'order',
  metadata: { orderId: 'order_123' }
});

// Later: same email creates account
const userContact = await createOrUpdateContact({
  kind: 'email',
  value: 'maker@example.com', // Same email
  source: 'auth',
  userId: 'user_456', // Now linked to user
  isPrimary: true,
  isVerified: true
});
// Result: existing record updated with user link and verification
```

#### Error Handling

- **Unique constraint conflicts**: Handled gracefully via Drizzle's conflict resolution
- **Update failures**: If existing record can't be updated, throws database error
- **Invalid input**: Same constraints as `createContact`

#### Implementation Notes

- Uses `onConflict().doUpdateSet()` for upsert behavior
- Conflict resolution based on `(kind, value, userId)` combination
- Updates all fields on conflict, including metadata merge
- Preserves original `createdAt` timestamp, updates `updatedAt`

## Common Patterns

### Order Checkout Flow

```typescript
// 1. Create guest contact during checkout
const contact = await createContact({
  kind: 'email',
  value: customerEmail,
  source: 'order',
  metadata: {
    orderId,
    checkoutSessionId,
    ipAddress: req.ip
  }
});

// 2. Later merge with user account if they register
await createOrUpdateContact({
  kind: 'email',
  value: customerEmail,
  source: 'auth',
  userId: newUserId,
  isPrimary: true,
  isVerified: false // Let Ory Kratos handle verification
});
```

### Bulk Import Pattern

```typescript
const importedContacts = [];
for (const row of csvData) {
  try {
    const contact = await createOrUpdateContact({
      kind: 'email',
      value: row.email.toLowerCase().trim(),
      source: 'import',
      metadata: {
        importBatch: batchId,
        originalRow: row
      }
    });
    importedContacts.push(contact);
  } catch (error) {
    console.error(`Failed to import ${row.email}:`, error);
    // Continue with next row
  }
}
```

### Best Practices

- **Always normalize input**: Lowercase emails, format phone numbers before calling
- **Use appropriate sources**: Helps with data lineage and compliance
- **Include relevant metadata**: Order IDs, session IDs, import batches for tracking
- **Don't over-verify**: Let Ory Kratos handle email verification flows
- **Handle duplicates thoughtfully**: Use `createOrUpdateContact` when unsure about existence

## Related Modules

- **`db/schema-auth.ts`** - Database schema definitions for contacts table
- **`lib/auth/ory-webhooks.ts`** - Ory Kratos integration for verification flows  
- **`lib/orders/create-order.ts`** - Order creation that generates contact records
- **Ory Kratos flows** - Email verification and user registration workflows

This module is part of Imajin's trust hub federation architecture, designed to support contact portability when users migrate between federated hubs while maintaining full local control over personal data.