# Phase 4.4.1: Database Schema

**Status:** Ready for Implementation 🟡
**Estimated Effort:** 3 hours
**Dependencies:** Phase 2 complete (orders table exists)
**Next Phase:** Phase 4.4.2 (NextAuth Configuration)

---

## Overview

Create authentication database schema with NextAuth.js standard tables (users, accounts, sessions, verification_tokens) plus DID-ready fields for future wallet authentication.

**Key Design Principle:** Schema must support traditional email/password auth TODAY while enabling DID/wallet auth TOMORROW without breaking changes.

---

## Database Tables

### users Table

**Primary authentication identity table**

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Email/password authentication (Phase 4.4)
  email TEXT UNIQUE NOT NULL,
  email_verified TIMESTAMP,
  name TEXT,
  image TEXT,
  password_hash TEXT,  -- bcrypt, nullable for OAuth users (future)
  role TEXT NOT NULL DEFAULT 'customer',  -- 'customer' | 'admin'

  -- DID/wallet authentication (Phase 5+ - nullable for now)
  did TEXT UNIQUE,  -- W3C DID (e.g., 'did:sol:...')
  public_key TEXT,  -- Ed25519 public key for signature verification
  wallet_address TEXT UNIQUE,  -- Solana wallet address

  -- Verifiable credentials (Phase 5+ - JSONB for flexibility)
  credentials JSONB DEFAULT '[]'::jsonb,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_did ON users(did) WHERE did IS NOT NULL;
CREATE INDEX idx_users_wallet_address ON users(wallet_address) WHERE wallet_address IS NOT NULL;
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

**Why This Design:**
- `did`, `public_key`, `wallet_address` are nullable → Users can exist without them
- `credentials` JSONB → Store Verifiable Credentials when DID auth is added
- `metadata` JSONB → Extensible for recovery contacts, preferences, trust scores
- No breaking changes needed when adding wallet auth

---

### accounts Table

**OAuth/provider accounts (NextAuth standard)**

```sql
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  type TEXT NOT NULL,  -- 'oauth' | 'email' | 'credentials' | 'wallet' (future)
  provider TEXT NOT NULL,  -- 'google' | 'github' | 'credentials' | 'solana' (future)
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
CREATE INDEX idx_accounts_provider ON accounts(provider);

CREATE TRIGGER accounts_updated_at
BEFORE UPDATE ON accounts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

**Why This Design:**
- Supports multiple auth providers per user
- Can add 'wallet' provider later without schema changes
- Standard NextAuth.js structure

---

### sessions Table

**Active user sessions (NextAuth standard)**

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
CREATE INDEX idx_sessions_expires ON sessions(expires);
```

**Why This Design:**
- Simple session tracking
- Automatic cleanup via expires index
- Can invalidate all sessions for a user

---

### verification_tokens Table

**Email verification & password reset tokens (NextAuth standard)**

```sql
CREATE TABLE verification_tokens (
  identifier TEXT NOT NULL,  -- email or phone
  token TEXT NOT NULL,
  expires TIMESTAMP NOT NULL,

  UNIQUE(identifier, token)
);

CREATE INDEX idx_verification_tokens_identifier ON verification_tokens(identifier);
CREATE INDEX idx_verification_tokens_token ON verification_tokens(token);
CREATE INDEX idx_verification_tokens_expires ON verification_tokens(expires);
```

**Why This Design:**
- Supports email verification
- Supports password reset
- Can add phone/SMS verification later
- Auto-cleanup via expires index

---

### orders Table Update

**Link orders to users**

```sql
-- Add user_id column to orders table
ALTER TABLE orders ADD COLUMN user_id UUID REFERENCES users(id);

-- Create index for performance
CREATE INDEX idx_orders_user_id ON orders(user_id);

-- Backfill existing orders (match by email)
UPDATE orders o
SET user_id = u.id
FROM users u
WHERE o.customer_email = u.email;
```

**Why This Design:**
- Nullable user_id → Guest checkout supported (future)
- Can link existing orders to new accounts by email
- Order history works immediately after signup

---

## Drizzle Schema

**File:** `db/schema-auth.ts`

