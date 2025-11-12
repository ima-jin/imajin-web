# Phase 4.4: Authentication Implementation

**Status:** Ready for Implementation 🟡
**Estimated Effort:** 20-25 hours
**Dependencies:** Phase 2.5.2.1 complete (orders, checkout flow)
**Next Phase:** Phase 4.5 (User Dashboard - order history, profile)

---

## Overview

Implement traditional email/password authentication with NextAuth.js, designed to evolve to DID/wallet auth without breaking changes.

**Philosophy Alignment:**
- ✅ Self-hosted (no vendor lock-in)
- ✅ No subscriptions
- ✅ No big tech OAuth (skip Google/GitHub)
- ✅ DID-ready schema (wallet auth path)
- ✅ SendGrid for email (self-managed)

**Why Now:**
- Blocks CRM features (customer tracking, order history)
- Blocks user dashboard (my orders, profile)
- Blocks admin panel (user management)
- Cart persistence across sessions

---

## Architecture Decisions

### Auth Provider: NextAuth.js (Auth.js v5)

**Selected Providers:**
- ✅ **Credentials** (email/password) - Today
- ✅ **Wallet** (Solana) - Future (Phase 5+)
- ❌ **OAuth** (Google/GitHub) - Doesn't align with philosophy

### Email Service: SendGrid

**Capabilities:**
- Email verification (new signups)
- Password reset (email link)
- SMS verification (optional, via SendGrid)
- Order confirmations (if not using Stripe emails)

**Free Tier:** 100 emails/day
**Paid:** $19.95/month for 50K emails

### Guest Checkout

**Phase 4.4:** Disabled (require account)
**Future:** Can be enabled with nullable user_id on orders

### Admin Access

**Phase 4.4:** Manual SQL insert
**Future:** Admin invite system (Phase 4.5+)

---

## Database Schema

### New Tables

**users:**
```typescript
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Email/password auth (Phase 4.4)
  email: text('email').unique().notNull(),
  emailVerified: timestamp('email_verified'),
  name: text('name'),
  image: text('image'),
  passwordHash: text('password_hash'),
  role: text('role').notNull().default('customer'), // 'customer' | 'admin'

  // DID/wallet auth (Phase 5+ - nullable)
  did: text('did').unique(),
  publicKey: text('public_key'),
  walletAddress: text('wallet_address').unique(),
  credentials: jsonb('credentials').$type<VerifiableCredential[]>().default([]),

  // Metadata
  metadata: jsonb('metadata').$type<UserMetadata>().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_did ON users(did) WHERE did IS NOT NULL;
CREATE INDEX idx_users_wallet_address ON users(wallet_address) WHERE wallet_address IS NOT NULL;
CREATE INDEX idx_users_role ON users(role);
```

**accounts:**
```typescript
export const accounts = pgTable('accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // 'credentials' | 'wallet'
  provider: text('provider').notNull(), // 'credentials' | 'solana'
  providerAccountId: text('provider_account_id').notNull(),
  refreshToken: text('refresh_token'),
  accessToken: text('access_token'),
  expiresAt: integer('expires_at'),
  tokenType: text('token_type'),
  scope: text('scope'),
  idToken: text('id_token'),
  sessionState: text('session_state'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  providerUnique: unique().on(table.provider, table.providerAccountId),
}));

CREATE INDEX idx_accounts_user_id ON accounts(user_id);
```

**sessions:**
```typescript
export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  sessionToken: text('session_token').unique().notNull(),
  expires: timestamp('expires').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_session_token ON sessions(session_token);
CREATE INDEX idx_sessions_expires ON sessions(expires);
```

**verification_tokens:**
```typescript
export const verificationTokens = pgTable('verification_tokens', {
  identifier: text('identifier').notNull(), // email or phone
  token: text('token').notNull(),
  expires: timestamp('expires').notNull(),
}, (table) => ({
  identifierTokenUnique: unique().on(table.identifier, table.token),
}));

CREATE INDEX idx_verification_tokens_identifier ON verification_tokens(identifier);
CREATE INDEX idx_verification_tokens_token ON verification_tokens(token);
CREATE INDEX idx_verification_tokens_expires ON verification_tokens(expires);
```

