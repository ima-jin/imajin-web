# Phase 4.4.2: NextAuth Configuration

**Status:** Ready for Implementation 🟡
**Estimated Effort:** 4 hours
**Dependencies:** Phase 4.4.1 complete (auth tables exist)
**Next Phase:** Phase 4.4.3 (Auth UI Components)

---

## Overview

Configure NextAuth.js (Auth.js v5) with Credentials provider for email/password authentication. Set up Drizzle adapter, JWT sessions, and role-based access control.

**Key Decisions:**
- ✅ Email/password only (no OAuth)
- ✅ JWT session strategy (stateless)
- ✅ bcrypt for password hashing (cost factor 12)
- ✅ Role stored in JWT for fast access checks

---

## Dependencies

### NPM Packages

```bash
npm install next-auth@beta @auth/drizzle-adapter bcryptjs
npm install -D @types/bcryptjs
```

**Versions:**
- `next-auth@beta` - Auth.js v5 (latest beta)
- `@auth/drizzle-adapter` - Drizzle adapter for NextAuth
- `bcryptjs` - Password hashing (pure JS, no native deps)

---

## Password Hashing Utility

**File:** `lib/auth/password.ts`

```typescript
import { hash, compare } from 'bcryptjs';

const SALT_ROUNDS = 12; // Computational cost (2^12 = 4096 rounds)

/**
 * Hash a plaintext password using bcrypt
 * @param password - Plaintext password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  return await hash(password, SALT_ROUNDS);
}

/**
 * Verify a plaintext password against a hash
 * @param password - Plaintext password
 * @param hash - Bcrypt hash
 * @returns True if password matches
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await compare(password, hash);
}

/**
 * Validate password strength
 * @param password - Plaintext password
 * @returns Validation result
 */
export function validatePasswordStrength(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 10) {
    errors.push('Password must be at least 10 characters');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  // Optional: Check against common passwords
  const commonPasswords = ['password', '12345678', 'qwerty', 'admin'];
  if (commonPasswords.some((common) => password.toLowerCase().includes(common))) {
    errors.push('Password is too common');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
```

---

## NextAuth Configuration

**File:** `lib/auth/config.ts`

```typescript
import NextAuth, { NextAuthConfig, User, Session } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from '@/db';
import { users, accounts, sessions, verificationTokens } from '@/db/schema-auth';
import { verifyPassword } from '@/lib/auth/password';
import { eq } from 'drizzle-orm';
import { JWT } from 'next-auth/jwt';

// Extend NextAuth types
declare module 'next-auth' {
  interface User {
    id: string;
    email: string;
    name: string | null;
    role: string;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string | null;
      role: string;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;
  }
}

export const authConfig: NextAuthConfig = {
  // Drizzle adapter for database sessions
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),

  // Authentication providers
  providers: [
    CredentialsProvider({
      name: 'Email and Password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },

      async authorize(credentials): Promise<User | null> {
        // Validate credentials exist
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Find user by email
        const user = await db.query.users.findFirst({
          where: eq(users.email, credentials.email as string),
        });

        if (!user || !user.passwordHash) {
          return null;
        }

        // Verify password
        const isValid = await verifyPassword(
          credentials.password as string,
          user.passwordHash
        );

        if (!isValid) {
          return null;
        }

        // Check if email is verified (optional - can require or allow unverified)
        // if (!user.emailVerified) {
        //   throw new Error('Email not verified');
        // }

        // Return user object
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],

  // Session strategy
  session: {
    strategy: 'jwt', // Stateless sessions (faster, no DB lookup)
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  // Callbacks
  callbacks: {
    // Add user id and role to JWT
    async jwt({ token, user, trigger, session }): Promise<JWT> {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }

      // Update session (e.g., when user updates profile)
      if (trigger === 'update' && session) {
        token.name = session.name;
        // Add other updatable fields here
      }

      return token;
    },

    // Add JWT data to session
    async session({ session, token }): Promise<Session> {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },

    // Optional: Control who can sign in
    async signIn({ user, account, profile }) {
      // Allow all sign-ins for now
      // Add custom logic here (e.g., block banned users)
      return true;
    },
  },

  // Custom pages
  pages: {
    signIn: '/auth/signin',
    signUp: '/auth/signup', // Custom, not NextAuth default
    error: '/auth/error',
    verifyRequest: '/auth/verify',
    // newUser: '/auth/welcome', // Optional: redirect after first sign up
  },

  // Events (optional logging)
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      console.log(`User signed in: ${user.email}`);
    },
    async signOut({ session, token }) {
      console.log(`User signed out: ${token?.email || 'unknown'}`);
    },
    async createUser({ user }) {
      console.log(`New user created: ${user.email}`);
    },
  },

  // Debug mode (disable in production)
  debug: process.env.NODE_ENV === 'development',

  // Secret for JWT encryption
  secret: process.env.NEXTAUTH_SECRET,
};

// Export NextAuth handlers
export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
```

