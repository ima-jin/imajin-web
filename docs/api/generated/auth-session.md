# auth/session Module

Server-side session management for the Imajin LED Platform. Validates Ory Kratos sessions and provides database-backed user information for authenticated requests.

## Overview

The `auth/session` module bridges Ory Kratos authentication with your application logic. Every function runs server-side only—use in API routes, server components, and middleware to validate sessions and fetch user data.

### Why This Exists

Ory Kratos handles identity management, but your application needs local user records for orders, permissions, and federation features. This module provides a clean interface to:

- Validate Kratos sessions without redirects
- Map Kratos identities to local database users
- Enforce role-based access control
- Support future federation architecture

### When to Use

- **API routes** - Check authentication before processing requests
- **Server components** - Render user-specific content
- **Middleware** - Protect routes or enforce MFA requirements
- **Database operations** - Associate data with authenticated users

## Functions Reference

### getServerSession()

**Validates the current session without redirects**

Checks for a valid Ory Kratos session in the request cookies. Returns the session object if valid, null if not authenticated. Never redirects—use this when authentication is optional or when you need to handle auth state yourself.

**Returns**
- `Promise<Session | null>` - Ory Kratos session object or null

**Example**
```typescript
// API route with optional auth
export async function GET() {
  const session = await getServerSession();
  
  if (session) {
    // Return user-specific data
    return Response.json({ user: session.identity });
  } else {
    // Return public data
    return Response.json({ message: "Public content" });
  }
}
```

**Implementation Notes**
- Reads `ory_session_*` cookies from the request
- Validates against Kratos `/sessions/whoami` endpoint
- Returns null on any validation failure
- Safe to call repeatedly—no performance penalty

---

### isAuthenticatedRequest()

**Quick boolean check for authentication status**

Use this when you only need to know if the request is authenticated. More efficient than `getServerSession()` when you don't need the actual session data.

**Returns**
- `Promise<boolean>` - True if authenticated, false otherwise

**Example**
```typescript
// Conditional API logic
export async function GET() {
  const isAuth = await isAuthenticatedRequest();
  
  const data = isAuth 
    ? await getPrivateData()
    : await getPublicData();
    
  return Response.json(data);
}
```

**Implementation Notes**
- Internally calls `getServerSession()` but only returns boolean
- Use when session object isn't needed
- Same validation logic as `getServerSession()`

---

### getAuthenticatedUserId()

**Get the Kratos identity ID for authenticated users**

Returns the Ory Kratos identity ID from the current session. Throws an error if not authenticated—use this when authentication is required.

**Returns**
- `Promise<string>` - Kratos identity ID (UUID format)

**Throws**
- `Error` - "Not authenticated" if no valid session

**Example**
```typescript
// Protected API route
export async function POST() {
  try {
    const kratosId = await getAuthenticatedUserId();
    
    // Use Kratos ID for external integrations
    await logUserAction(kratosId, 'api_call');
    
    return Response.json({ success: true });
  } catch (error) {
    return Response.json(
      { error: "Authentication required" }, 
      { status: 401 }
    );
  }
}
```

**Implementation Notes**
- Returns `session.identity.id` from Kratos
- This is the primary key in Ory's identity system
- Use for Kratos API calls or external integrations
- For local database operations, use `getLocalUserId()` instead

---

### getLocalUserId()

**Get the local database user ID for authenticated users**

Returns the local database user ID that corresponds to the authenticated Kratos identity. Throws if not authenticated. Use this for most database operations.

**Returns**
- `Promise<string>` - Local database user ID (CUID format)

**Throws**
- `Error` - "Not authenticated" if no valid session
- `Error` - "User not found" if Kratos identity has no local user record

**Example**
```typescript
// Order creation API
export async function POST(request: Request) {
  try {
    const userId = await getLocalUserId();
    const orderData = await request.json();
    
    // Create order with local user ID
    const order = await createOrder({
      ...orderData,
      userId
    });
    
    return Response.json(order);
  } catch (error) {
    return Response.json(
      { error: error.message }, 
      { status: 401 }
    );
  }
}
```

**Implementation Notes**
- Looks up local user by `kratosId` field
- Returns the local `users.id` (CUID)
- This is what you want for foreign keys in orders, cart items, etc.
- Auto-created when user first authenticates (via webhook)

---

### getLocalUser()

**Get the complete local user record**

Returns the full user object from the local database. Contains both Kratos-synced data (email, name) and Imajin-specific fields (DID, wallet, federation settings).

**Returns**
- `Promise<User>` - Complete user object with all database fields

**Throws**
- `Error` - "Not authenticated" if no valid session
- `Error` - "User not found" if Kratos identity has no local user record

**Example**
```typescript
// User profile API
export async function GET() {
  try {
    const user = await getLocalUser();
    
    // Return profile with federation info
    return Response.json({
      name: user.name,
      email: user.email,
      role: user.role,
      walletAddress: user.walletAddress,
      homeHub: user.homeHubId,
      joinedAt: user.createdAt
    });
  } catch (error) {
    return Response.json(
      { error: error.message }, 
      { status: 401 }
    );
  }
}
```