```typescript
import { pgTable, uuid, text, timestamp, integer, jsonb, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Email/password auth
  email: text('email').unique().notNull(),
  emailVerified: timestamp('email_verified'),
  name: text('name'),
  image: text('image'),
  passwordHash: text('password_hash'),
  role: text('role').notNull().default('customer'), // 'customer' | 'admin'

  // DID/wallet auth (future - nullable)
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

// Accounts table
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
}, (table) => ({
  providerUnique: unique().on(table.provider, table.providerAccountId),
}));

// Sessions table
export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  sessionToken: text('session_token').unique().notNull(),
  expires: timestamp('expires').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Verification tokens table
export const verificationTokens = pgTable('verification_tokens', {
  identifier: text('identifier').notNull(), // email or phone
  token: text('token').notNull(),
  expires: timestamp('expires').notNull(),
}, (table) => ({
  identifierTokenUnique: unique().on(table.identifier, table.token),
}));

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  orders: many(orders), // From existing orders schema
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

// TypeScript types for future DID integration
export type VerifiableCredential = {
  id: string;
  type: string; // 'VerifiedHuman' | 'EVOwner' | 'Artist' | etc.
  issuer: string; // DID of issuer
  issuanceDate: string;
  expirationDate?: string;
  credentialSubject: Record<string, any>;
  proof: {
    type: string;
    created: string;
    verificationMethod: string;
    proofPurpose: string;
    proofValue: string; // Cryptographic signature
  };
};

export type UserMetadata = {
  // Social recovery (Phase 5+)
  recoveryContacts?: string[]; // DIDs of trusted contacts

  // Preferences
  preferences?: {
    emailNotifications?: boolean;
    marketingEmails?: boolean;
    language?: string;
  };

  // Trust & reputation (Phase 5+)
  trustScore?: number;
  attestations?: Array<{
    from: string; // DID
    claim: string;
    stake: string; // MJN amount
    timestamp: string;
  }>;

  // Extensible for future features
  [key: string]: any;
};
```

---

## Migration Script

**File:** `db/migrations/0008_add_auth_tables.sql`

```sql
-- Phase 4.4.1: Authentication Schema
-- Generated: 2025-11-11

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  email_verified TIMESTAMP,
  name TEXT,
  image TEXT,
  password_hash TEXT,
  role TEXT NOT NULL DEFAULT 'customer',
  did TEXT UNIQUE,
  public_key TEXT,
  wallet_address TEXT UNIQUE,
  credentials JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_did ON users(did) WHERE did IS NOT NULL;
CREATE INDEX idx_users_wallet_address ON users(wallet_address) WHERE wallet_address IS NOT NULL;
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Accounts table
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  provider TEXT NOT NULL,
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
CREATE INDEX idx_accounts_provider ON accounts(provider);

-- Sessions table
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  expires TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_session_token ON sessions(session_token);
CREATE INDEX idx_sessions_expires ON sessions(expires);

-- Verification tokens table
CREATE TABLE verification_tokens (
  identifier TEXT NOT NULL,
  token TEXT NOT NULL,
  expires TIMESTAMP NOT NULL,
  UNIQUE(identifier, token)
);

CREATE INDEX idx_verification_tokens_identifier ON verification_tokens(identifier);
CREATE INDEX idx_verification_tokens_token ON verification_tokens(token);
CREATE INDEX idx_verification_tokens_expires ON verification_tokens(expires);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER accounts_updated_at
BEFORE UPDATE ON accounts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Add user_id to orders table
ALTER TABLE orders ADD COLUMN user_id UUID REFERENCES users(id);
CREATE INDEX idx_orders_user_id ON orders(user_id);

-- Backfill existing orders (run manually after user creation)
-- UPDATE orders o SET user_id = u.id FROM users u WHERE o.customer_email = u.email;
```

---

## Seed Data

**File:** `db/seed-auth.ts`

```typescript
import { db } from '@/db';
import { users } from '@/db/schema-auth';
import { hashPassword } from '@/lib/auth/password';

export async function seedAuthUsers() {
  console.log('Seeding auth users...');

  // Admin user
  await db.insert(users).values({
    email: 'admin@imajin.ca',
    passwordHash: await hashPassword('admin-dev-password-change-me'),
    role: 'admin',
    name: 'Admin User',
    emailVerified: new Date(),
  }).onConflictDoNothing();

  // Test customer user
  await db.insert(users).values({
    email: 'customer@example.com',
    passwordHash: await hashPassword('customer-dev-password'),
    role: 'customer',
    name: 'Test Customer',
    emailVerified: new Date(),
  }).onConflictDoNothing();

  // Test unverified user
  await db.insert(users).values({
    email: 'unverified@example.com',
    passwordHash: await hashPassword('unverified-password'),
    role: 'customer',
    name: 'Unverified User',
    emailVerified: null, // Not verified yet
  }).onConflictDoNothing();

  console.log('Auth users seeded successfully');
}
```

**Add to main seed script:**