---

## API Route Handler

**File:** `app/api/auth/[...nextauth]/route.ts`

```typescript
import { handlers } from '@/lib/auth/config';

export const { GET, POST } = handlers;
```

**Why this works:**
- NextAuth v5 uses App Router API routes
- Catch-all route `[...nextauth]` handles all auth endpoints
- Exports GET and POST from NextAuth handlers

**Endpoints created:**
- `GET /api/auth/session` - Get current session
- `GET /api/auth/csrf` - Get CSRF token
- `GET /api/auth/providers` - List auth providers
- `GET /api/auth/signin` - Sign in page (redirects to custom page)
- `POST /api/auth/signin/credentials` - Credentials sign in
- `POST /api/auth/signout` - Sign out
- `POST /api/auth/callback/credentials` - Credentials callback

---

## Session Helpers

**File:** `lib/auth/session.ts`

```typescript
import { auth } from '@/lib/auth/config';
import { redirect } from 'next/navigation';

/**
 * Get current session (server-side)
 * @returns Session or null
 */
export async function getSession() {
  return await auth();
}

/**
 * Require authentication (redirect to signin if not authenticated)
 * @returns Session (guaranteed to exist)
 */
export async function requireAuth() {
  const session = await auth();
  if (!session) {
    redirect('/auth/signin');
  }
  return session;
}

/**
 * Require admin role (redirect if not admin)
 * @returns Session (guaranteed to be admin)
 */
export async function requireAdmin() {
  const session = await auth();
  if (!session || session.user.role !== 'admin') {
    redirect('/');
  }
  return session;
}

/**
 * Check if user is authenticated
 * @returns Boolean
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await auth();
  return !!session;
}

/**
 * Check if user is admin
 * @returns Boolean
 */
export async function isAdmin(): Promise<boolean> {
  const session = await auth();
  return session?.user.role === 'admin';
}
```

---

## Client-Side Session Provider

**File:** `components/providers/SessionProvider.tsx`

```typescript
'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';

export function SessionProvider({ children }: { children: ReactNode }) {
  return (
    <NextAuthSessionProvider>
      {children}
    </NextAuthSessionProvider>
  );
}
```

**Usage in layout:**

```typescript
// app/layout.tsx
import { SessionProvider } from '@/components/providers/SessionProvider';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
```

---

## Environment Variables

**File:** `.env.local`

```bash
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:30000
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>

# Example secret (DO NOT USE IN PRODUCTION):
# NEXTAUTH_SECRET=your-secret-key-here-change-me-in-production
```

**Generate secret:**

```bash
openssl rand -base64 32
```

Or in Node REPL:

```javascript
require('crypto').randomBytes(32).toString('base64')
```

---

## Implementation Steps

### Step 1: Install Dependencies (10 min)

- [ ] Install next-auth@beta, @auth/drizzle-adapter, bcryptjs
- [ ] Install types: @types/bcryptjs
- [ ] Verify package.json updated

### Step 2: Create Password Utilities (20 min)

- [ ] Create `lib/auth/password.ts`
- [ ] Implement hashPassword function
- [ ] Implement verifyPassword function
- [ ] Implement validatePasswordStrength function
- [ ] Test hashing (manual or unit test)

### Step 3: Configure NextAuth (60 min)

- [ ] Create `lib/auth/config.ts`
- [ ] Set up Drizzle adapter
- [ ] Configure Credentials provider
- [ ] Add JWT callbacks (id, role)
- [ ] Add session callback
- [ ] Configure custom pages
- [ ] Add TypeScript type extensions

### Step 4: Create API Route (5 min)

- [ ] Create `app/api/auth/[...nextauth]/route.ts`
- [ ] Export GET and POST handlers
- [ ] Test endpoints manually (curl or Postman)

### Step 5: Create Session Helpers (20 min)

- [ ] Create `lib/auth/session.ts`
- [ ] Implement getSession
- [ ] Implement requireAuth
- [ ] Implement requireAdmin
- [ ] Implement isAuthenticated
- [ ] Implement isAdmin

