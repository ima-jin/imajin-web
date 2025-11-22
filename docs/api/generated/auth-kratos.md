# auth/kratos Module

**Ory Kratos integration for self-hosted identity management**

The `auth/kratos` module provides client interfaces and utilities for interacting with Ory Kratos, our self-hosted identity provider. This module enables secure authentication flows while maintaining full control over user data and identity management—no vendor lock-in, no subscription dependencies.

## Purpose

Ory Kratos handles the complex security aspects of user authentication (password policies, email verification, session management) while keeping everything under our control. This module bridges Next.js application logic with Kratos APIs, supporting both browser-side self-service flows and server-side identity management.

**Key capabilities:**
- Self-service user registration and login flows
- Server-side identity creation and management
- Session validation and user data access
- Email verification and password reset workflows

This architecture supports our Trust Hub Federation vision—every Imajin device can run as an identity hub, with users free to migrate between hubs or operate their own.

## API Reference

### kratosFrontend

```typescript
const kratosFrontend: FrontendApi
```

Frontend API client for self-service flows. Used in browser and server-side rendering.

**Purpose:** Handles user-facing authentication flows like registration, login, logout, and account recovery. This client connects to Kratos's public API endpoints that users interact with directly.

**Configuration:**
- **Base URL:** Environment-dependent (`KRATOS_PUBLIC_URL`)
- **Access:** Public endpoints, safe for browser use
- **Authentication:** None required (handles anonymous flows)

**Common use cases:**
- Initializing registration/login flows
- Fetching flow data for UI rendering
- Submitting authentication forms
- Managing user sessions

**Example: Initialize login flow**

```typescript
import { kratosFrontend } from '@/lib/auth/kratos'

// In a page component or API route
export async function getServerSideProps({ query }) {
  try {
    const { data: flow } = await kratosFrontend.createBrowserLoginFlow({
      refresh: query.refresh === 'true',
      returnTo: query.return_to as string,
    })
    
    return {
      props: { flow }
    }
  } catch (error) {
    // Flow expired or invalid, redirect to new flow
    return {
      redirect: {
        destination: '/auth/login',
        permanent: false,
      }
    }
  }
}
```

**Error handling:**
- Flow expiration: Returns 404, redirect to new flow initialization
- Invalid parameters: Returns 400 with validation details
- Network issues: Standard HTTP error responses

**Implementation notes:**
- Configured with axios defaults for consistent request handling
- Automatically includes environment-specific base URLs
- Thread-safe for concurrent requests from multiple users

---

### kratosAdmin

```typescript
const kratosAdmin: IdentityApi
```

Admin API client for identity management. Used server-side only for creating and managing identities.

**Purpose:** Provides administrative control over user identities, including creation, deletion, and metadata management. This client connects to Kratos's admin API endpoints that require elevated privileges.

**Configuration:**
- **Base URL:** Internal network (`KRATOS_ADMIN_URL`)
- **Access:** Server-side only, never exposed to browser
- **Authentication:** Admin-level access (no auth required in trusted network)

**Security considerations:**
- Never expose this client to browser code
- Admin URL should be network-isolated in production
- Use only in API routes and server-side functions

**Example: Create user identity**

```typescript
import { kratosAdmin } from '@/lib/auth/kratos'

// In an API route (pages/api/admin/create-user.ts)
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  
  const { email, firstName, lastName } = req.body
  
  try {
    const { data: identity } = await kratosAdmin.createIdentity({
      createIdentityBody: {
        schema_id: 'default',
        traits: {
          email,
          name: {
            first: firstName,
            last: lastName,
          },
        },
        credentials: {
          password: {
            config: {
              // User will set password via recovery flow
            }
          }
        }
      }
    })
    
    // Shadow the identity in our users table
    await db.insert(users).values({
      kratosId: identity.id,
      email: identity.traits.email,
      firstName: identity.traits.name.first,
      lastName: identity.traits.name.last,
      trustHubId: 'imajin-ca', // Default hub
    })
    
    res.json({ success: true, userId: identity.id })
  } catch (error) {
    console.error('Identity creation failed:', error)
    res.status(500).json({ error: 'Failed to create user' })
  }
}
```

**Error handling:**
- Duplicate email: Returns 409 conflict
- Invalid schema: Returns 400 with validation errors
- Network/database issues: Returns 500 server error

**Implementation notes:**
- Only accessible from server-side code
- Used for bulk operations and admin workflows
- Integrates with our user shadowing system for local data

---

### getKratosPublicUrl()

```typescript
function getKratosPublicUrl(): string
```

Helper to get Kratos public URL for redirects and client-side operations.

**Purpose:** Provides the correct Kratos public endpoint URL based on environment configuration. Essential for constructing redirect URLs and initializing client-side authentication flows.

**Returns:** `string` - Complete Kratos public API base URL

