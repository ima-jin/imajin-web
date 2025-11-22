# Authentication Guards

Server-side authentication utilities for protecting routes and accessing user data. Built on Ory Kratos for secure, self-hosted identity management with zero vendor lock-in.

## Module Overview

Authentication guards handle session validation, role checks, and user data access in Server Components and Route Handlers. Every function operates server-side only—these are not client-side utilities.

**Why this exists:** Next.js App Router requires server-side session handling for security. This module provides a clean API over Ory Kratos session management, with built-in redirect logic and role-based access control.

**When to use:**
- Protecting admin routes (`requireAdmin`, `requireAdminWithMFA`)
- Conditional rendering based on auth state (`isAuthenticated`, `isAdmin`)
- Accessing user data in Server Components (`getUserId`, `getLocalUser`)
- Optional authentication flows (`getSession`)

## Functions Reference

### getSession

**Get current Ory session without redirecting—use when authentication is optional.**

#### Purpose

Returns the current user's Ory Kratos session or null if not authenticated. Unlike `requireAuth`, this never redirects, making it perfect for optional authentication scenarios like showing different content to logged-in users.

#### Parameters

None.

#### Returns

`Promise<Session | null>` - Ory Kratos session object containing identity data and authentication metadata, or null if not authenticated.

#### Example

```typescript
import { getSession } from '@/lib/auth/guards'

export default async function HomePage() {
  const session = await getSession()
  
  return (
    <div>
      <h1>Welcome to Imajin</h1>
      {session ? (
        <p>Hello, {session.identity.traits.email}!</p>
      ) : (
        <p>Sign in to access your orders and account.</p>
      )}
    </div>
  )
}
```

#### Error Handling

- Never throws errors
- Returns null for any authentication failure
- Handles expired sessions gracefully

#### Implementation Notes

Uses Ory's `toSession` API with cookie-based session tokens. Sessions are validated against the Kratos instance on every call—no local caching for maximum security.

---

### requireAuth

**Server-side guard that requires authentication—redirects to signin if not authenticated.**

#### Purpose

Enforces authentication for protected routes. If no valid session exists, automatically redirects to the signin page. Use this in Server Components and Route Handlers that require any authenticated user.

#### Parameters

None.

#### Returns

`Promise<Session>` - Valid Ory Kratos session object. Guaranteed to exist (function redirects if not authenticated).

#### Example

```typescript
import { requireAuth } from '@/lib/auth/guards'

export default async function AccountPage() {
  const session = await requireAuth()
  
  return (
    <div>
      <h1>Account Settings</h1>
      <p>Email: {session.identity.traits.email}</p>
      <p>Member since: {session.identity.created_at}</p>
    </div>
  )
}
```

#### Error Handling

- Redirects to `/auth/signin` if not authenticated
- Never returns null (redirects instead)
- Preserves current URL as return destination

#### Implementation Notes

Uses Next.js `redirect()` for seamless client-side navigation. The redirect includes a `return_to` parameter so users land back on the protected page after signin.

---

### requireAdmin

**Server-side guard that requires admin role—redirects unauthorized users appropriately.**

#### Purpose

Enforces admin-only access with intelligent redirects. Unauthenticated users go to signin, authenticated non-admins go to homepage. Use for standard admin routes that don't handle sensitive operations.

#### Parameters

None.

#### Returns

`Promise<Session>` - Valid Ory Kratos session with admin role confirmed.

#### Example

```typescript
import { requireAdmin } from '@/lib/auth/guards'

export default async function AdminDashboard() {
  const session = await requireAdmin()
  
  return (
    <div>
      <h1>Admin Dashboard</h1>
      <p>Welcome, {session.identity.traits.email}</p>
      {/* Admin-only content */}
    </div>
  )
}
```

#### Error Handling

- Redirects to `/auth/signin` if not authenticated
- Redirects to `/` if authenticated but not admin
- Admin role determined by `metadata.admin: true` in Ory identity

#### Implementation Notes

Calls `requireAuth` first, then checks the admin flag in session metadata. Two-step validation ensures proper redirect behavior for different failure modes.

---

### requireAdminWithMFA

**Server-side guard that requires admin role with multi-factor authentication (AAL2).**

#### Purpose

Enforces the highest security level for sensitive admin operations. Requires both admin role and active MFA session. Redirects to MFA setup if admin lacks two-factor authentication. Use for operations like inventory management, user administration, or financial data access.

#### Parameters

None.

