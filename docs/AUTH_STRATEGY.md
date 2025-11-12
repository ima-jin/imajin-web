# Authentication Strategy: Traditional Auth → DID Evolution

**Purpose:** Define authentication implementation for imajin-web that works today but evolves to Decentralized Identity (DID) without major rework.

**Status:** Phase 4.4 Planning
**Last Updated:** 2025-11-11

---

## Executive Summary

**The Challenge:** We need authentication NOW for CRM features (customer tracking, order history, cart persistence), but our long-term vision (mjn project) includes Decentralized Identifiers (DIDs) and Self-Sovereign Identity (SSI).

**The Strategy:** Implement traditional auth today with a schema and architecture that can evolve to DID without major rework.

**Key Decision:** Use **NextAuth.js (Auth.js v5)** with a DID-ready database schema.

---

## Background: MJN Project DID Vision

### What is DID (Decentralized Identifier)?

From the mjn project's identity layer research:

**DID Example:** `did:sol:EhRqM8YfHKB3Xm9ZTBqKQqzv4eDxNFkKU2mXqPfFJN4L`

**Core Concepts:**
- **Self-Sovereign Identity (SSI):** Users own their identity, not platforms
- **Verifiable Credentials (VCs):** Cryptographically-signed statements (e.g., "verified human", "EV owner")
- **Blockchain-anchored:** DIDs anchored on Solana for verification
- **Portable:** Works across any platform supporting W3C standards
- **Privacy-first:** Encrypted data vaults, selective disclosure

**Key Components (from mjn IMAJIN_OS_SPEC.md):**
```
Master Seed (BIP39 12-word phrase)
  ↓
Master Key (derived via BIP32)
  ├─ Identity Key (DID signing)
  ├─ Wallet Key (SOL/MJN transactions)
  └─ Encryption Key (data vault)
```

**Recovery Options:**
- Seed phrase backup (12-word BIP39)
- Social recovery (Shamir's Secret Sharing)
- Time-locked recovery (7-day inactivity)
- Hardware wallet integration (Ledger/Trezor)

---

## The Bridge Strategy

### Phase 4.4: Traditional Auth (Today)

**What we need NOW:**
- Email/password authentication
- OAuth providers (Google, GitHub)
- Session management
- Role-based access (customer, admin)
- Password reset flow
- Email verification

**What we're building:**
- PostgreSQL-backed auth
- NextAuth.js (Auth.js v5)
- Self-hosted (no subscriptions)
- Integrated with existing orders table

### Phase 5+ (Future): DID Integration

**What we'll add LATER:**
- DID-based authentication (wallet signing)
- Verifiable credentials
- Solana wallet integration (Phantom, Solflare)
- Hardware wallet support
- NFT-gated access (Founder Edition holders)

**Migration Path:**
1. Add DID field to existing users table (nullable)
2. Add wallet auth provider to NextAuth config
3. Users can link wallet to existing account
4. Eventually: DID becomes primary, email becomes backup
5. No data loss, no account recreation

---

## Technical Architecture

### Database Schema (DID-Ready)

**users table:**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Traditional auth fields (Phase 4.4)
  email TEXT UNIQUE NOT NULL,
  email_verified TIMESTAMP,
  name TEXT,
  image TEXT,
  password_hash TEXT, -- bcrypt, nullable (for OAuth-only users)
  role TEXT NOT NULL DEFAULT 'customer', -- 'customer' | 'admin'

  -- DID fields (Phase 5+ - nullable for now)
  did TEXT UNIQUE, -- W3C DID (e.g., 'did:sol:...')
  public_key TEXT, -- Ed25519 public key for signature verification
  wallet_address TEXT UNIQUE, -- Solana wallet address

  -- Verifiable credentials (Phase 5+ - JSONB for flexibility)
  credentials JSONB DEFAULT '[]'::jsonb,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_did ON users(did) WHERE did IS NOT NULL;
CREATE INDEX idx_users_wallet_address ON users(wallet_address) WHERE wallet_address IS NOT NULL;
```

**accounts table (NextAuth standard):**
```sql
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'oauth' | 'email' | 'credentials' | 'wallet' (future)
  provider TEXT NOT NULL, -- 'google' | 'github' | 'credentials' | 'solana' (future)
  provider_account_id TEXT NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at INTEGER,
  token_type TEXT,
  scope TEXT,
  id_token TEXT,
  session_state TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  UNIQUE(provider, provider_account_id)
);