**User Object Fields**
- `id` - Local user ID (CUID)
- `kratosId` - Ory Kratos identity ID (UUID)
- `email` - Primary email address
- `name` - Display name (nullable)
- `role` - Permission level (`user`, `admin`, `hub_owner`)
- `did` - Decentralized identifier (future)
- `walletAddress` - Solana wallet (future)
- `homeHubId` - Federation home hub
- `metadata` - JSON metadata object
- Timestamp fields: `createdAt`, `updatedAt`, `lastSyncedAt`

**Implementation Notes**
- Always returns the most current database record
- Includes federation-ready fields for future hub architecture
- Metadata field stores arbitrary JSON (preferences, settings)
- `lastSyncedAt` tracks when Kratos data was last synchronized

---

### isAdminRequest()

**Check if request is from an admin user**

Quick boolean check for admin role. Use this for conditional logic in API routes—displaying admin UI, allowing advanced features, etc.

**Returns**
- `Promise<boolean>` - True if user has admin role, false otherwise

**Example**
```typescript
// API with admin-only features
export async function GET() {
  const isAdmin = await isAdminRequest();
  
  if (isAdmin) {
    // Include sensitive admin data
    const data = await getAllOrdersWithDetails();
    return Response.json(data);
  } else {
    // Public data only
    const data = await getPublicStats();
    return Response.json(data);
  }
}
```

**Implementation Notes**
- Returns `false` if not authenticated (doesn't throw)
- Checks `user.role === 'admin'`
- Use for conditional features, not security enforcement
- For protected routes, use `isAdminWithMFA()`

---

### isAdminWithMFA()

**Check if request is from admin with MFA verification**

Validates both admin role and multi-factor authentication. Use this for sensitive operations like inventory management, order processing, or system configuration.

**Returns**
- `Promise<boolean>` - True if admin with valid MFA, false otherwise

**Example**
```typescript
// Sensitive admin operation
export async function POST() {
  const hasAdminMFA = await isAdminWithMFA();
  
  if (!hasAdminMFA) {
    return Response.json(
      { error: "Admin access with MFA required" },
      { status: 403 }
    );
  }
  
  // Proceed with sensitive operation
  await updateInventoryLevels();
  return Response.json({ success: true });
}
```

**Implementation Notes**
- Returns `false` if not authenticated or not admin
- Checks Kratos session for MFA completion
- MFA requirement enforced by Ory Kratos configuration
- Use this for any operation that could impact business operations

## Common Patterns

### Protected API Routes

```typescript
export async function POST() {
  try {
    const userId = await getLocalUserId();
    
    // Your protected logic here
    const result = await performUserAction(userId);
    
    return Response.json(result);
  } catch (error) {
    return Response.json(
      { error: "Authentication required" }, 
      { status: 401 }
    );
  }
}
```

### Conditional Authentication

```typescript
export async function GET() {
  const session = await getServerSession();
  
  if (session) {
    // Authenticated user experience
    const user = await getLocalUser();
    return Response.json({ 
      content: "private", 
      user: user.name 
    });
  } else {
    // Anonymous user experience
    return Response.json({ content: "public" });
  }
}
```

### Admin-Only Features

```typescript
export async function DELETE() {
  // Use MFA check for destructive operations
  if (!(await isAdminWithMFA())) {
    return Response.json(
      { error: "Admin MFA required" },
      { status: 403 }
    );
  }
  
  await performAdminAction();
  return Response.json({ success: true });
}
```

## Error Handling

### Authentication Errors

Functions that throw on authentication failure:
- `getAuthenticatedUserId()`
- `getLocalUserId()` 
- `getLocalUser()`

Functions that return null/false instead:
- `getServerSession()`
- `isAuthenticatedRequest()`
- `isAdminRequest()`
- `isAdminWithMFA()`

### Database Errors

If a Kratos identity exists but has no local user record:
- Usually indicates webhook processing failure
- Check Kratos webhook logs
- User record should auto-create on first authentication

### Session Validation Failures

Common causes:
- Expired session cookies
- Kratos instance unreachable
- Cookie domain mismatch
- Network connectivity issues

## Implementation Notes

### Federation Architecture

The user database schema supports the planned federation features:

- `homeHubId` - Which hub the user calls home
- `isCached` - Whether this is a cached user from another hub  
- `cachedFromHubId` - Source hub for cached users
- `knownOnHubs` - Array of hubs that know about this user

Today these fields are mostly unused (single hub), but they enable future P2P federation without breaking changes.

### Performance Considerations

- Session validation involves a network call to Kratos
- Local user lookups hit the database
- Consider caching for high-traffic routes
- `isAuthenticatedRequest()` is more efficient when you only need boolean status

### Security Model

- Ory Kratos handles password security, MFA, account recovery
- Local database only stores non-sensitive profile data
- Admin role stored locally (synced via webhook)
- MFA validation delegated to Kratos

## Related Modules

- **lib/auth/kratos** - Direct Ory Kratos client integration
- **lib/auth/middleware** - Route protection and redirects  
- **db/schema-auth** - User database schema definitions
- **api/auth/webhook** - Kratos event processing