#### Returns

`Promise<Session>` - Valid Ory Kratos session with admin role and MFA confirmed (AAL2).

#### Example

```typescript
import { requireAdminWithMFA } from '@/lib/auth/guards'

export default async function InventoryManagement() {
  const session = await requireAdminWithMFA()
  
  return (
    <div>
      <h1>Inventory Management</h1>
      <p>MFA verified: {session.authenticator_assurance_level}</p>
      {/* Sensitive admin operations */}
    </div>
  )
}
```

#### Error Handling

- Redirects to `/auth/signin` if not authenticated
- Redirects to `/` if authenticated but not admin
- Redirects to MFA setup if admin but no active 2FA session
- Checks `authenticator_assurance_level >= aal2`

#### Implementation Notes

Ory's Authenticator Assurance Level (AAL) system provides granular MFA control. AAL1 = password only, AAL2 = password + second factor. This guard enforces AAL2 for maximum security.

---

### isAuthenticated

**Server-side check for authentication status—use for conditional rendering.**

#### Purpose

Non-redirecting boolean check for authentication. Perfect for Server Components that need to show different content based on auth state without enforcing authentication.

#### Parameters

None.

#### Returns

`Promise<boolean>` - True if user has valid session, false otherwise.

#### Example

```typescript
import { isAuthenticated } from '@/lib/auth/guards'
import Link from 'next/link'

export default async function NavigationBar() {
  const authenticated = await isAuthenticated()
  
  return (
    <nav>
      <Link href="/">Home</Link>
      {authenticated ? (
        <>
          <Link href="/account">Account</Link>
          <Link href="/auth/signout">Sign Out</Link>
        </>
      ) : (
        <>
          <Link href="/auth/signin">Sign In</Link>
          <Link href="/auth/signup">Sign Up</Link>
        </>
      )}
    </nav>
  )
}
```

#### Error Handling

- Never throws errors
- Returns false for any authentication failure
- Handles expired or invalid sessions gracefully

#### Implementation Notes

Lightweight wrapper around `getSession()` that returns only boolean status. Use this instead of `getSession()` when you only need auth status, not session data.

---

### isAdmin

**Server-side check for admin role—use for conditional admin UI rendering.**

#### Purpose

Non-redirecting boolean check for admin privileges. Use in Server Components to conditionally show admin controls or links without enforcing admin access.

#### Parameters

None.

#### Returns

`Promise<boolean>` - True if user is authenticated admin, false otherwise.

#### Example

```typescript
import { isAdmin } from '@/lib/auth/guards'
import Link from 'next/link'

export default async function AdminLinks() {
  const admin = await isAdmin()
  
  if (!admin) return null
  
  return (
    <div className="admin-panel">
      <h3>Admin Tools</h3>
      <Link href="/admin/orders">Order Management</Link>
      <Link href="/admin/inventory">Inventory</Link>
      <Link href="/admin/users">User Management</Link>
    </div>
  )
}
```

#### Error Handling

- Never throws errors
- Returns false for unauthenticated users
- Returns false for authenticated non-admins

#### Implementation Notes

First checks authentication, then validates admin role from session metadata. More efficient than `requireAdmin` when you only need boolean status.

---

### getUserId

**Get current user's Kratos identity ID—throws if not authenticated.**

#### Purpose

Returns the current user's unique identifier from Ory Kratos. This is the primary key for user relationships in the database. Throws an error if not authenticated, making it suitable for routes where authentication is assumed.

#### Parameters

None.

#### Returns

`Promise<string>` - Ory Kratos identity ID (UUID format).

#### Example

```typescript
import { getUserId } from '@/lib/auth/guards'
import { getUserOrders } from '@/lib/db/orders'

export default async function OrderHistory() {
  const userId = await getUserId()
  const orders = await getUserOrders(userId)
  
  return (
    <div>
      <h1>Order History</h1>
      {orders.map(order => (
        <div key={order.id}>
          Order #{order.sessionId} - ${order.total}
        </div>
      ))}
    </div>
  )
}
```

#### Error Handling

- Throws error if not authenticated
- Use inside protected routes only (after `requireAuth`)
- Returns Kratos UUID, not database primary key

#### Implementation Notes

Extracts the identity ID from the session object. This ID matches the `kratosId` field in the local users table, creating the bridge between Ory identity and local user data.

---

### getLocalUser

**Get full user record from local database by Kratos ID—throws if not found.**

#### Purpose