### Schema Updates

**orders table - add user_id:**
```sql
ALTER TABLE orders ADD COLUMN user_id UUID REFERENCES users(id);
CREATE INDEX idx_orders_user_id ON orders(user_id);

-- Backfill existing orders (match by email)
UPDATE orders o
SET user_id = u.id
FROM users u
WHERE o.customer_email = u.email;
```

---

## Implementation Steps

### Step 1: Database Schema (3 hours)

**Files:**
- `db/schema-auth.ts` - Auth tables
- `db/migrations/XXXX_add_auth_tables.sql` - Migration

**Tasks:**
- [ ] Create Drizzle schema for users, accounts, sessions, verification_tokens
- [ ] Add TypeScript types for VerifiableCredential, UserMetadata
- [ ] Generate migration
- [ ] Run migration on dev database
- [ ] Run migration on test database
- [ ] Update seed data to include test users

**Test Users (seed):**
```typescript
// Admin user
{
  email: 'admin@imajin.ca',
  passwordHash: await hashPassword('admin-dev-password'),
  role: 'admin',
  name: 'Admin User',
  emailVerified: new Date(),
}

// Customer user
{
  email: 'customer@example.com',
  passwordHash: await hashPassword('customer-dev-password'),
  role: 'customer',
  name: 'Test Customer',
  emailVerified: new Date(),
}
```

**Acceptance:**
- [ ] Schema created without errors
- [ ] Migration runs successfully
- [ ] Indexes created
- [ ] Seed users created

---

### Step 2: NextAuth Configuration (4 hours)

**Files:**
- `lib/auth/config.ts` - NextAuth config
- `lib/auth/password.ts` - Password hashing utilities
- `app/api/auth/[...nextauth]/route.ts` - API route handler
- `.env` - Add auth secrets

**Tasks:**
- [ ] Install dependencies: `next-auth@beta`, `@auth/drizzle-adapter`, `bcryptjs`, `@types/bcryptjs`
- [ ] Create NextAuth config with Credentials provider
- [ ] Set up Drizzle adapter
- [ ] Configure JWT session strategy
- [ ] Add role to JWT/session callbacks
- [ ] Create API route handler
- [ ] Generate NEXTAUTH_SECRET
- [ ] Configure SendGrid for email verification

**NextAuth Config:**
```typescript
import NextAuth, { NextAuthConfig } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db";
import { users, accounts, sessions, verificationTokens } from "@/db/schema-auth";
import { compare } from "bcryptjs";
import { eq } from "drizzle-orm";

export const authConfig: NextAuthConfig = {
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),

  providers: [
    CredentialsProvider({
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await db.query.users.findFirst({
          where: eq(users.email, credentials.email as string),
        });

        if (!user || !user.passwordHash) {
          return null;
        }

        const isValid = await compare(credentials.password as string, user.passwordHash);
        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },

  pages: {
    signIn: "/auth/signin",
    signUp: "/auth/signup",
    error: "/auth/error",
    verifyRequest: "/auth/verify",
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
```

**Environment Variables:**
```bash
# NextAuth
NEXTAUTH_URL=http://localhost:30000
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>

# SendGrid
SENDGRID_API_KEY=<your sendgrid api key>
EMAIL_FROM=noreply@imajin.ca
```

**Acceptance:**
- [ ] NextAuth configured without errors
- [ ] Can authenticate test users
- [ ] JWT token includes user id and role
- [ ] Session persists across page reloads

---

### Step 3: Auth UI Components (5 hours)

**Files:**
- `app/auth/signin/page.tsx` - Sign in page
- `app/auth/signup/page.tsx` - Sign up page
- `app/auth/verify/page.tsx` - Email verification
- `app/auth/reset-password/page.tsx` - Password reset request
- `app/auth/reset-password/[token]/page.tsx` - Password reset form
- `app/auth/error/page.tsx` - Auth error page
- `components/auth/SignInForm.tsx` - Sign in form component
- `components/auth/SignUpForm.tsx` - Sign up form component
- `components/auth/PasswordResetForm.tsx` - Password reset form
- `components/auth/UserNav.tsx` - User dropdown in header

