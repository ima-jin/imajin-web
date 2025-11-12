# Phase 4.4.4: Protected Routes & Middleware

**Status:** Ready for Implementation 🟡
**Estimated Effort:** 2 hours
**Dependencies:** Phase 4.4.3 complete (Auth UI exists)
**Next Phase:** Phase 4.4.5 (Integration with Existing Features)

---

## Overview

Implement authentication middleware to protect routes, enforce role-based access control, and handle redirect logic with callback URLs.

**Protected Routes:**
- `/account/*` - Customer account pages (require auth)
- `/admin/*` - Admin pages (require admin role)
- `/auth/signin`, `/auth/signup` - Redirect if already authenticated

---

## Middleware Architecture

Next.js middleware runs before route handlers, enabling:
- Authentication checks before rendering
- Role-based access control
- Redirect logic with preserved URLs
- CSRF protection (built into NextAuth)

---

## Main Middleware

**File:** `middleware.ts`

```typescript
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isAuthenticated = !!req.auth;
  const isAdmin = req.auth?.user?.role === 'admin';

  // Protect admin routes
  if (pathname.startsWith('/admin')) {
    if (!isAuthenticated) {
      const signInUrl = new URL('/auth/signin', req.url);
      signInUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(signInUrl);
    }

    if (!isAdmin) {
      // Authenticated but not admin → redirect to home
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  // Protect account routes
  if (pathname.startsWith('/account')) {
    if (!isAuthenticated) {
      const signInUrl = new URL('/auth/signin', req.url);
      signInUrl.searchParams.set('callbackUrl', pathname);
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
});

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
1. NextAuth's `auth()` wrapper provides `req.auth` with session
2. Check pathname against protected route patterns
3. Redirect to signin if not authenticated
4. Redirect to home if authenticated but missing required role
5. Preserve original URL in `callbackUrl` for post-signin redirect

---

## Server-Side Guards

**File:** `lib/auth/guards.ts`

```typescript
import { auth } from '@/lib/auth/config';
import { redirect } from 'next/navigation';

/**
 * Server-side guard: Require authentication
 * Use in Server Components and Route Handlers
 */
export async function requireAuth() {
  const session = await auth();
  if (!session) {
    redirect('/auth/signin');
  }
  return session;
}

/**
 * Server-side guard: Require admin role
 * Use in Server Components and Route Handlers
 */
export async function requireAdmin() {
  const session = await auth();
  if (!session) {
    redirect('/auth/signin');
  }
  if (session.user.role !== 'admin') {
    redirect('/');
  }
  return session;
}

/**
 * Server-side check: Is user authenticated?
 * Use for conditional rendering in Server Components
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await auth();
  return !!session;
}

/**
 * Server-side check: Is user admin?
 * Use for conditional rendering in Server Components
 */
export async function isAdmin(): Promise<boolean> {
  const session = await auth();
  return session?.user.role === 'admin';
}

/**
 * Get current session (no redirect)
 * Use when session is optional
 */
export async function getSession() {
  return await auth();
}

/**
 * Get current user ID (throws if not authenticated)
 * Use when you need just the user ID
 */
export async function getUserId(): Promise<string> {
  const session = await requireAuth();
  return session.user.id;
}
```

---

## Session Helpers

**File:** `lib/auth/session.ts`

```typescript
import { auth } from '@/lib/auth/config';

/**
 * Get current session (server-side only)
 * @returns Session or null
 */
export async function getServerSession() {
  return await auth();
}

/**
 * Check if request is from authenticated user
 * Use in API routes
 */
export async function isAuthenticatedRequest(): Promise<boolean> {
  const session = await auth();
  return !!session;
}

/**
 * Get authenticated user ID from request
 * Throws if not authenticated
 */
export async function getAuthenticatedUserId(): Promise<string> {
  const session = await auth();
  if (!session) {
    throw new Error('Unauthorized');
  }
  return session.user.id;
}

/**
 * Check if request is from admin user
 * Use in API routes
 */
export async function isAdminRequest(): Promise<boolean> {
  const session = await auth();
  return session?.user.role === 'admin';
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
      <h1>Welcome, {session.user.name}!</h1>
    </div>
  );
}
```

### Protect API Route

```typescript
// app/api/orders/route.ts
import { getAuthenticatedUserId } from '@/lib/auth/session';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId();

    // Fetch user's orders
    const orders = await db.query.orders.findMany({
      where: eq(orders.userId, userId),
    });

    return NextResponse.json({ orders });
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

### Admin-Only Component

```typescript
// app/admin/page.tsx
import { requireAdmin } from '@/lib/auth/guards';

export default async function AdminPage() {
  const session = await requireAdmin(); // Redirects if not admin

  return (
    <div>
      <h1>Admin Dashboard</h1>
      <p>Welcome, {session.user.name}</p>
    </div>
  );
}
```

---

## Callback URL Handling

**How it works:**

1. User tries to access `/account/orders` while not authenticated
2. Middleware redirects to `/auth/signin?callbackUrl=/account/orders`
3. User signs in
4. SignInForm redirects to `callbackUrl` parameter
5. User lands on `/account/orders`

