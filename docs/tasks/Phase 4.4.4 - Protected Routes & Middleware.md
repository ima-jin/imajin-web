# Phase 4.4.4: Protected Routes & Middleware

**Status:** Ready for Implementation 🟡
**Estimated Effort:** 3 hours
**Dependencies:** Phase 4.4.3 complete (Auth UI exists), Ory Kratos running
**Next Phase:** Phase 4.4.5 (Integration with Existing Features)

---

## Overview

Implement authentication middleware to protect routes using Ory Kratos sessions, enforce role-based access control with MFA requirements for admins, and handle redirect logic with callback URLs.

**Protected Routes:**
- `/account/*` - Customer account pages (require auth)
- `/admin/*` - Admin pages (require admin role + MFA)
- `/auth/signin`, `/auth/signup` - Redirect if already authenticated

**Key Changes from NextAuth:**
- Use `kratosFrontend.toSession()` for session validation
- Check `session.authenticator_assurance_level` for MFA enforcement
- Access user data via `session.identity.traits`
- Ory handles CSRF protection in self-service flows

---

## Middleware Architecture

Next.js middleware runs before route handlers, enabling:
- Session validation via Ory Kratos
- Role-based access control
- MFA enforcement for admin routes (AAL2 required)
- Redirect logic with preserved URLs
- CSRF protection (built into Ory flows)

---

## Main Middleware

**File:** `middleware.ts`

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { kratosFrontend } from '@/lib/auth/kratos';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Get Ory session cookie
  const sessionCookie = req.cookies.get('ory_session_imajinweb')?.value;

  let session = null;
  let isAuthenticated = false;
  let isAdmin = false;
  let hasMFA = false;

  if (sessionCookie) {
    try {
      // Validate session with Ory Kratos
      const { data } = await kratosFrontend.toSession({
        cookie: `ory_session_imajinweb=${sessionCookie}`,
      });
      session = data;
      isAuthenticated = session.active;
      isAdmin = session.identity.traits.role === 'admin';
      hasMFA = session.authenticator_assurance_level === 'aal2';
    } catch (error) {
      // Invalid or expired session
      isAuthenticated = false;
    }
  }

  // Protect admin routes
  if (pathname.startsWith('/admin')) {
    if (!isAuthenticated) {
      // Not authenticated → redirect to signin
      const signInUrl = new URL('/auth/signin', req.url);
      signInUrl.searchParams.set('return_to', pathname);
      return NextResponse.redirect(signInUrl);
    }

    if (!isAdmin) {
      // Authenticated but not admin → redirect to home
      return NextResponse.redirect(new URL('/', req.url));
    }

    if (!hasMFA) {
      // Admin without MFA → redirect to MFA setup
      const mfaUrl = new URL('/auth/mfa-required', req.url);
      mfaUrl.searchParams.set('return_to', pathname);
      return NextResponse.redirect(mfaUrl);
    }
  }

  // Protect account routes
  if (pathname.startsWith('/account')) {
    if (!isAuthenticated) {
      const signInUrl = new URL('/auth/signin', req.url);
      signInUrl.searchParams.set('return_to', pathname);
      return NextResponse.redirect(signInUrl);
    }
  }

  // Redirect authenticated users away from auth pages
  if (isAuthenticated) {
    if (pathname === '/auth/signin' || pathname === '/auth/signup') {
      return NextResponse.redirect(new URL('/account', req.url));
    }
  }

  // Allow request to proceed
  return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    // Auth routes
    '/auth/signin',
    '/auth/signup',

    // Protected routes
    '/account/:path*',
    '/admin/:path*',

    // Exclude API routes, static files, images
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
```

**How It Works:**
1. Extract Ory session cookie from request
2. Validate session with `kratosFrontend.toSession()`
3. Check `session.identity.traits.role` for role-based access
4. Check `session.authenticator_assurance_level` for MFA enforcement
5. Redirect to signin/MFA if requirements not met
6. Preserve original URL in `return_to` for post-signin redirect

**AAL Levels:**
- `aal1` - Password authentication only
- `aal2` - Password + TOTP (2FA enabled)

---

## Server-Side Guards

**File:** `lib/auth/guards.ts`

```typescript
import { kratosFrontend } from '@/lib/auth/kratos';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { Session } from '@ory/client';

/**
 * Get current Ory session (no redirect)
 * Use when session is optional
 */