**Sign In Form:**
```typescript
'use client';

import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function SignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password');
      } else {
        router.push('/account');
        router.refresh();
      }
    } catch (err) {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="text-red-600 text-sm">{error}</div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="mt-1 block w-full rounded border px-3 py-2"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="mt-1 block w-full rounded border px-3 py-2"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-black text-white py-2 rounded hover:bg-gray-800 disabled:opacity-50"
      >
        {loading ? 'Signing in...' : 'Sign In'}
      </button>

      <div className="text-sm text-center">
        <a href="/auth/reset-password" className="text-blue-600 hover:underline">
          Forgot password?
        </a>
      </div>

      <div className="text-sm text-center">
        Don't have an account?{' '}
        <a href="/auth/signup" className="text-blue-600 hover:underline">
          Sign up
        </a>
      </div>
    </form>
  );
}
```

**User Navigation Component:**
```typescript
'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';

export function UserNav() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <div className="text-sm">Loading...</div>;
  }

  if (!session) {
    return (
      <div className="flex items-center gap-4">
        <Link href="/auth/signin" className="text-sm hover:underline">
          Sign In
        </Link>
        <Link
          href="/auth/signup"
          className="bg-black text-white px-4 py-2 rounded text-sm hover:bg-gray-800"
        >
          Sign Up
        </Link>
      </div>
    );
  }

  return (
    <div className="relative group">
      <button className="flex items-center gap-2">
        <span className="text-sm">{session.user.name || session.user.email}</span>
      </button>

      <div className="absolute right-0 mt-2 w-48 bg-white border rounded shadow-lg hidden group-hover:block">
        <Link
          href="/account"
          className="block px-4 py-2 text-sm hover:bg-gray-100"
        >
          My Account
        </Link>
        <Link
          href="/account/orders"
          className="block px-4 py-2 text-sm hover:bg-gray-100"
        >
          Order History
        </Link>
        {session.user.role === 'admin' && (
          <Link
            href="/admin"
            className="block px-4 py-2 text-sm hover:bg-gray-100"
          >
            Admin Panel
          </Link>
        )}
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
```

**Password Requirements:**
- Minimum 10 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- No common passwords (zxcvbn library)

**Acceptance:**
- [ ] Sign in form works
- [ ] Sign up form works with validation
- [ ] Email verification flow works
- [ ] Password reset flow works
- [ ] User dropdown shows in header
- [ ] Forms are accessible (keyboard nav, ARIA labels)

---

### Step 4: Protected Routes & Middleware (2 hours)

**Files:**
- `middleware.ts` - Auth middleware
- `lib/auth/guards.ts` - Auth guard utilities
- `lib/auth/session.ts` - Server-side session helpers

**Middleware:**
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
      return NextResponse.redirect(new URL('/auth/signin?callbackUrl=/admin', req.url));
    }
    if (!isAdmin) {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  // Protect account routes
  if (pathname.startsWith('/account')) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/auth/signin?callbackUrl=/account', req.url));
    }
  }

  // Redirect authenticated users away from auth pages
  if (pathname.startsWith('/auth/signin') || pathname.startsWith('/auth/signup')) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/account', req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/admin/:path*', '/account/:path*', '/auth/:path*'],
};
```

**Server-Side Session Helper:**
```typescript
import { auth } from '@/lib/auth/config';
import { redirect } from 'next/navigation';

export async function getSession() {
  const session = await auth();
  return session;
}

export async function requireAuth() {
  const session = await auth();
  if (!session) {
    redirect('/auth/signin');
  }
  return session;
}

export async function requireAdmin() {
  const session = await auth();
  if (!session || session.user.role !== 'admin') {
    redirect('/');
  }
  return session;
}
```

**Acceptance:**
- [ ] Admin routes protected (redirect to signin)
- [ ] Account routes protected (redirect to signin)
- [ ] Authenticated users redirected away from signin/signup
- [ ] Role-based access works (admin vs customer)
- [ ] Callback URL preserved after signin

---

### Step 5: Integration with Existing Features (4 hours)

**Files:**
- `app/account/page.tsx` - User account page
- `app/account/orders/page.tsx` - Order history
- `app/api/checkout/session/route.ts` - Update to link user
- `app/api/cart/route.ts` - Update to persist cart

**Link Orders to Users:**
```typescript
// In checkout session creation
const session = await getSession();
const userId = session?.user?.id;