CREATE INDEX idx_accounts_user_id ON accounts(user_id);
```

**sessions table (NextAuth standard):**
```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  expires TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_session_token ON sessions(session_token);
```

**verification_tokens table (NextAuth standard):**
```sql
CREATE TABLE verification_tokens (
  identifier TEXT NOT NULL, -- email or wallet address
  token TEXT NOT NULL,
  expires TIMESTAMP NOT NULL,

  UNIQUE(identifier, token)
);

CREATE INDEX idx_verification_tokens_identifier ON verification_tokens(identifier);
```

### Why This Schema Works for DID Evolution

**1. DID fields are nullable:**
- Users can be created with traditional auth (email/password)
- DID fields populated later when user links wallet
- No schema migration needed when adding DID support

**2. Accounts table supports multiple providers:**
- Start with 'credentials' (email/password) and 'oauth' (Google, GitHub)
- Add 'wallet' provider later (Phantom, Solflare, Ledger)
- Users can have multiple auth methods simultaneously

**3. Credentials JSONB field:**
- Start empty
- Later stores Verifiable Credentials (VCs) from mjn ecosystem
- Example: `[{"type": "VerifiedHuman", "issuer": "did:sol:...", "proof": "..."}]`

**4. Metadata JSONB field:**
- Extensible for future needs
- Can store recovery info, preferences, trust scores
- No schema changes needed for new features

---

## Auth Provider: NextAuth.js (Auth.js v5)

### Why NextAuth.js?

**✅ Pros:**
- **Self-hosted:** No subscriptions, full control (aligns with philosophy)
- **PostgreSQL adapter:** Works with existing database
- **Drizzle support:** Can use existing ORM
- **Next.js 16 App Router compatible:** Server components, RSC
- **Extensible:** Can add custom providers (wallet auth later)
- **Session management built-in:** Cookies, JWT, database sessions
- **Email verification:** Built-in magic links
- **OAuth ready:** Google, GitHub, etc.
- **DID-compatible:** Can add custom auth strategies

**❌ Cons:**
- Learning curve for Auth.js v5 (new API)
- Need to configure email service (SendGrid, Resend, etc.)

**Alternatives Considered:**
- **Clerk:** ❌ Subscription-based, vendor lock-in
- **Auth0:** ❌ Expensive, proprietary
- **Supabase Auth:** ❌ Tied to Supabase ecosystem
- **Custom auth:** ❌ Too much work, security risks
- **Lucia Auth:** ⚠️ Good, but less mature, smaller community

**Decision:** NextAuth.js best balance of control, flexibility, and DID evolution path.

---

## Implementation Plan

### Phase 4.4.1: Database Schema (2-3 hours)

**Tasks:**
- [ ] Create Drizzle schema for auth tables (users, accounts, sessions, verification_tokens)
- [ ] Generate migration
- [ ] Run migration on dev and test databases
- [ ] Update seed data if needed

**Schema File:** `db/schema-auth.ts`

```typescript
import { pgTable, uuid, text, timestamp, integer, jsonb } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Traditional auth
  email: text('email').unique().notNull(),
  emailVerified: timestamp('email_verified'),
  name: text('name'),
  image: text('image'),
  passwordHash: text('password_hash'),
  role: text('role').notNull().default('customer'), // 'customer' | 'admin'

  // DID fields (nullable for now)
  did: text('did').unique(),
  publicKey: text('public_key'),
  walletAddress: text('wallet_address').unique(),

  // Verifiable credentials (future)
  credentials: jsonb('credentials').$type<VerifiableCredential[]>().default([]),

  // Metadata
  metadata: jsonb('metadata').$type<UserMetadata>().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const accounts = pgTable('accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // 'oauth' | 'email' | 'credentials' | 'wallet'
  provider: text('provider').notNull(), // 'google' | 'github' | 'credentials' | 'solana'
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
});

// ... (sessions, verification_tokens tables)

// Types for future DID integration
export type VerifiableCredential = {
  id: string;
  type: string;
  issuer: string;
  issuanceDate: string;
  expirationDate?: string;
  credentialSubject: Record<string, any>;
  proof: {
    type: string;
    created: string;
    verificationMethod: string;
    proofPurpose: string;
    proofValue: string;
  };
};