export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('ory_session_imajinweb')?.value;

  if (!sessionCookie) {
    return null;
  }

  try {
    const { data } = await kratosFrontend.toSession({
      cookie: `ory_session_imajinweb=${sessionCookie}`,
    });
    return data.active ? data : null;
  } catch (error) {
    return null;
  }
}

/**
 * Server-side guard: Require authentication
 * Use in Server Components and Route Handlers
 */
export async function requireAuth(): Promise<Session> {
  const session = await getSession();
  if (!session) {
    redirect('/auth/signin');
  }
  return session;
}

/**
 * Server-side guard: Require admin role
 * Use in Server Components and Route Handlers
 */
export async function requireAdmin(): Promise<Session> {
  const session = await getSession();
  if (!session) {
    redirect('/auth/signin');
  }
  if (session.identity.traits.role !== 'admin') {
    redirect('/');
  }
  return session;
}

/**
 * Server-side guard: Require admin with MFA
 * Use in sensitive admin routes
 */
export async function requireAdminWithMFA(): Promise<Session> {
  const session = await requireAdmin();
  if (session.authenticator_assurance_level !== 'aal2') {
    redirect('/auth/mfa-required');
  }
  return session;
}

/**
 * Server-side check: Is user authenticated?
 * Use for conditional rendering in Server Components
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return !!session;
}

/**
 * Server-side check: Is user admin?
 * Use for conditional rendering in Server Components
 */
export async function isAdmin(): Promise<boolean> {
  const session = await getSession();
  return session?.identity.traits.role === 'admin';
}

/**
 * Get current user ID (throws if not authenticated)
 * Use when you need just the user ID
 */
export async function getUserId(): Promise<string> {
  const session = await requireAuth();
  // Return local user ID (from database), not Kratos ID
  // Assumes we have a helper to map Kratos ID to local ID
  return session.identity.id;
}

/**
 * Get local user from database by Kratos ID
 * Use when you need full user record
 */
export async function getLocalUser() {
  const session = await requireAuth();
  const { db } = await import('@/db');
  const { users } = await import('@/db/schema-auth');
  const { eq } = await import('drizzle-orm');

  const user = await db.query.users.findFirst({
    where: eq(users.kratosId, session.identity.id),
  });

  if (!user) {
    throw new Error('User not found in local database');
  }

  return user;
}
```

---

## Session Helpers

**File:** `lib/auth/session.ts`

```typescript
import { kratosFrontend } from '@/lib/auth/kratos';
import { cookies } from 'next/headers';
import type { Session } from '@ory/client';

/**
 * Get current session (server-side only)
 * @returns Session or null
 */
export async function getServerSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('ory_session_imajinweb')?.value;

  if (!sessionCookie) {
    return null;
  }

  try {
    const { data } = await kratosFrontend.toSession({
      cookie: `ory_session_imajinweb=${sessionCookie}`,
    });
    return data.active ? data : null;
  } catch (error) {
    return null;
  }
}

/**
 * Check if request is from authenticated user
 * Use in API routes
 */
export async function isAuthenticatedRequest(): Promise<boolean> {
  const session = await getServerSession();
  return !!session;
}

/**
 * Get authenticated user ID from request
 * Throws if not authenticated
 * Returns Kratos identity ID
 */
export async function getAuthenticatedUserId(): Promise<string> {
  const session = await getServerSession();
  if (!session) {
    throw new Error('Unauthorized');
  }
  return session.identity.id;
}

/**
 * Get local user ID from request
 * Throws if not authenticated
 * Returns local database user ID
 */
export async function getLocalUserId(): Promise<string> {
  const session = await getServerSession();
  if (!session) {
    throw new Error('Unauthorized');
  }

  const { db } = await import('@/db');
  const { users } = await import('@/db/schema-auth');
  const { eq } = await import('drizzle-orm');

  const user = await db.query.users.findFirst({
    where: eq(users.kratosId, session.identity.id),
    columns: { id: true },
  });

  if (!user) {
    throw new Error('User not found in local database');
  }

  return user.id;
}

/**
 * Check if request is from admin user
 * Use in API routes
 */
export async function isAdminRequest(): Promise<boolean> {
  const session = await getServerSession();
  return session?.identity.traits.role === 'admin';
}

/**
 * Check if request is from admin with MFA
 * Use in sensitive API routes
 */