await db.insert(orders).values({
  // ... existing fields
  userId: userId || null, // Link to user if authenticated
  customerEmail: email,
});
```

**Order History Page:**
```typescript
import { requireAuth } from '@/lib/auth/session';
import { db } from '@/db';
import { orders } from '@/db/schema';
import { eq } from 'drizzle-orm';

export default async function OrderHistoryPage() {
  const session = await requireAuth();

  const userOrders = await db.query.orders.findMany({
    where: eq(orders.userId, session.user.id),
    orderBy: (orders, { desc }) => [desc(orders.createdAt)],
    with: {
      orderItems: true,
    },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Order History</h1>

      {userOrders.length === 0 ? (
        <p>No orders yet.</p>
      ) : (
        <div className="space-y-4">
          {userOrders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}
```

**Cart Persistence:**
- Store cart in database linked to user_id (future enhancement)
- For now: localStorage works, authenticated users can see cart after signin

**Acceptance:**
- [ ] Orders linked to users at checkout
- [ ] Order history page shows user's orders
- [ ] Account page shows user info
- [ ] Cart persists for authenticated users
- [ ] Existing orders can be backfilled by email match

---

### Step 6: SendGrid Email Integration (3 hours)

**Files:**
- `lib/email/sendgrid.ts` - SendGrid client
- `lib/email/templates.ts` - Email templates
- `app/api/auth/send-verification/route.ts` - Email verification endpoint

**SendGrid Client:**
```typescript
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  await sgMail.send({
    to,
    from: process.env.EMAIL_FROM!,
    subject,
    html,
    text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
  });
}
```

**Email Templates:**
```typescript
export function getVerificationEmailTemplate(verificationUrl: string) {
  return {
    subject: 'Verify your email - Imajin',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1>Verify Your Email</h1>
        <p>Click the link below to verify your email address:</p>
        <a href="${verificationUrl}" style="display: inline-block; background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
          Verify Email
        </a>
        <p>Or copy this link: ${verificationUrl}</p>
        <p>This link expires in 24 hours.</p>
      </div>
    `,
  };
}

export function getPasswordResetEmailTemplate(resetUrl: string) {
  return {
    subject: 'Reset your password - Imajin',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1>Reset Your Password</h1>
        <p>Click the link below to reset your password:</p>
        <a href="${resetUrl}" style="display: inline-block; background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
          Reset Password
        </a>
        <p>Or copy this link: ${resetUrl}</p>
        <p>This link expires in 1 hour.</p>
        <p>If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  };
}
```

**Acceptance:**
- [ ] Email verification sends successfully
- [ ] Password reset sends successfully
- [ ] Email templates render correctly
- [ ] Links expire after timeout
- [ ] SendGrid API key configured

---

### Step 7: Testing (4 hours)

**Test Files:**
- `tests/unit/lib/auth/password.test.ts` - Password hashing
- `tests/integration/auth/signin.test.ts` - Sign in flow
- `tests/integration/auth/signup.test.ts` - Sign up flow
- `tests/integration/auth/password-reset.test.ts` - Password reset
- `tests/integration/auth/protected-routes.test.ts` - Route protection
- `tests/e2e/auth/auth-flow.spec.ts` - Full auth flow (Playwright)

**Unit Tests:**
```typescript
import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '@/lib/auth/password';

describe('Password Utilities', () => {
  it('should hash password', async () => {
    const password = 'SecurePassword123';
    const hash = await hashPassword(password);

    expect(hash).toBeDefined();
    expect(hash).not.toBe(password);
    expect(hash.startsWith('$2')).toBe(true); // bcrypt hash
  });

  it('should verify correct password', async () => {
    const password = 'SecurePassword123';
    const hash = await hashPassword(password);
    const isValid = await verifyPassword(password, hash);

    expect(isValid).toBe(true);
  });

  it('should reject incorrect password', async () => {
    const password = 'SecurePassword123';
    const hash = await hashPassword(password);
    const isValid = await verifyPassword('WrongPassword', hash);

    expect(isValid).toBe(false);
  });
});
```

**Integration Tests:**
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/db';
import { users } from '@/db/schema-auth';
import { signIn } from 'next-auth/react';

describe('Sign In Flow', () => {
  beforeEach(async () => {
    // Clean up
    await db.delete(users);

    // Create test user
    await db.insert(users).values({
      email: 'test@example.com',
      passwordHash: await hashPassword('TestPassword123'),
      emailVerified: new Date(),
      role: 'customer',
    });
  });

  it('should sign in with correct credentials', async () => {
    const result = await signIn('credentials', {
      email: 'test@example.com',
      password: 'TestPassword123',
      redirect: false,
    });

    expect(result.error).toBeNull();
    expect(result.ok).toBe(true);
  });

  it('should reject incorrect password', async () => {
    const result = await signIn('credentials', {
      email: 'test@example.com',
      password: 'WrongPassword',
      redirect: false,
    });

    expect(result.error).toBe('CredentialsSignin');
    expect(result.ok).toBe(false);
  });

  it('should reject non-existent user', async () => {
    const result = await signIn('credentials', {
      email: 'nonexistent@example.com',
      password: 'AnyPassword123',
      redirect: false,
    });

    expect(result.error).toBe('CredentialsSignin');
    expect(result.ok).toBe(false);
  });
});
```

**E2E Tests:**
```typescript
import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('full signup and signin flow', async ({ page }) => {
    // Sign up
    await page.goto('/auth/signup');
    await page.fill('input[name="email"]', 'newuser@example.com');
    await page.fill('input[name="password"]', 'SecurePassword123');
    await page.fill('input[name="name"]', 'New User');
    await page.click('button[type="submit"]');

    // Check for verification message
    await expect(page.locator('text=verify your email')).toBeVisible();

    // (Skip email verification for test - mark as verified in DB)

    // Sign in
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', 'newuser@example.com');
    await page.fill('input[name="password"]', 'SecurePassword123');
    await page.click('button[type="submit"]');

    // Should redirect to account page
    await expect(page).toHaveURL('/account');
    await expect(page.locator('text=New User')).toBeVisible();
  });

  test('protected route redirects to signin', async ({ page }) => {
    await page.goto('/account');

    // Should redirect to signin
    await expect(page).toHaveURL(/\/auth\/signin/);
  });
});
```

**Test Coverage:**
- [ ] Password hashing/verification
- [ ] Sign in with valid credentials
- [ ] Sign in with invalid credentials
- [ ] Sign up creates user
- [ ] Sign up validates password strength
- [ ] Email verification flow
- [ ] Password reset flow
- [ ] Protected routes redirect
- [ ] Role-based access control
- [ ] Session persistence

**Acceptance:**
- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] All E2E tests passing
- [ ] Test coverage >80%

---

## Success Criteria

**Phase 4.4 Complete When:**
- ✅ Users can sign up with email/password
- ✅ Users can sign in and sign out
- ✅ Users can reset forgotten passwords
- ✅ Email verification works (SendGrid)
- ✅ Users can view order history
- ✅ Admin routes protected by role check
- ✅ All tests passing (unit, integration, E2E)
- ✅ Documentation complete

**DID-Ready When:**
- ✅ Schema supports wallet/DID fields (nullable)
- ✅ Accounts table supports multiple providers
- ✅ No breaking changes needed for wallet auth
- ✅ Users can link wallet to existing account (future)

---

## Environment Setup

**Required Environment Variables:**
```bash
# NextAuth
NEXTAUTH_URL=http://localhost:30000
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>

# SendGrid
SENDGRID_API_KEY=<your sendgrid api key>
EMAIL_FROM=noreply@imajin.ca
```

**SendGrid Setup:**
1. Create SendGrid account (free tier)
2. Verify sender identity (noreply@imajin.ca)
3. Create API key with "Mail Send" permission
4. Add to .env.local

**Test SendGrid:**
```bash
curl --request POST \
  --url https://api.sendgrid.com/v3/mail/send \
  --header "Authorization: Bearer $SENDGRID_API_KEY" \
  --header 'Content-Type: application/json' \
  --data '{"personalizations":[{"to":[{"email":"your@email.com"}]}],"from":{"email":"noreply@imajin.ca"},"subject":"Test","content":[{"type":"text/plain","value":"Test email"}]}'
```

---

## Admin User Creation

**Manual SQL Insert:**
```sql
-- Generate password hash first (in Node REPL)
-- const bcrypt = require('bcryptjs');
-- bcrypt.hashSync('your-admin-password', 12);

INSERT INTO users (
  id,
  email,
  password_hash,
  role,
  name,
  email_verified,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'admin@imajin.ca',
  '$2a$12$...your-hash-here...',
  'admin',
  'Admin User',
  NOW(),
  NOW(),
  NOW()
);
```

**Or use seed script:**
```typescript
// scripts/seed-admin.ts
import { db } from '@/db';
import { users } from '@/db/schema-auth';
import { hashPassword } from '@/lib/auth/password';

async function seedAdmin() {
  const adminEmail = 'admin@imajin.ca';
  const adminPassword = process.env.ADMIN_PASSWORD || 'change-me';

  await db.insert(users).values({
    email: adminEmail,
    passwordHash: await hashPassword(adminPassword),
    role: 'admin',
    name: 'Admin User',
    emailVerified: new Date(),
  }).onConflictDoNothing();

  console.log(`Admin user created: ${adminEmail}`);
}

seedAdmin();
```

---

## Documentation Updates

**Files to Update:**
- [ ] `README.md` - Add auth setup instructions
- [ ] `CLAUDE.md` - Update current phase to 4.4 complete
- [ ] `IMPLEMENTATION_PLAN.md` - Mark Phase 4.4 complete
- [ ] Create `docs/AUTH.md` - User guide (how to sign in, reset password)
- [ ] Create `docs/AUTH_API.md` - Developer guide (API endpoints)

---

## Timeline

**Total Estimated: 20-25 hours**

| Step | Task | Time |
|------|------|------|
| 1 | Database Schema | 3h |
| 2 | NextAuth Config | 4h |
| 3 | Auth UI Components | 5h |
| 4 | Protected Routes | 2h |
| 5 | Integration | 4h |
| 6 | SendGrid Email | 3h |
| 7 | Testing | 4h |

**Breaks:** Allow for debugging, testing, refinement

---

## Dependencies

**NPM Packages:**
```bash
npm install next-auth@beta @auth/drizzle-adapter bcryptjs @types/bcryptjs @sendgrid/mail zxcvbn @types/zxcvbn
```

**Dev Dependencies:**
```bash
npm install -D @playwright/test
```

---

## Risk Mitigation

**Risk: Email deliverability**
- Mitigation: Use SendGrid verified sender, test with multiple email providers

**Risk: Password security**
- Mitigation: Strong password requirements, bcrypt with cost factor 12

**Risk: Session hijacking**
- Mitigation: HTTPS only, HTTP-only cookies, CSRF protection

**Risk: Breaking changes with DID migration**
- Mitigation: Schema designed for extensibility, nullable DID fields

---

## Future Enhancements (Phase 5+)

**Phase 5.1: Wallet Auth**
- Add Solana wallet provider (Phantom, Solflare)
- Sign-in with wallet signature
- Link wallet to existing account

**Phase 5.2: DID Integration**
- Generate W3C DIDs for users
- Implement DID resolution
- Verify DIDs on-chain

**Phase 5.3: Verifiable Credentials**
- Store VCs in credentials JSONB field
- Verify credential signatures
- Display verified badges

**Phase 5.4: Social Recovery**
- Shamir's Secret Sharing for key recovery
- Trusted contacts
- Time-locked recovery

**Phase 5.5: Hardware Wallet**
- Ledger/Trezor integration
- Secure key storage
- Transaction signing

---

**See Also:**
- `docs/AUTH_STRATEGY.md` - Full strategy and DID evolution path
- `D:\Projects\imajin\imajin-ai\mjn\layer-2-identity\IDENTITY_LAYER.md` - DID architecture
- `D:\Projects\imajin\imajin-ai\mjn\architecture\SECURITY.md` - Key management