### Step 6: Set Up Client Provider (15 min)

- [ ] Create `components/providers/SessionProvider.tsx`
- [ ] Wrap app in SessionProvider (app/layout.tsx)
- [ ] Test session persistence

### Step 7: Configure Environment (10 min)

- [ ] Generate NEXTAUTH_SECRET
- [ ] Add to .env.local
- [ ] Add to .env.example (without value)
- [ ] Document in README

### Step 8: Test Configuration (30 min)

- [ ] Test password hashing
- [ ] Test sign in with test user
- [ ] Test JWT token creation
- [ ] Test session persistence
- [ ] Test role callback
- [ ] Verify session endpoint works

---

## Testing

### Manual Testing

**Test password hashing:**

```typescript
// test-password.ts
import { hashPassword, verifyPassword, validatePasswordStrength } from '@/lib/auth/password';

async function test() {
  const password = 'SecurePassword123';

  // Test hashing
  const hash = await hashPassword(password);
  console.log('Hash:', hash);

  // Test verification
  const isValid = await verifyPassword(password, hash);
  console.log('Valid:', isValid);

  // Test invalid password
  const isInvalid = await verifyPassword('WrongPassword', hash);
  console.log('Invalid:', isInvalid);

  // Test validation
  const validation = validatePasswordStrength('weak');
  console.log('Weak password:', validation);

  const strongValidation = validatePasswordStrength('StrongPassword123');
  console.log('Strong password:', strongValidation);
}

test();
```

**Test sign in:**

```bash
# Sign in API call
curl -X POST http://localhost:30000/api/auth/signin/credentials \
  -H "Content-Type: application/json" \
  -d '{"email":"customer@example.com","password":"customer-dev-password"}'

# Get session
curl http://localhost:30000/api/auth/session
```

**Test in browser:**
1. Go to `http://localhost:30000/api/auth/signin`
2. Should redirect to `/auth/signin` (custom page - doesn't exist yet, will show 404)
3. Manual sign in test in Phase 4.4.3

---

## Acceptance Criteria

- [ ] NextAuth.js installed and configured
- [ ] Password hashing works (bcrypt)
- [ ] Credentials provider authenticates users
- [ ] JWT tokens include user id and role
- [ ] Session persists across page reloads
- [ ] Session helper functions work
- [ ] API routes respond correctly
- [ ] Environment variables configured
- [ ] No TypeScript errors
- [ ] Can sign in as test user programmatically

---

## Security Considerations

### Password Hashing

**bcrypt cost factor 12:**
- 2^12 = 4,096 rounds
- ~250ms per hash (good balance)
- Resistant to brute force attacks

**Why bcrypt over argon2:**
- Pure JavaScript (no native deps)
- Battle-tested
- Sufficient for our use case
- Easier to deploy

### JWT Sessions

**Pros:**
- Stateless (no DB lookup)
- Faster
- Scales horizontally

**Cons:**
- Can't invalidate individual sessions
- Token lives until expiry

**Mitigation:**
- Short expiry (30 days)
- Rotate tokens on updates
- Add revocation list if needed (future)

### CSRF Protection

NextAuth.js includes CSRF protection by default:
- CSRF token on sign in
- Validated on form submission
- HTTP-only cookies

---

## Troubleshooting

**Error: "NEXTAUTH_SECRET is not set"**
```bash
# Generate and set secret
openssl rand -base64 32
# Add to .env.local
```

**Error: "Adapter error"**
```bash
# Verify tables exist
npm run db:studio
# Check users, accounts, sessions, verification_tokens tables
```

**Error: "Invalid credentials"**
```bash
# Check password hash
npm run db:studio
# Verify password_hash column has value
# Test password hashing manually
```

**Session not persisting:**
```bash
# Check cookies in browser DevTools
# Verify NEXTAUTH_URL matches your domain
# Ensure SessionProvider wraps app
```

---

## Next Steps

After Phase 4.4.2 complete:
1. **Phase 4.4.3:** Build sign in/sign up UI components
2. **Phase 4.4.4:** Add protected route middleware
3. **Phase 4.4.5:** Integrate with orders and checkout

---

**See Also:**
- `docs/tasks/Phase 4.4.1 - Database Schema.md` - Previous phase
- `docs/tasks/Phase 4.4.3 - Auth UI Components.md` - Next phase
- `docs/AUTH_STRATEGY.md` - Overall strategy