```typescript
// db/seed.ts
import { seedAuthUsers } from './seed-auth';

async function main() {
  // ... existing seeds

  // Seed auth users
  await seedAuthUsers();
}
```

---

## Implementation Steps

### Step 1: Create Drizzle Schema (30 min)

- [ ] Create `db/schema-auth.ts` with all tables
- [ ] Define TypeScript types (VerifiableCredential, UserMetadata)
- [ ] Add relations to existing orders schema
- [ ] Export all tables and types

### Step 2: Generate Migration (15 min)

- [ ] Run `npx drizzle-kit generate:pg`
- [ ] Review generated SQL
- [ ] Manually adjust if needed (add comments, ensure indexes)
- [ ] Save as `db/migrations/0008_add_auth_tables.sql`

### Step 3: Run Migration (15 min)

- [ ] Run migration on dev database: `npx drizzle-kit push:pg`
- [ ] Verify tables created in Drizzle Studio
- [ ] Run migration on test database: `NODE_ENV=test npx drizzle-kit push:pg`
- [ ] Verify test database tables

### Step 4: Create Seed Script (30 min)

- [ ] Create `db/seed-auth.ts`
- [ ] Add admin user seed
- [ ] Add test customer user seed
- [ ] Integrate with main seed script
- [ ] Run seed: `npm run db:seed`

### Step 5: Update orders Table (15 min)

- [ ] Add user_id column migration
- [ ] Create index
- [ ] Test foreign key constraint
- [ ] Document backfill process (manual after user creation)

### Step 6: Update Schema Exports (15 min)

- [ ] Update `db/schema.ts` to export auth tables
- [ ] Update `db/index.ts` if needed
- [ ] Verify imports work in test files

### Step 7: Validation (30 min)

- [ ] Start Drizzle Studio: `npm run db:studio`
- [ ] Verify all tables exist
- [ ] Verify indexes exist
- [ ] Verify seed users exist
- [ ] Verify foreign key relationships
- [ ] Test updated_at trigger

---

## Acceptance Criteria

- [ ] All 4 auth tables created (users, accounts, sessions, verification_tokens)
- [ ] All indexes created and performant
- [ ] orders.user_id column added
- [ ] Updated_at triggers working
- [ ] Seed users created successfully
- [ ] Drizzle Studio shows all tables
- [ ] No TypeScript errors
- [ ] Schema matches NextAuth.js adapter requirements
- [ ] DID fields are nullable (no breaking changes)
- [ ] Migration runs cleanly on dev and test databases

---

## Testing

**Manual Testing:**

```bash
# Start Drizzle Studio
npm run db:studio

# Verify tables exist:
# - users (11 columns)
# - accounts (13 columns)
# - sessions (4 columns)
# - verification_tokens (3 columns)

# Verify indexes:
# - idx_users_email
# - idx_users_did
# - idx_users_wallet_address
# - idx_users_role
# - idx_accounts_user_id
# - idx_sessions_user_id
# - idx_sessions_session_token
# - idx_orders_user_id

# Verify seed users:
# - admin@imajin.ca (role: admin)
# - customer@example.com (role: customer)
# - unverified@example.com (role: customer, email_verified: null)
```

**SQL Testing:**

```sql
-- Verify schema
\d users
\d accounts
\d sessions
\d verification_tokens

-- Test updated_at trigger
UPDATE users SET name = 'Test Update' WHERE email = 'customer@example.com';
SELECT name, updated_at FROM users WHERE email = 'customer@example.com';
-- updated_at should be recent

-- Test foreign key cascade
DELETE FROM users WHERE email = 'customer@example.com';
-- Should cascade delete accounts and sessions

-- Restore test user
-- (re-run seed script)
```

---

## Environment Variables

**None required for this phase** - Database connection already configured.

---

## Rollback Plan

If migration fails or needs to be reverted:

```sql
-- Drop all auth tables (cascades to orders.user_id)
DROP TABLE IF EXISTS verification_tokens CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS accounts CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop orders.user_id column
ALTER TABLE orders DROP COLUMN IF EXISTS user_id;

-- Drop trigger function
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
```

---

## Next Steps

After Phase 4.4.1 complete:
1. **Phase 4.4.2:** Configure NextAuth.js with Drizzle adapter
2. **Phase 4.4.3:** Build auth UI components
3. **Phase 4.4.4:** Implement protected routes

---

**See Also:**
- `docs/AUTH_STRATEGY.md` - Overall auth strategy
- `docs/tasks/Phase 4.4 - Authentication.md` - Parent task
- `D:\Projects\imajin\imajin-ai\mjn\layer-2-identity\IDENTITY_LAYER.md` - DID architecture