**Environment mapping:**
- Development: `http://localhost:4433`
- Production: Environment-specific domain (`KRATOS_PUBLIC_URL`)

**Example: Build redirect URL**

```typescript
import { getKratosPublicUrl } from '@/lib/auth/kratos'

// In a logout component
function handleLogout() {
  const kratosUrl = getKratosPublicUrl()
  const returnTo = encodeURIComponent(window.location.origin)
  
  // Redirect to Kratos logout endpoint
  window.location.href = `${kratosUrl}/self-service/logout/browser?return_to=${returnTo}`
}
```

**Implementation notes:**
- Environment variable fallback handling
- No trailing slashes (consistent URL construction)
- Safe for both server and client-side use

---

### getKratosAdminUrl()

```typescript
function getKratosAdminUrl(): string
```

Helper to get Kratos admin URL for server-side administrative operations.

**Purpose:** Provides the admin API endpoint URL for server-side identity management operations. Used internally by the `kratosAdmin` client and for direct API calls when needed.

**Returns:** `string` - Complete Kratos admin API base URL

**Security:** Server-side only. Never expose admin URLs to client code.

**Environment mapping:**
- Development: `http://localhost:4434`
- Production: Internal network URL (`KRATOS_ADMIN_URL`)

**Example: Direct admin API call**

```typescript
import { getKratosAdminUrl } from '@/lib/auth/kratos'

// In server-side function
async function getUserIdentity(identityId: string) {
  const adminUrl = getKratosAdminUrl()
  
  const response = await fetch(`${adminUrl}/admin/identities/${identityId}`, {
    headers: {
      'Content-Type': 'application/json',
    }
  })
  
  if (!response.ok) {
    throw new Error(`Failed to fetch identity: ${response.statusText}`)
  }
  
  return response.json()
}
```

**Implementation notes:**
- Internal network endpoints in production
- Used for direct HTTP calls outside the client wrappers
- Consistent with client configuration

## Common Patterns

### Self-Service Flow Initialization

Most authentication interactions follow this pattern:

1. **Initialize flow** - Create flow via `kratosFrontend`
2. **Render UI** - Display form based on flow configuration
3. **Submit form** - POST to flow action URL
4. **Handle result** - Success redirects, errors re-render form

```typescript
// pages/auth/login.tsx
export async function getServerSideProps({ query, req }) {
  const flowId = query.flow as string
  
  try {
    // Try to fetch existing flow
    const { data: flow } = await kratosFrontend.getLoginFlow({
      id: flowId,
      cookie: req.headers.cookie,
    })
    
    return { props: { flow } }
  } catch {
    // No flow or expired, create new one
    const { data: flow } = await kratosFrontend.createBrowserLoginFlow({
      returnTo: query.return_to as string,
    })
    
    return { props: { flow } }
  }
}
```

### User Identity Shadowing

We maintain local user records that shadow Kratos identities:

```typescript
// When processing webhooks or creating users
async function syncUserFromKratos(kratosIdentity: Identity) {
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.kratosId, kratosIdentity.id))
    .limit(1)
  
  if (existingUser.length === 0) {
    // Create shadow record
    await db.insert(users).values({
      kratosId: kratosIdentity.id,
      email: kratosIdentity.traits.email,
      firstName: kratosIdentity.traits.name?.first,
      lastName: kratosIdentity.traits.name?.last,
      trustHubId: 'imajin-ca', // Default hub
    })
  } else {
    // Update existing record
    await db
      .update(users)
      .set({
        email: kratosIdentity.traits.email,
        firstName: kratosIdentity.traits.name?.first,
        lastName: kratosIdentity.traits.name?.last,
      })
      .where(eq(users.kratosId, kratosIdentity.id))
  }
}
```

## Best Practices

### Error Handling

- **Flow errors**: Always provide fallback to new flow creation
- **Network errors**: Implement retry logic with exponential backoff
- **Validation errors**: Display field-specific messages from flow UI nodes

### Security

- **Never expose admin client** to browser code
- **Validate sessions server-side** before sensitive operations
- **Use HTTPS** for all Kratos endpoints in production

### Performance

- **Cache flow data** appropriately (flows have expiration times)
- **Minimize admin API calls** (they're not optimized for high frequency)
- **Use webhooks** for real-time identity updates rather than polling

## Related Modules

- **[middleware/auth](./middleware-auth.md)** - Session validation and route protection
- **[components/auth](./components-auth.md)** - UI components for authentication flows
- **[lib/db/schema](./lib-db-schema.md)** - User and trust hub database schema
- **[api/webhooks](./api-webhooks.md)** - Kratos webhook handling for identity sync

This module is foundational to the Trust Hub Federation architecture—it provides the identity layer that enables users to own their data while participating in our decentralized marketplace vision.