**SignInForm implementation** (already in Phase 4.4.3):

```typescript
const searchParams = useSearchParams();
const callbackUrl = searchParams.get('callbackUrl') || '/account';

// After successful sign in:
router.push(callbackUrl);
```

---

## Error Handling

**Unauthorized API Responses:**

```typescript
// Standard error response for auth failures
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

// Usage in API routes:
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return unauthorizedResponse();
  }
  if (session.user.role !== 'admin') {
    return forbiddenResponse();
  }
  // ... handle request
}
```

---

## Implementation Steps

### Step 1: Create Middleware (30 min)

- [ ] Create `middleware.ts` in root
- [ ] Add admin route protection
- [ ] Add account route protection
- [ ] Add auth redirect logic
- [ ] Configure matcher

### Step 2: Create Guard Functions (20 min)

- [ ] Create `lib/auth/guards.ts`
- [ ] Implement requireAuth
- [ ] Implement requireAdmin
- [ ] Implement isAuthenticated
- [ ] Implement isAdmin

### Step 3: Create Session Helpers (15 min)

- [ ] Create `lib/auth/session.ts`
- [ ] Implement getAuthenticatedUserId
- [ ] Implement isAuthenticatedRequest
- [ ] Implement isAdminRequest

### Step 4: Create Placeholder Pages (20 min)

- [ ] Create `/account/page.tsx` (protected customer page)
- [ ] Create `/admin/page.tsx` (protected admin page)
- [ ] Test redirection

### Step 5: Test Middleware (35 min)

- [ ] Test admin route protection
- [ ] Test account route protection
- [ ] Test auth redirect (signed out)
- [ ] Test auth redirect away (signed in)
- [ ] Test callback URL preservation
- [ ] Test role-based access (admin vs customer)

---

## Testing

### Manual Testing Checklist

**Signed Out User:**
- [ ] Access `/account` → Redirect to `/auth/signin?callbackUrl=/account`
- [ ] Access `/admin` → Redirect to `/auth/signin?callbackUrl=/admin`
- [ ] Access `/auth/signin` → Allow
- [ ] Access `/` → Allow

**Signed In Customer:**
- [ ] Access `/account` → Allow
- [ ] Access `/admin` → Redirect to `/`
- [ ] Access `/auth/signin` → Redirect to `/account`
- [ ] Access `/` → Allow

**Signed In Admin:**
- [ ] Access `/account` → Allow
- [ ] Access `/admin` → Allow
- [ ] Access `/auth/signin` → Redirect to `/account`
- [ ] Access `/` → Allow

**Callback URL:**
- [ ] Sign out
- [ ] Access `/account/orders` → Redirect to `/auth/signin?callbackUrl=/account/orders`
- [ ] Sign in → Redirect to `/account/orders`

---

## Acceptance Criteria

- [ ] Middleware protects admin routes
- [ ] Middleware protects account routes
- [ ] Middleware redirects authenticated users from auth pages
- [ ] Callback URLs preserved in redirects
- [ ] Role-based access works (admin vs customer)
- [ ] Guard functions work in Server Components
- [ ] Session helpers work in API routes
- [ ] No infinite redirect loops
- [ ] Middleware matcher configured correctly

---

## Security Considerations

### CSRF Protection

NextAuth.js provides CSRF protection automatically:
- CSRF token generated on page load
- Token validated on form submission
- HTTP-only cookies prevent XSS

### Session Hijacking

Mitigation:
- JWT tokens expire after 30 days
- Rotate tokens on sensitive operations
- HTTPS only in production
- HTTP-only cookies

### Timing Attacks

Mitigation:
- bcrypt comparison is constant-time
- Don't leak "user exists" vs "wrong password"
- Generic error messages: "Invalid credentials"

---

## Troubleshooting

**Infinite redirect loop:**
```bash
# Check middleware matcher - ensure it's not matching ALL routes
# Ensure auth pages (/auth/*) are excluded from protected route checks
```

**Middleware not running:**
```bash
# Verify middleware.ts is in root (not /app or /lib)
# Check matcher config
# Restart dev server
```

**Callback URL not preserved:**
```bash
# Verify SignInForm reads searchParams
# Check URL encoding (use encodeURIComponent)
```

**Session not available in middleware:**
```bash
# Ensure using NextAuth's auth() wrapper
# Verify NEXTAUTH_SECRET is set
# Check cookies in browser DevTools
```

---

## Next Steps

After Phase 4.4.4 complete:
1. **Phase 4.4.5:** Integrate with orders and checkout
2. **Phase 4.4.6:** SendGrid email integration
3. **Phase 4.4.7:** Testing (unit, integration, E2E)

---

**See Also:**
- `docs/tasks/Phase 4.4.3 - Auth UI Components.md` - Previous phase
- `docs/tasks/Phase 4.4.5 - Integration with Existing Features.md` - Next phase
- `docs/AUTH_STRATEGY.md` - Overall strategy