export type UserMetadata = {
  recoveryContacts?: string[]; // For social recovery
  preferences?: Record<string, any>;
  trustScore?: number;
};
```

### Phase 4.4.2: NextAuth Configuration (4-5 hours)

**Tasks:**
- [ ] Install NextAuth.js v5 and adapters
- [ ] Configure Drizzle adapter
- [ ] Set up Credentials provider (email/password)
- [ ] Set up OAuth providers (Google, GitHub optional)
- [ ] Configure session strategy (JWT or database)
- [ ] Set up email provider (for magic links/verification)

**Config File:** `lib/auth/config.ts`

```typescript
import NextAuth, { NextAuthConfig } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
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

    // OAuth providers (optional)
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  session: {
    strategy: "jwt", // Or "database" for more control
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
    verifyRequest: "/auth/verify-request",
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
```

### Phase 4.4.3: Auth UI Components (5-6 hours)

**Tasks:**
- [ ] Sign in page (`app/auth/signin/page.tsx`)
- [ ] Sign up page (`app/auth/signup/page.tsx`)
- [ ] Password reset flow
- [ ] Email verification
- [ ] Auth error page
- [ ] User profile page

**Components:**
- `components/auth/SignInForm.tsx`
- `components/auth/SignUpForm.tsx`
- `components/auth/PasswordResetForm.tsx`
- `components/auth/UserNav.tsx` (header dropdown)

### Phase 4.4.4: Protected Routes & Middleware (2-3 hours)

**Tasks:**
- [ ] Create auth middleware for protected routes
- [ ] Wrap admin routes with auth checks
- [ ] Update navigation to show login/logout
- [ ] Add role-based access control

**Middleware:** `middleware.ts`

```typescript
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Protect admin routes
  if (pathname.startsWith('/admin')) {
    if (!req.auth || req.auth.user.role !== 'admin') {
      return NextResponse.redirect(new URL('/auth/signin', req.url));
    }
  }

  // Protect user profile/orders
  if (pathname.startsWith('/account')) {
    if (!req.auth) {
      return NextResponse.redirect(new URL('/auth/signin', req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/admin/:path*', '/account/:path*'],
};
```

### Phase 4.4.5: Integration with Existing Features (4-5 hours)

**Tasks:**
- [ ] Link orders to user accounts (add `user_id` to orders table)
- [ ] Show order history on user profile
- [ ] Save cart to user account
- [ ] Pre-fill checkout with user email/name
- [ ] Display "My Orders" page

**Migration:**
```sql
-- Add user_id to orders table
ALTER TABLE orders ADD COLUMN user_id UUID REFERENCES users(id);

-- Create index
CREATE INDEX idx_orders_user_id ON orders(user_id);

-- Backfill existing orders (match by email)
UPDATE orders o
SET user_id = u.id
FROM users u
WHERE o.customer_email = u.email;
```

### Phase 4.4.6: Testing (3-4 hours)

**Tests:**
- [ ] Auth API tests (sign in, sign up, sign out)
- [ ] Protected route tests
- [ ] Role-based access tests
- [ ] Email verification tests
- [ ] Password reset tests
- [ ] OAuth flow tests (if implemented)

**Test Files:**
- `tests/integration/auth/signin.test.ts`
- `tests/integration/auth/signup.test.ts`
- `tests/integration/auth/protected-routes.test.ts`
- `tests/integration/auth/password-reset.test.ts`

---

## Future: DID Integration (Phase 5+)

### Phase 5.1: Wallet Auth Provider

**Add Solana wallet authentication:**

```typescript
// lib/auth/providers/wallet.ts
import { createWalletProvider } from '@solana/wallet-adapter-nextauth';

export const SolanaWalletProvider = createWalletProvider({
  name: "Solana Wallet",
  type: "wallet",

  async authorize(credentials) {
    const { address, signature, message } = credentials;

    // Verify signature
    const isValid = await verifySignature(address, signature, message);
    if (!isValid) return null;

    // Find or create user with wallet address
    let user = await db.query.users.findFirst({
      where: eq(users.walletAddress, address),
    });

    if (!user) {
      // Create new user with wallet
      user = await db.insert(users).values({
        walletAddress: address,
        did: generateDID(address), // Generate W3C DID
        role: 'customer',
      }).returning();
    }

    return user;
  },
});
```

### Phase 5.2: DID Resolution

**Implement DID verification:**

```typescript
// lib/auth/did.ts
import { DIDResolutionResult, Resolver } from 'did-resolver';
import { getResolver as getSolanaResolver } from 'sol-did-resolver';

const resolver = new Resolver({
  ...getSolanaResolver(),
});

export async function resolveDID(did: string): Promise<DIDResolutionResult> {
  return await resolver.resolve(did);
}

export async function verifyCredential(credential: VerifiableCredential): Promise<boolean> {
  // Verify signature against DID document
  const didDocument = await resolveDID(credential.issuer);
  // ... signature verification logic
}
```

### Phase 5.3: Verifiable Credentials

**Store and verify VCs:**

```typescript
// lib/auth/credentials.ts
export async function addCredential(
  userId: string,
  credential: VerifiableCredential
): Promise<void> {
  // Verify credential signature
  const isValid = await verifyCredential(credential);
  if (!isValid) throw new Error('Invalid credential');

  // Add to user's credentials array
  await db
    .update(users)
    .set({
      credentials: sql`credentials || ${JSON.stringify(credential)}::jsonb`,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));
}

export async function hasCredential(
  userId: string,
  credentialType: string
): Promise<boolean> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user || !user.credentials) return false;

  return user.credentials.some((cred) => cred.type === credentialType);
}
```

### Phase 5.4: NFT-Gated Access

**Founder Edition holders get special access:**

```typescript
// lib/auth/nft-gate.ts
export async function isFounderEditionHolder(walletAddress: string): Promise<boolean> {
  // Query Solana for NFT ownership
  const nfts = await fetchNFTsForWallet(walletAddress);
  return nfts.some((nft) => nft.collection === 'imajin-founder-edition');
}

// In auth callback
async jwt({ token, user }) {
  if (user.walletAddress) {
    token.isFounder = await isFounderEditionHolder(user.walletAddress);
  }
  return token;
}
```

---

## Migration Path: Email Auth → DID Auth

### Step-by-Step User Experience

**Today (Phase 4.4):**
1. User signs up with email/password
2. User shops, checks out, views order history
3. User exists solely in imajin-web database

**Future (Phase 5+):**
1. User goes to account settings
2. Clicks "Link Solana Wallet"
3. Connects Phantom/Solflare wallet
4. Signs message to prove ownership
5. Wallet address and DID saved to user record
6. User can now:
   - Sign in with wallet (no password needed)
   - Access DID-gated features
   - Receive Founder Edition NFT (if applicable)
   - Keep existing order history (same user_id)

**No Breaking Changes:**
- Email auth continues to work
- Users not required to link wallet
- Data persists across migration
- Can have both email AND wallet auth

---

## Security Considerations

### Password Security

**Hashing:** bcrypt with cost factor 12
```typescript
import { hash, compare } from 'bcryptjs';

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return await hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await compare(password, hash);
}
```

**Password Requirements:**
- Minimum 10 characters
- At least 1 uppercase, 1 lowercase, 1 number
- No common passwords (check against list)

### Session Security

**JWT Strategy:**
- Short-lived tokens (1 hour)
- Refresh tokens in HTTP-only cookies
- CSRF protection enabled

**Database Strategy:**
- Session invalidation on logout
- Automatic cleanup of expired sessions
- Can revoke individual sessions

### DID Security (Future)

**Key Management:**
- Private keys never leave user's device
- Hardware wallet support (Ledger, Trezor)
- Social recovery for lost keys
- Seed phrase backup (BIP39)

**Signature Verification:**
- Challenge-response authentication
- Nonce prevents replay attacks
- Timestamp validation (5-minute window)

---

## Email Service Setup

**Options:**
- **Resend:** $20/month for 10K emails, great DX
- **SendGrid:** Free tier (100 emails/day), scalable
- **Postmark:** $15/month for 10K emails, transactional focus
- **AWS SES:** Cheapest ($0.10 per 1K emails), more setup

**Recommendation:** Start with **Resend** (easy setup, good DX) or **SendGrid free tier** (no cost initially).

**Email Templates Needed:**
- Email verification
- Password reset
- Welcome email
- Order confirmation (if not using Stripe emails)

---

## Environment Variables

```bash
# NextAuth
NEXTAUTH_URL=http://localhost:30000
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>

# OAuth Providers (optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# Email Service
EMAIL_SERVER_HOST=smtp.resend.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=resend
EMAIL_SERVER_PASSWORD=<resend api key>
EMAIL_FROM=noreply@imajin.ca

# Future: Solana (Phase 5+)
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
SOLANA_CLUSTER=mainnet-beta
```

---

## Testing Strategy

### Unit Tests

**Test coverage:**
- Password hashing/verification
- DID generation/validation (future)
- JWT encoding/decoding
- Session management

### Integration Tests

**Test flows:**
- Sign up with email/password
- Sign in with email/password
- Sign out
- Password reset
- Email verification
- Protected route access
- Role-based access control

### E2E Tests (Playwright)

**User flows:**
- New user signs up and checks out
- Returning user signs in and views orders
- Admin signs in and accesses admin panel
- User resets forgotten password

---

## Documentation Checklist

- [ ] Update README.md with auth setup instructions
- [ ] Create AUTH.md user guide (how to sign in, reset password, etc.)
- [ ] Document API endpoints (`/api/auth/*`)
- [ ] Add auth examples to developer docs
- [ ] Update IMPLEMENTATION_PLAN.md with Phase 4.4 completion

---

## Open Questions

1. **Email service preference?**
   - Resend (easy, $20/month)?
   - SendGrid (free tier)?
   - AWS SES (cheapest)?

2. **OAuth providers needed?**
   - Google?
   - GitHub?
   - Start with just email/password?

3. **Guest checkout behavior?**
   - Allow checkout without account?
   - Prompt to create account after checkout?
   - Require account before checkout?

4. **Admin user creation?**
   - Manual SQL insert?
   - Seed script?
   - Admin invite system?

5. **Password reset flow?**
   - Email link (NextAuth default)?
   - Security questions?
   - Both?

---

## Success Criteria

**Phase 4.4 Complete When:**
- [ ] Users can sign up with email/password
- [ ] Users can sign in and sign out
- [ ] Users can reset forgotten passwords
- [ ] Email verification works
- [ ] Users can view order history
- [ ] Cart persists across sessions
- [ ] Admin routes protected by role check
- [ ] All auth tests passing
- [ ] Documentation complete

**Future DID Integration Ready When:**
- [ ] Schema supports DID fields
- [ ] Accounts table supports wallet provider
- [ ] No breaking changes required for DID migration
- [ ] Users can link wallet to existing account
- [ ] Verifiable credentials can be stored

---

## Timeline Estimate

**Phase 4.4 (Traditional Auth):** 20-30 hours
- Database schema: 2-3 hours
- NextAuth config: 4-5 hours
- UI components: 5-6 hours
- Protected routes: 2-3 hours
- Integration: 4-5 hours
- Testing: 3-4 hours
- Documentation: 2-3 hours

**Phase 5+ (DID Integration):** 40-60 hours (later)
- Wallet auth provider: 8-10 hours
- DID resolution: 6-8 hours
- VC storage/verification: 8-10 hours
- NFT gating: 4-6 hours
- Social recovery: 8-10 hours
- Migration tooling: 6-8 hours
- Testing: 8-10 hours

---

## Conclusion

This strategy provides **immediate value** (auth for CRM features) while **preserving the path** to Self-Sovereign Identity via DIDs.

**Key Principles:**
1. **Schema is DID-ready** (nullable DID fields, JSONB for VCs)
2. **Provider architecture is extensible** (can add wallet auth later)
3. **No breaking changes** when migrating to DID
4. **Self-hosted and open** (aligns with philosophy)
5. **Progressive enhancement** (email today, wallet tomorrow)

**Next Steps:**
1. Answer open questions (email service, OAuth, guest checkout)
2. Review and approve this strategy
3. Begin Phase 4.4 implementation
4. Test thoroughly
5. Document for users and developers

---

**See Also:**
- `D:\Projects\imajin\imajin-ai\mjn\layer-2-identity\IDENTITY_LAYER.md` - DID/VC architecture
- `D:\Projects\imajin\imajin-ai\mjn\layer-2-identity\IMAJIN_OS_SPEC.md` - Personal AI agent spec
- `D:\Projects\imajin\imajin-ai\mjn\architecture\SECURITY.md` - Key management and recovery
- `D:\Projects\imajin\imajin-ai\mjn\architecture\DATA_STORAGE_AND_TRUST.md` - Trust model