export async function isAdminWithMFA(): Promise<boolean> {
  const session = await getServerSession();
  return (
    session?.identity.traits.role === 'admin' &&
    session?.authenticator_assurance_level === 'aal2'
  );
}
```

---

## Usage Examples

### Protect Server Component

```typescript
// app/account/page.tsx
import { requireAuth } from '@/lib/auth/guards';

export default async function AccountPage() {
  const session = await requireAuth(); // Redirects if not authenticated

  return (
    <div>
      <h1>Welcome, {session.identity.traits.name}!</h1>
      <p>Email: {session.identity.traits.email}</p>
    </div>
  );
}
```

### Protect API Route

```typescript
// app/api/orders/route.ts
import { getLocalUserId } from '@/lib/auth/session';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { orders } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const userId = await getLocalUserId(); // Local DB user ID

    // Fetch user's orders
    const userOrders = await db.query.orders.findMany({
      where: eq(orders.userId, userId),
    });

    return NextResponse.json({ orders: userOrders });
  } catch (error) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
}
```

### Conditional Rendering

```typescript
// app/page.tsx
import { isAuthenticated, isAdmin } from '@/lib/auth/guards';

export default async function HomePage() {
  const authenticated = await isAuthenticated();
  const admin = await isAdmin();

  return (
    <div>
      <h1>Welcome</h1>

      {authenticated ? (
        <p>You are signed in</p>
      ) : (
        <a href="/auth/signin">Sign in</a>
      )}

      {admin && (
        <a href="/admin">Admin Panel</a>
      )}
    </div>
  );
}
```

### Admin-Only Component with MFA

```typescript
// app/admin/page.tsx
import { requireAdminWithMFA } from '@/lib/auth/guards';

export default async function AdminPage() {
  const session = await requireAdminWithMFA(); // Redirects if not admin or no MFA

  return (
    <div>
      <h1>Admin Dashboard</h1>
      <p>Welcome, {session.identity.traits.name}</p>
      <p>MFA Status: {session.authenticator_assurance_level}</p>
    </div>
  );
}
```

---

## Callback URL Handling

**How it works:**

1. User tries to access `/account/orders` while not authenticated
2. Middleware redirects to `/auth/signin?return_to=/account/orders`
3. User signs in
4. Ory redirect logic sends user to `return_to` parameter
5. User lands on `/account/orders`

**SignIn page implementation** (already in Phase 4.4.3):

```typescript
// app/auth/signin/page.tsx
export default async function SignInPage({ searchParams }) {
  const returnTo = searchParams.return_to || '/account';

  let flow;
  if (searchParams.flow) {
    const { data } = await kratosFrontend.getLoginFlow({ id: searchParams.flow });
    flow = data;
  } else {
    const { data } = await kratosFrontend.createBrowserLoginFlow({
      returnTo,
    });
    redirect(`/auth/signin?flow=${data.id}`);
  }

  return <OryFlowForm flow={flow} />;
}
```

**Ory's `return_to` vs NextAuth's `callbackUrl`:**
- Ory uses `return_to` parameter (standard across Ory ecosystem)
- Supports absolute URLs and relative paths
- Validated against allowed return URLs in Kratos config

---

## Error Handling

**Unauthorized API Responses:**

```typescript
// lib/auth/errors.ts
import { NextResponse } from 'next/server';

export function unauthorizedResponse() {
  return NextResponse.json(
    { error: 'Unauthorized', message: 'Authentication required' },
    { status: 401 }
  );
}

export function forbiddenResponse() {
  return NextResponse.json(
    { error: 'Forbidden', message: 'Insufficient permissions' },
    { status: 403 }
  );
}

export function mfaRequiredResponse() {
  return NextResponse.json(
    { error: 'MFA Required', message: 'Two-factor authentication required' },
    { status: 403 }
  );
}

