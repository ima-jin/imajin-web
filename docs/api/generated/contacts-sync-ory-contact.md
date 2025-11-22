# contacts/sync-ory-contact

**Identity synchronization between Ory Kratos and local contact database**

## Module Overview

The `sync-ory-contact` module bridges Ory Kratos identity management with the local contacts database. Every time a user interacts with the authentication system—signing up, verifying email, or adding addresses—this module ensures their contact information stays synchronized across both systems.

This solves the dual-source problem: Ory manages authentication and email verification, while the local database handles marketing preferences and order history. Without synchronization, users could authenticate successfully but have no contact record for order fulfillment.

Use this module in Ory webhook handlers, registration flows, and any process that creates or updates user identities.

## Functions Reference

### syncOryContactToLocal

**Synchronizes an Ory Kratos identity to the local contacts database, creating or updating records as needed.**

#### Purpose

When users interact with Ory Kratos (registration, email verification, profile updates), their contact information must be mirrored in the local database for order processing and marketing communications. This function handles the synchronization logic, ensuring data consistency between authentication and commerce systems.

The function implements upsert logic—it creates new contact records for first-time users and updates existing records when email addresses change or newsletter preferences are modified.

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `userId` | `string` | Ory Kratos identity ID (UUID format) |
| `email` | `string` | Email address from Ory identity traits |
| `newsletterOptIn` | `boolean` | Whether user opted into newsletter during signup (default: `false`) |

#### Returns

`Promise<string>` - Contact ID from the local database (UUID format)

#### Example

```typescript
import { syncOryContactToLocal } from '@/lib/contacts/sync-ory-contact';

// In Ory webhook handler
async function handleUserRegistration(webhookData: OryWebhookData) {
  const { identity } = webhookData;
  
  const contactId = await syncOryContactToLocal(
    identity.id,
    identity.traits.email,
    identity.traits.newsletter_opt_in || false
  );
  
  console.log(`Synced user ${identity.id} to contact ${contactId}`);
}

// During email verification
async function handleEmailVerified(userId: string, email: string) {
  const contactId = await syncOryContactToLocal(userId, email);
  
  // Contact now exists and can receive order confirmations
  return contactId;
}
```

#### Error Handling

The function throws standard database errors if synchronization fails:

- **Database connection errors** - Network or connection pool issues
- **Validation errors** - Invalid email format or missing required fields
- **Constraint violations** - Duplicate email addresses (handled via upsert)

Wrap calls in try-catch blocks and implement appropriate retry logic:

```typescript
try {
  const contactId = await syncOryContactToLocal(userId, email, true);
} catch (error) {
  if (error.code === 'CONNECTION_ERROR') {
    // Retry with exponential backoff
    await retryWithBackoff(() => syncOryContactToLocal(userId, email, true));
  } else {
    // Log and continue - sync can be attempted again later
    console.error('Contact sync failed:', error);
  }
}
```

#### Implementation Notes

**Upsert Strategy**: The function uses database upsert operations to handle both new and existing contacts. This prevents race conditions when multiple Ory events fire simultaneously for the same user.

**Newsletter Preferences**: The `newsletterOptIn` parameter only sets the preference during initial contact creation. Subsequent calls with different values won't override existing preferences—users must explicitly change marketing settings through their account.

**Identity Mapping**: Contact records maintain a reference to the Ory identity ID, enabling bidirectional lookups between authentication and commerce data. This supports the trust hub federation architecture where users may eventually migrate between different Ory instances.

**Transaction Isolation**: Each sync operation runs in a database transaction to ensure atomicity. If any step fails, the entire operation rolls back without leaving partial records.

## Common Patterns

### Webhook Integration

```typescript
// Ory webhook endpoint
export async function POST(request: Request) {
  const webhook = await request.json();
  
  if (webhook.type === 'identity.created' || webhook.type === 'identity.updated') {
    const { identity } = webhook.data;
    
    await syncOryContactToLocal(
      identity.id,
      identity.traits.email,
      identity.traits.newsletter_opt_in
    );
  }
  
  return Response.json({ success: true });
}
```

### Registration Flow

```typescript
// After successful Ory registration
async function completeUserSetup(identityId: string, email: string, preferences: UserPreferences) {
  // Sync to contacts first
  const contactId = await syncOryContactToLocal(identityId, email, preferences.newsletter);
  
  // Then handle additional setup
  await createUserDashboard(contactId);
  await sendWelcomeEmail(email);
}
```

### Bulk Migration

```typescript
// Migrating existing users to new contact system
async function migrateOryUsers() {
  const identities = await oryAdminClient.listIdentities();
  
  for (const identity of identities) {
    try {
      await syncOryContactToLocal(identity.id, identity.traits.email);
      console.log(`Migrated ${identity.traits.email}`);
    } catch (error) {
      console.error(`Failed to migrate ${identity.id}:`, error);
    }
  }
}
```

## Related Modules

### Trust Hub Federation
- **users** - Shadow table for Ory identities with DID/wallet fields
- **trust_hubs** - Hosting nodes for federated commerce
- **user_collective_memberships** - Organizational relationships

### Authentication Flow
- **auth/ory-client** - Ory Kratos API client configuration
- **auth/webhooks** - Ory event handlers that call sync functions
- **auth/middleware** - Session validation and user context

### Commerce Integration
- **orders** - Links contacts to purchase history
- **cart** - Associates shopping sessions with authenticated users
- **stripe** - Customer creation uses synchronized contact data

The contact sync module sits at the intersection of authentication and commerce, ensuring seamless data flow between Ory Kratos identity management and the broader Imajin platform ecosystem.