Fetches the complete user record from the local database, including federation metadata and role information. This bridges Ory Kratos identity with local user data needed for trust hub federation.

#### Parameters

None.

#### Returns

`Promise<User>` - Complete user record from local database including federation fields.

#### Example

```typescript
import { getLocalUser } from '@/lib/auth/guards'

export default async function UserProfile() {
  const user = await getLocalUser()
  
  return (
    <div>
      <h1>Profile</h1>
      <p>Name: {user.name || 'Not set'}</p>
      <p>Email: {user.email}</p>
      <p>Role: {user.role}</p>
      {user.homeHubId && (
        <p>Home Hub: {user.homeHubId}</p>
      )}
      {user.walletAddress && (
        <p>Wallet: {user.walletAddress}</p>
      )}
    </div>
  )
}
```

#### Error Handling

- Throws if not authenticated
- Throws if user not found in local database
- Returns complete user record with all federation metadata

#### Implementation Notes

Queries the local `users` table using the Kratos identity ID. This record contains federation metadata (DIDs, wallet addresses, hub relationships) that Ory Kratos doesn't handle. Essential for trust hub federation features.

## Common Patterns

### Protected Route Pattern

```typescript
// Standard protected route
export default async function ProtectedPage() {
  const session = await requireAuth()
  // Page content here
}

// Admin-only route
export default async function AdminPage() {
  const session = await requireAdmin()
  // Admin content here
}

// High-security admin route
export default async function SensitiveAdminPage() {
  const session = await requireAdminWithMFA()
  // Sensitive operations here
}
```

### Conditional Rendering Pattern

```typescript
export default async function ConditionalPage() {
  const authenticated = await isAuthenticated()
  const admin = await isAdmin()
  
  return (
    <div>
      {/* Public content */}
      <h1>Welcome</h1>
      
      {authenticated && (
        <div>
          {/* Authenticated content */}
          <p>Welcome back!</p>
        </div>
      )}
      
      {admin && (
        <div>
          {/* Admin content */}
          <Link href="/admin">Admin Dashboard</Link>
        </div>
      )}
    </div>
  )
}
```

### Data Access Pattern

```typescript
// When you need just the user ID
export default async function SimpleDataPage() {
  const userId = await getUserId()
  const userSpecificData = await fetchDataForUser(userId)
  // ...
}

// When you need full user record
export default async function ComplexDataPage() {
  const user = await getLocalUser()
  
  // Access federation metadata
  if (user.homeHubId) {
    const hubData = await fetchFromHub(user.homeHubId)
  }
  
  // Access wallet data
  if (user.walletAddress) {
    const nftData = await fetchNFTs(user.walletAddress)
  }
}
```

### Route Handler Pattern

```typescript
// API route with auth
export async function GET() {
  const session = await requireAuth()
  // API logic here
}

// Admin API route
export async function POST() {
  const session = await requireAdminWithMFA()
  // Sensitive admin operations
}

// Optional auth API route
export async function GET() {
  const session = await getSession()
  
  if (session) {
    // Authenticated response
  } else {
    // Public response
  }
}
```

## Best Practices

### Security Guidelines

- **Always use `requireAdminWithMFA` for sensitive operations** like inventory changes, user management, or financial data
- **Use `requireAuth` for standard protected content** like account pages and order history  
- **Use conditional checks (`isAuthenticated`, `isAdmin`) for UI rendering only** - never for access control
- **Call guards at the top of Server Components** - fail fast if auth is required

### Performance Considerations

- **Guards make network calls to Ory Kratos** - they're not cached locally for security
- **Use `getUserId` instead of full session** when you only need the user identifier
- **Combine guards efficiently** - `requireAdminWithMFA` already validates auth and admin status

### Federation Architecture

- **`getLocalUser` provides federation metadata** that Ory Kratos doesn't handle
- **Kratos ID is the bridge** between Ory identity and local user data
- **Future-ready for DID-based identity** - architecture supports migration without breaking changes

## Related Modules

- **[lib/auth/client](./auth-client.md)** - Client-side authentication utilities and React hooks
- **[lib/auth/middleware](./auth-middleware.md)** - Next.js middleware for route protection
- **[lib/db/users](./db-users.md)** - User database operations and federation metadata
- **[components/auth](./components-auth.md)** - Authentication UI components and forms

This module is part of Imajin's self-hosted authentication system built on Ory Kratos. Every device can eventually run as a hub, with users maintaining control of their identity and data across the federation.