// Usage in API routes:
import { isAdminWithMFA } from '@/lib/auth/session';
import { unauthorizedResponse, mfaRequiredResponse } from '@/lib/auth/errors';

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return unauthorizedResponse();
  }

  if (session.identity.traits.role !== 'admin') {
    return forbiddenResponse();
  }

  if (session.authenticator_assurance_level !== 'aal2') {
    return mfaRequiredResponse();
  }

  // ... handle request
}
```

---

## Implementation Steps

### Step 1: Create Middleware (45 min)

- [ ] Create `middleware.ts` in root
- [ ] Add Ory session validation
- [ ] Add admin route protection with MFA check
- [ ] Add account route protection
- [ ] Add auth redirect logic
- [ ] Configure matcher
- [ ] Test session cookie parsing

### Step 2: Create Guard Functions (30 min)

- [ ] Create `lib/auth/guards.ts`
- [ ] Implement getSession (Ory session)
- [ ] Implement requireAuth
- [ ] Implement requireAdmin
- [ ] Implement requireAdminWithMFA
- [ ] Implement isAuthenticated
- [ ] Implement isAdmin
- [ ] Implement getLocalUser (map Kratos ID → local user)

### Step 3: Create Session Helpers (25 min)

- [ ] Create `lib/auth/session.ts`
- [ ] Implement getServerSession
- [ ] Implement getAuthenticatedUserId (Kratos ID)
- [ ] Implement getLocalUserId (local DB ID)
- [ ] Implement isAuthenticatedRequest
- [ ] Implement isAdminRequest
- [ ] Implement isAdminWithMFA

### Step 4: Create Error Helpers (10 min)

- [ ] Create `lib/auth/errors.ts`
- [ ] Implement unauthorizedResponse
- [ ] Implement forbiddenResponse
- [ ] Implement mfaRequiredResponse

### Step 5: Create Placeholder Pages (20 min)

- [ ] Create `/account/page.tsx` (protected customer page)
- [ ] Create `/admin/page.tsx` (protected admin page with MFA)
- [ ] Test redirection

### Step 6: Test Middleware (50 min)

- [ ] Test admin route protection (no auth)
- [ ] Test admin route protection (customer role)
- [ ] Test admin route protection (admin without MFA)
- [ ] Test account route protection
- [ ] Test auth redirect (signed out)
- [ ] Test auth redirect away (signed in)
- [ ] Test return_to preservation
- [ ] Test role-based access (admin vs customer)
- [ ] Test MFA enforcement for admin routes
- [ ] Test session expiration handling

---

## Testing

### Manual Testing Checklist

**Signed Out User:**
- [ ] Access `/account` → Redirect to `/auth/signin?return_to=/account`
- [ ] Access `/admin` → Redirect to `/auth/signin?return_to=/admin`
- [ ] Access `/auth/signin` → Allow
- [ ] Access `/` → Allow

**Signed In Customer:**
- [ ] Access `/account` → Allow
- [ ] Access `/admin` → Redirect to `/`
- [ ] Access `/auth/signin` → Redirect to `/account`
- [ ] Access `/` → Allow

**Signed In Admin (No MFA):**
- [ ] Access `/account` → Allow
- [ ] Access `/admin` → Redirect to `/auth/mfa-required?return_to=/admin`
- [ ] Access `/auth/signin` → Redirect to `/account`
- [ ] Access `/` → Allow

**Signed In Admin (With MFA):**
- [ ] Access `/account` → Allow
- [ ] Access `/admin` → Allow
- [ ] Access `/auth/signin` → Redirect to `/account`
- [ ] Access `/` → Allow

**Return To URL:**
- [ ] Sign out
- [ ] Access `/account/orders` → Redirect to `/auth/signin?return_to=/account/orders`
- [ ] Sign in → Redirect to `/account/orders`

### Integration Testing

```typescript
// __tests__/middleware/auth-middleware.test.ts
import { NextRequest } from 'next/server';
import { middleware } from '@/middleware';

