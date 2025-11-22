# contacts/subscribe

**Manages mailing list subscriptions with full opt-in/opt-out tracking and compliance features.**

## Overview

The contacts/subscribe module handles the complete subscription lifecycle for mailing lists. It creates subscription records with proper compliance tracking, manages double opt-in confirmation flows, and handles unsubscribes with audit trails.

This module exists because email marketing requires strict compliance with regulations like GDPR and CAN-SPAM. Every subscription must track when, where, and how someone opted in—and provide clear paths to opt out.

Use this module when building email signup flows, managing newsletter subscriptions, or handling bulk email communications where compliance tracking matters.

## Functions Reference

### subscribeToList

**Creates a subscription to a mailing list**

#### Purpose
Creates a new subscription record linking a contact to a mailing list. The function tracks compliance data including IP addresses and user agents for opt-in verification. Subscriptions start in "pending" status unless auto-confirmation is enabled.

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `contactId` | `string` | Unique identifier for the contact being subscribed |
| `mailingListId` | `string` | Unique identifier for the target mailing list |
| `options` | `SubscribeOptions?` | Optional configuration for opt-in tracking |

#### SubscribeOptions

| Property | Type | Description |
|----------|------|-------------|
| `optInIp` | `string?` | IP address where subscription occurred (compliance tracking) |
| `optInUserAgent` | `string?` | Browser user agent string (compliance tracking) |
| `autoConfirm` | `boolean?` | Skip confirmation step and activate immediately |

#### Returns

`Promise<Subscription>` - Complete subscription record with metadata and timestamps

#### Example

```typescript
import { subscribeToList } from '@/lib/contacts/subscribe'

// Basic subscription with compliance tracking
const subscription = await subscribeToList(
  'contact_123',
  'newsletter_general',
  {
    optInIp: '192.168.1.100',
    optInUserAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)...',
    autoConfirm: false  // Requires email confirmation
  }
)

console.log(subscription.status) // "pending"
console.log(subscription.optInAt) // null (until confirmed)
```

#### Error Handling

- Database constraint violations if contact or mailing list doesn't exist
- Duplicate subscription attempts return the existing record (idempotent)
- Missing required IDs throw validation errors

#### Implementation Notes

The function uses database transactions to ensure atomic subscription creation. Compliance data (IP, user agent) is stored separately from core subscription data for privacy and audit purposes. Auto-confirm bypasses double opt-in but still creates full audit trails.

---

### confirmSubscription

**Confirms a pending subscription (double opt-in)**

#### Purpose
Activates a pending subscription by setting the status to "active" and recording the confirmation timestamp. Also marks the associated contact as verified since they've proven email access. This completes the double opt-in flow required for compliance.

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `contactId` | `string` | Unique identifier for the contact |
| `mailingListId` | `string` | Unique identifier for the mailing list |

#### Returns

`Promise<Subscription>` - Updated subscription record with active status and opt-in timestamp

#### Example

```typescript
import { confirmSubscription } from '@/lib/contacts/subscribe'

// Confirm subscription from email link click
const subscription = await confirmSubscription(
  'contact_123',
  'newsletter_general'
)

console.log(subscription.status) // "active"
console.log(subscription.optInAt) // 2024-01-15T10:30:00Z
```

#### Error Handling

- Throws error if subscription doesn't exist or is already confirmed
- Database transaction ensures atomic updates to both subscription and contact records
- Invalid IDs result in not-found errors

#### Implementation Notes

This function runs in a transaction that updates both the subscription status and marks the contact as verified. The opt-in timestamp uses the server's current time, not the original subscription time, to accurately track when confirmation occurred.

---

### unsubscribeFromList

**Unsubscribes from a mailing list**

#### Purpose
Deactivates an active subscription by setting status to "unsubscribed" and recording the opt-out timestamp. Preserves the subscription record for compliance and re-subscription handling. Optional reason tracking helps identify common unsubscribe causes.

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `contactId` | `string` | Unique identifier for the contact |
| `mailingListId` | `string` | Unique identifier for the mailing list |
| `reason` | `string?` | Optional reason for unsubscribing (analytics) |

#### Returns

`Promise<Subscription>` - Updated subscription record with unsubscribed status

#### Example

```typescript
import { unsubscribeFromList } from '@/lib/contacts/subscribe'

// Handle unsubscribe from email link
const subscription = await unsubscribeFromList(
  'contact_123',
  'newsletter_general',
  'too_frequent'
)

console.log(subscription.status) // "unsubscribed"
console.log(subscription.optOutAt) // 2024-01-20T14:45:00Z
```

#### Error Handling

- Handles already-unsubscribed contacts gracefully (idempotent)
- Missing subscription records throw not-found errors
- Database constraints prevent invalid status transitions

#### Implementation Notes

Never deletes subscription records—compliance requires maintaining opt-out history. The reason parameter gets stored in metadata for analytics but isn't required. Unsubscribed contacts can re-subscribe later, creating a new subscription record with fresh timestamps.

## Common Patterns

### Double Opt-In Flow

```typescript
// 1. Create pending subscription
const subscription = await subscribeToList(contactId, listId, {
  optInIp: req.ip,
  optInUserAgent: req.headers['user-agent'],
  autoConfirm: false
})

// 2. Send confirmation email with link to confirm endpoint

// 3. Handle confirmation link click
await confirmSubscription(contactId, listId)
```

### Single Opt-In Flow

```typescript
// Skip confirmation for internal signups
const subscription = await subscribeToList(contactId, listId, {
  optInIp: req.ip,
  optInUserAgent: req.headers['user-agent'],
  autoConfirm: true  // Immediately active
})
```

### Unsubscribe Link Handling

```typescript
// Handle one-click unsubscribe
await unsubscribeFromList(contactId, listId, 'one_click_unsubscribe')

// Track reason for analytics
await unsubscribeFromList(contactId, listId, 'content_not_relevant')
```

## Best Practices

- **Always track compliance data** - Include IP and user agent for all subscriptions
- **Use double opt-in** unless you have explicit permission (existing customers, etc.)
- **Preserve unsubscribe records** - Never delete subscription history
- **Handle idempotent operations** - Multiple subscribe/unsubscribe calls should be safe
- **Store reason codes** - Track why people unsubscribe to improve content

## Things to Watch Out For

- **Status transitions** - Only pending subscriptions can be confirmed
- **Compliance data** - IP addresses and user agents are required for legal protection
- **Contact verification** - Confirmation automatically marks contacts as email-verified
- **Re-subscriptions** - Unsubscribed contacts need new subscription records, not status updates

## Related Modules

- **contacts/create** - Create contacts before subscribing them
- **contacts/verify** - Handle email verification workflows
- **mailing-lists** - Manage list creation and configuration
- **email/send** - Send confirmation and unsubscribe emails

This module integrates with the broader trust hub federation architecture—every hub manages its own subscription compliance while maintaining interoperability for cross-hub communications.