describe('Auth Middleware', () => {
  describe('Admin routes', () => {
    it('should redirect unauthenticated users to signin', async () => {
      const req = new NextRequest('http://localhost:3000/admin');
      const response = await middleware(req);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/auth/signin');
      expect(response.headers.get('location')).toContain('return_to=%2Fadmin');
    });

    it('should redirect customers to home', async () => {
      const req = new NextRequest('http://localhost:3000/admin');
      // Mock session cookie with customer role
      req.cookies.set('ory_session_imajinweb', 'customer_session_token');

      const response = await middleware(req);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe('http://localhost:3000/');
    });

    it('should redirect admin without MFA to mfa-required', async () => {
      const req = new NextRequest('http://localhost:3000/admin');
      // Mock session cookie with admin role but aal1
      req.cookies.set('ory_session_imajinweb', 'admin_no_mfa_session_token');

      const response = await middleware(req);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/auth/mfa-required');
    });

    it('should allow admin with MFA', async () => {
      const req = new NextRequest('http://localhost:3000/admin');
      // Mock session cookie with admin role and aal2
      req.cookies.set('ory_session_imajinweb', 'admin_with_mfa_session_token');

      const response = await middleware(req);

      expect(response).toBeNull(); // Allows request to proceed
    });
  });
});
```

---

## Acceptance Criteria

- [ ] Middleware protects admin routes
- [ ] Middleware enforces MFA for admin routes
- [ ] Middleware protects account routes
- [ ] Middleware redirects authenticated users from auth pages
- [ ] Return URLs preserved in redirects
- [ ] Role-based access works (admin vs customer)
- [ ] AAL2 enforcement works for admin routes
- [ ] Guard functions work in Server Components
- [ ] Session helpers work in API routes
- [ ] Local user ID mapping works (Kratos ID → local ID)
- [ ] No infinite redirect loops
- [ ] Middleware matcher configured correctly
- [ ] Session expiration handled gracefully

---

## Security Considerations

### CSRF Protection

Ory Kratos provides CSRF protection in self-service flows:
- CSRF token embedded in flow UI nodes
- Token validated on form submission
- HTTP-only cookies prevent XSS
- No additional middleware needed

### Session Hijacking

Mitigation:
- Ory sessions expire after configurable duration (default: 24 hours)
- Refresh tokens available for long-lived sessions
- HTTPS only in production
- HTTP-only cookies
- SameSite=Lax cookie attribute

### Timing Attacks

Mitigation:
- Ory's password comparison is constant-time
- Generic error messages: "Invalid credentials"
- No distinction between "user exists" and "wrong password"

### MFA Bypass Prevention

Mitigation:
- AAL level checked in middleware before page render
- AAL level stored in session, not client-controlled
- Admin routes require AAL2 explicitly
- Cannot downgrade AAL within same session

### Session Fixation

Mitigation:
- Ory rotates session tokens on privilege escalation
- New session created after MFA enrollment
- Old session invalidated on password change

---

## Troubleshooting

**Infinite redirect loop:**
```bash
# Check middleware matcher - ensure it's not matching ALL routes
# Ensure auth pages (/auth/*) are excluded from protected route checks
# Verify return_to parameter is not pointing to signin page
```

**Middleware not running:**
```bash
# Verify middleware.ts is in root (not /app or /lib)
# Check matcher config
# Restart dev server
# Check Next.js version (middleware supported in 12+)
```

**Return URL not preserved:**
```bash
# Verify middleware sets return_to parameter
# Check Kratos config for allowed return URLs
# Verify SignIn page passes return_to to createBrowserLoginFlow
```

**Session not available in middleware:**
```bash
# Check Ory Kratos is running (http://localhost:4433/health/ready)
# Verify KRATOS_PUBLIC_URL is set in .env
# Check session cookie name matches project slug
# Inspect cookies in browser DevTools
```

**MFA requirement not enforced:**
```bash
# Verify session.authenticator_assurance_level is checked
# Check Kratos config for AAL settings
# Ensure TOTP method is enabled in identity schema
# Test with aal=aal2 query parameter in login flow
```

---

## Environment Variables

**Required:**

```bash
# Ory Kratos
KRATOS_PUBLIC_URL=http://localhost:4433
KRATOS_ADMIN_URL=http://localhost:4434

# Session cookie name (must match Kratos config)
ORY_SESSION_COOKIE_NAME=ory_session_imajinweb
```

---

## Next Steps

After Phase 4.4.4 complete:
1. **Phase 4.4.5:** Integrate with orders and checkout
2. **Phase 4.4.6:** SendGrid email integration (Ory SMTP config)
3. **Phase 4.4.7:** Testing (unit, integration, E2E)

---

**See Also:**
- `docs/tasks/Phase 4.4.3 - Auth UI Components.md` - Previous phase
- `docs/tasks/Phase 4.4.5 - Integration with Existing Features.md` - Next phase
- `docs/tasks/Phase 4.4.2 - Ory Kratos Setup.md` - Kratos configuration
- `docs/AUTH_STRATEGY.md` - Overall strategy
- Ory Middleware Docs: https://www.ory.sh/docs/kratos/guides/integrate-with-nextjs-app-router
