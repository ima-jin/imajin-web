# Phase 4.4.1: Database Schema

**Status:** Ready for Implementation 🟡
**Estimated Effort:** 2 hours
**Dependencies:** Phase 2 complete (orders table exists)
**Next Phase:** Phase 4.4.2 (Ory Kratos Setup)

---

## Overview

Create simplified authentication database schema with local users table that shadows Ory Kratos identities, plus organizational collectives for marketplace/decentralization features. Ory Kratos manages credentials, sessions, and verification tokens in its own database. Our local database stores user metadata, app-specific fields, and collective structures.

**Key Design Principles:**
1. **Local Shadow Pattern:** users table mirrors Ory identities with app-specific extensions
2. **Collective Attribution:** Products/portfolio items attributed to collectives (not individual users)
3. **Future-Ready:** Support email/password auth TODAY, wallet/DID auth TOMORROW, decentralized marketplace LATER
4. **Non-Breaking Evolution:** All future features added without breaking existing data

---

## Architecture: Local Shadow Pattern

```
Ory Kratos Identity (external database)
    ↓ (webhook sync: identity.created, identity.updated)
users.kratos_id (local shadow)
    ↓ (FK constraints)
    ├─→ orders.user_id (individual ownership)
    ├─→ nft_tokens.user_id (individual ownership)
    ├─→ user_collectives.created_by_user_id (collective founder)
    └─→ user_collective_memberships.user_id (many-to-many)

user_collectives (organizational entities)
    ↓ (FK constraints)
    ├─→ products.created_by_collective_id (creator attribution, NON-NULL)
    ├─→ portfolio_items.created_by_collective_id (creator attribution, NON-NULL)
    └─→ user_collective_memberships.collective_id (many-to-many)
```

**Why Shadow Pattern:**
1. ✅ PostgreSQL foreign keys work (orders → users, products → collectives)
2. ✅ Query performance (no Ory API calls)
3. ✅ App-specific fields (metadata, preferences)
4. ✅ Database integrity maintained
5. ✅ Offline queries possible

**Why Collectives:**
1. ✅ Marketplace-ready (users organize into teams/brands)
2. ✅ Decentralization-ready (collectives have DIDs/wallets)
3. ✅ Attribution tracking (products/portfolio items attributed to collective)
4. ✅ Future-proof (supports community content creation)

**What Ory Manages (NOT in local DB):**
- ❌ Passwords (hashed securely in Ory)
- ❌ Sessions (Ory session cookies)
- ❌ Verification tokens (Ory manages)
- ❌ MFA credentials (TOTP secrets in Ory)

---

## Database Tables

### users Table

**Local shadow of Ory identities + app-specific fields**

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kratos_id UUID UNIQUE NOT NULL,  -- Links to Ory Kratos identity

  -- Denormalized from Ory (for query performance)
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'customer',  -- 'customer' | 'admin'

  -- DID/wallet authentication (Phase 5+ - nullable for now)
  did TEXT UNIQUE,  -- W3C DID (e.g., 'did:sol:...')
  public_key TEXT,  -- Ed25519 public key for signature verification
  wallet_address TEXT UNIQUE,  -- Solana wallet address

  -- Hub federation (Phase 5+)
  home_hub_id UUID REFERENCES trust_hubs(id),  -- User's primary hub (nullable = local hub)
  is_cached BOOLEAN DEFAULT false,             -- Is this a cached user from another hub?
  cached_from_hub_id UUID REFERENCES trust_hubs(id),  -- If cached, source hub
  known_on_hubs JSONB DEFAULT '[]'::jsonb,     -- Array of hub_ids where user data is cached
  last_synced_at TIMESTAMP,                    -- When was this user last synced?

  -- App-specific metadata (NOT in Ory)
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_kratos_id ON users(kratos_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_home_hub ON users(home_hub_id);
CREATE INDEX idx_users_cached ON users(is_cached) WHERE is_cached = true;
CREATE INDEX idx_users_wallet_address ON users(wallet_address) WHERE wallet_address IS NOT NULL;
CREATE INDEX idx_users_did ON users(did) WHERE did IS NOT NULL;
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
- `kratos_id` → Links to Ory Kratos identity (external)
- `email`, `name`, `role` → Denormalized from Ory for performance
- `did`, `public_key`, `wallet_address` → Nullable, ready for Phase 5 wallet auth
- `metadata` → App-specific fields (preferences, notes, etc.)
- No `password_hash` → Ory stores securely
- No `email_verified` → Check via Ory API if needed
- No `image` → Can add to metadata if needed

**Sync Strategy:**
- Ory sends webhook on `identity.created` → Create local user
- Ory sends webhook on `identity.updated` → Update local user
- Fallback: Create user on-demand in session helper if webhook missed

---

### trust_hubs Table

⚠️ **Note:** Trust hub federation is **Phase 5+ architecture**. Phase 4.4.1 core requirements can be completed with just `users`, `user_collectives`, and `user_collective_memberships` tables. The trust hub tables are included here for architectural completeness but are not required for initial authentication implementation.

**Federated hosting nodes that host multiple collectives**

```sql
CREATE TABLE trust_hubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  domain TEXT UNIQUE NOT NULL,  -- e.g., 'imajin.ca', 'community.example.com'

  -- DID/wallet for hub identity
  did TEXT UNIQUE,
  wallet_address TEXT UNIQUE,
  public_key TEXT NOT NULL,  -- Hub's public key for signature verification

  -- Hub status
  is_local BOOLEAN NOT NULL DEFAULT false,  -- Is this the current hub we're running on?
  is_active BOOLEAN NOT NULL DEFAULT true,
  trust_level INTEGER DEFAULT 0,  -- 0=self, 1=verified, 2=federated, 3=cached-only

  -- Federation metadata
  api_endpoint TEXT,  -- Hub's API URL for federation
  federation_protocol TEXT DEFAULT 'activitypub',  -- 'activitypub', 'did-comm', 'ipfs'
  metadata JSONB DEFAULT '{}'::jsonb,  -- Federation policies, rate limits, content policies

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_trust_hubs_slug ON trust_hubs(slug);
CREATE INDEX idx_trust_hubs_domain ON trust_hubs(domain);
CREATE INDEX idx_trust_hubs_local ON trust_hubs(is_local) WHERE is_local = true;
CREATE INDEX idx_trust_hubs_active ON trust_hubs(is_active);
CREATE INDEX idx_trust_hubs_trust_level ON trust_hubs(trust_level);

-- Trigger for updated_at
CREATE TRIGGER trust_hubs_updated_at
BEFORE UPDATE ON trust_hubs
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

**Trust Levels:**
- `0` (self) - This hub (imajin.ca)
- `1` (verified) - Verified partner hubs (strong trust)
- `2` (federated) - Federated hubs (moderate trust, content synced)
- `3` (cached-only) - Cached data from unknown hubs (low trust, display only)

**Use Cases:**
- **Today:** Single hub (imajin.ca) with trust_level=0, is_local=true
- **Phase 5+:** Every user device is a hub (personal, family, or community)
- **Future:** Fully peer-to-peer, units federate directly with each other

**Hub Scale Examples:**
- **Personal hub** - 1 user, runs on their Imajin unit or laptop
- **Family hub** - Household members, runs on home unit
- **Community hub** - Artist collective, small business, runs on dedicated unit
- **Organization hub** - Large collective, runs on cloud server or multiple units
- **Official hub** - imajin.ca, discovery/catalog, runs on cloud infrastructure

**Key Insight:** There's no technical difference between a "user" and a "hub operator". Every user CAN operate a hub. Some just choose to join existing hubs for convenience.

---

### trust_hub_federation Table

**Hub-to-hub trust relationships (which hubs federate with each other)**

```sql
CREATE TABLE trust_hub_federation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_hub_id UUID NOT NULL REFERENCES trust_hubs(id) ON DELETE CASCADE,
  to_hub_id UUID NOT NULL REFERENCES trust_hubs(id) ON DELETE CASCADE,

  trust_level INTEGER NOT NULL DEFAULT 2,  -- 1=verified, 2=federated, 3=cached-only
  is_bidirectional BOOLEAN DEFAULT false,  -- Does other hub trust us back?

  -- Federation settings
  sync_collectives BOOLEAN DEFAULT true,
  sync_products BOOLEAN DEFAULT true,
  sync_portfolio BOOLEAN DEFAULT true,
  sync_users BOOLEAN DEFAULT false,  -- Usually false for privacy

  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  UNIQUE(from_hub_id, to_hub_id)
);

CREATE INDEX idx_federation_from_hub ON trust_hub_federation(from_hub_id);
CREATE INDEX idx_federation_to_hub ON trust_hub_federation(to_hub_id);
CREATE INDEX idx_federation_trust_level ON trust_hub_federation(trust_level);
```

**Why This Design:**
- Explicit trust relationships (not automatic federation)
- Per-hub sync settings (what data to share)
- Bidirectional tracking (mutual trust vs one-way)
- Migration support (collective can leave hub, keep history)

---

### user_collectives Table

**Organizational entities that create and sell products/portfolio items**

```sql
CREATE TABLE user_collectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,

  -- DID/wallet for future decentralization (Phase 5+)
  did TEXT UNIQUE,
  wallet_address TEXT UNIQUE,
  public_key TEXT,

  -- Hub federation (Phase 5+)
  hosted_on_hub_id UUID REFERENCES trust_hubs(id),  -- Current hosting hub (nullable = local hub)
  origin_hub_id UUID REFERENCES trust_hubs(id),     -- Hub where collective was created
  is_cached BOOLEAN DEFAULT false,                  -- Is this a cached copy from another hub?
  cached_from_hub_id UUID REFERENCES trust_hubs(id), -- If cached, which hub is source of truth?
  last_synced_at TIMESTAMP,                         -- When was this collective last synced?

  -- Migration history (track hub migrations)
  migration_history JSONB DEFAULT '[]'::jsonb,  -- Array of { from_hub, to_hub, timestamp }

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Founder/creator
  created_by_user_id UUID NOT NULL REFERENCES users(id),

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_collectives_slug ON user_collectives(slug);
CREATE INDEX idx_user_collectives_creator ON user_collectives(created_by_user_id);
CREATE INDEX idx_user_collectives_hosted_on ON user_collectives(hosted_on_hub_id);
CREATE INDEX idx_user_collectives_origin ON user_collectives(origin_hub_id);
CREATE INDEX idx_user_collectives_cached ON user_collectives(is_cached) WHERE is_cached = true;
CREATE INDEX idx_user_collectives_wallet ON user_collectives(wallet_address) WHERE wallet_address IS NOT NULL;
CREATE INDEX idx_user_collectives_did ON user_collectives(did) WHERE did IS NOT NULL;

-- Trigger for updated_at
CREATE TRIGGER user_collectives_updated_at
BEFORE UPDATE ON user_collectives
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

**Why This Design:**
- `name`, `slug` → Human-readable identifiers
- `did`, `wallet_address`, `public_key` → Ready for Phase 5 decentralized marketplace
- `created_by_user_id` → Tracks who founded the collective
- `metadata` → Extensible for collective-specific fields (bio, social links, etc.)

**Use Cases:**
- **Today:** Imajin collective creates official products
- **Future:** Community members create collectives, design/sell products, build reputation
- **Decentralization:** Collective data can be portable (IPFS, blockchain, user's device)

---

### user_collective_memberships Table

**Many-to-many relationship between users and collectives**

```sql
CREATE TABLE user_collective_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  collective_id UUID NOT NULL REFERENCES user_collectives(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',  -- 'owner', 'admin', 'member'

  joined_at TIMESTAMP NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, collective_id)
);

CREATE INDEX idx_memberships_user ON user_collective_memberships(user_id);
CREATE INDEX idx_memberships_collective ON user_collective_memberships(collective_id);
CREATE INDEX idx_memberships_role ON user_collective_memberships(role);
```

**Why This Design:**
- Many-to-many → Users can belong to multiple collectives
- `role` → Permission levels within collective
- `UNIQUE(user_id, collective_id)` → User can't join same collective twice
- Cascade delete → Membership removed when user or collective deleted

**Roles:**
- `owner` → Created the collective, full control
- `admin` → Can manage members, edit collective info
- `member` → Can contribute content, view collective data

---

### orders Table Update

**Link orders to local user IDs (not Ory IDs)**

```sql
-- Add user_id column to orders table
ALTER TABLE orders ADD COLUMN user_id UUID REFERENCES users(id);

-- Create index for performance
CREATE INDEX idx_orders_user_id ON orders(user_id);

-- Backfill existing orders (match by email)
UPDATE orders o
SET user_id = u.id
FROM users u
WHERE o.customer_email = u.email
  AND o.user_id IS NULL;
```

**Why This Design:**
- Nullable `user_id` → Guest checkout supported (future)
- Links to local `users.id` (not `kratos_id`) → Foreign key works
- Can link existing orders to new accounts by email
- Order history works immediately after signup

---

### products Table Update

**Add creator attribution for marketplace features**

```sql
-- Add created_by_collective_id column to products table
ALTER TABLE products ADD COLUMN created_by_collective_id UUID NOT NULL REFERENCES user_collectives(id);

-- Create index for performance
CREATE INDEX idx_products_collective ON products(created_by_collective_id);
```

**Why This Design:**
- NON-NULLABLE → Every product must be attributed to a collective
- Links to `user_collectives.id` → Tracks which collective created the product
- Enables marketplace features → Community can create and sell products
- Portable attribution → Can be verified via DID in decentralized future

**Backfill Strategy:**
- Seed script creates "Imajin" collective first
- All existing products backfilled to Imajin collective
- Future products can be attributed to user-created collectives

---

### portfolio_items Table Update

**Add creator attribution for installations/case studies**

```sql
-- Add created_by_collective_id column to portfolio_items table
ALTER TABLE portfolio_items ADD COLUMN created_by_collective_id UUID NOT NULL REFERENCES user_collectives(id);

-- Create index for performance
CREATE INDEX idx_portfolio_items_collective ON portfolio_items(created_by_collective_id);
```

**Why This Design:**
- NON-NULLABLE → Every portfolio item must be attributed to a collective
- Links to `user_collectives.id` → Tracks which collective did the work
- Enables community showcases → Users can display their installations
- Reputation building → Collectives build portfolio of work

**Backfill Strategy:**
- All existing portfolio items backfilled to Imajin collective
- Future items can be attributed to user-created collectives

---

### nft_tokens Table Update

**Add individual user ownership tracking**

```sql
-- Add user_id column to nft_tokens table
ALTER TABLE nft_tokens ADD COLUMN user_id UUID REFERENCES users(id);

-- Create index for performance
CREATE INDEX idx_nft_tokens_user ON nft_tokens(user_id);

-- Backfill existing NFT tokens (match by order)
UPDATE nft_tokens nt
SET user_id = o.user_id
FROM orders o
WHERE nt.order_id = o.id
  AND nt.user_id IS NULL;
```

**Why This Design:**
- Nullable `user_id` → Can be NULL initially, populated after order links to user
- Direct ownership tracking → Don't need to join through orders
- Supports future wallet transfers → Update user_id when NFT changes hands
- Query performance → Easy lookup of "all NFTs owned by user X"

---

## Drizzle Schema

**File:** `db/schema-auth.ts`

```typescript
import { pgTable, uuid, text, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table (shadow of Ory Kratos identities)
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  kratosId: uuid('kratos_id').notNull().unique(),

  // Denormalized from Ory (for query performance)
  email: text('email').unique().notNull(),
  name: text('name'),
  role: text('role').notNull().default('customer'), // 'customer' | 'admin'

  // DID/wallet auth (Phase 5+ - nullable)
  did: text('did').unique(),
  publicKey: text('public_key'),
  walletAddress: text('wallet_address').unique(),

  // App-specific metadata
  metadata: jsonb('metadata').$type<UserMetadata>().default({}),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// User collectives table
export const userCollectives = pgTable('user_collectives', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').unique().notNull(),
  description: text('description'),

  // DID/wallet for future decentralization (Phase 5+)
  did: text('did').unique(),
  walletAddress: text('wallet_address').unique(),
  publicKey: text('public_key'),

  // Metadata
  metadata: jsonb('metadata').$type<CollectiveMetadata>().default({}),

  // Founder/creator
  createdByUserId: uuid('created_by_user_id').notNull().references(() => users.id),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// User collective memberships junction table
export const userCollectiveMemberships = pgTable('user_collective_memberships', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  collectiveId: uuid('collective_id').notNull().references(() => userCollectives.id, { onDelete: 'cascade' }),
  role: text('role').notNull().default('member'), // 'owner' | 'admin' | 'member'

  joinedAt: timestamp('joined_at').notNull().defaultNow(),
}, (table) => ({
  uniqueMembership: unique().on(table.userId, table.collectiveId),
}));

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders), // From existing orders schema
  nftTokens: many(nftTokens), // From existing nft_tokens schema
  createdCollectives: many(userCollectives), // Collectives founded by this user
  collectiveMemberships: many(userCollectiveMemberships), // Collectives user belongs to
}));

export const userCollectivesRelations = relations(userCollectives, ({ one, many }) => ({
  creator: one(users, {
    fields: [userCollectives.createdByUserId],
    references: [users.id],
  }),
  memberships: many(userCollectiveMemberships),
  products: many(products), // From existing products schema
  portfolioItems: many(portfolioItems), // From existing portfolio_items schema
}));

export const userCollectiveMembershipsRelations = relations(userCollectiveMemberships, ({ one }) => ({
  user: one(users, {
    fields: [userCollectiveMemberships.userId],
    references: [users.id],
  }),
  collective: one(userCollectives, {
    fields: [userCollectiveMemberships.collectiveId],
    references: [userCollectives.id],
  }),
}));

// TypeScript types for metadata
export type UserMetadata = {
  // Customer service
  customerNotes?: string;
  lifetimeValue?: number;

  // Preferences
  preferredLanguage?: string;
  marketingOptIn?: boolean;
  emailNotifications?: boolean;

  // Social recovery (Phase 5+)
  recoveryContacts?: string[]; // DIDs of trusted contacts

  // Trust & reputation (Phase 5+)
  trustScore?: number;
  attestations?: Array<{
    from: string; // DID
    claim: string;
    stake: string; // MJN amount
    timestamp: string;
  }>;

  // Verifiable credentials (Phase 5+)
  credentials?: Array<{
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
  }>;

  // Extensible for future features
  [key: string]: any;
};

// TypeScript types for collective metadata
export type CollectiveMetadata = {
  // Collective profile
  bio?: string;
  website?: string;
  socialLinks?: {
    twitter?: string;
    github?: string;
    discord?: string;
    [key: string]: string | undefined;
  };

  // Marketplace settings (Phase 5+)
  royaltyPercentage?: number; // Percentage of resale value
  payoutAddress?: string; // Wallet address for payments

  // Trust & reputation (Phase 5+)
  trustScore?: number;
  verifiedBadge?: boolean;
  attestations?: Array<{
    from: string; // DID
    claim: string;
    stake: string; // MJN amount
    timestamp: string;
  }>;

  // Analytics
  totalSales?: number;
  totalProducts?: number;
  totalPortfolioItems?: number;

  // Extensible for future features
  [key: string]: any;
};
```

---

## Migration Script

**File:** `db/migrations/XXXX_add_auth_tables.sql`

```sql
-- Phase 4.4.1: Authentication Schema (Ory Kratos Integration)
-- Local users table shadows Ory identities
-- Added user_collectives for marketplace/decentralization features

-- Updated_at trigger function (used by multiple tables)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Users table (shadow of Ory Kratos identities)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kratos_id UUID UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'customer',
  did TEXT UNIQUE,
  public_key TEXT,
  wallet_address TEXT UNIQUE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_kratos_id ON users(kratos_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_wallet_address ON users(wallet_address) WHERE wallet_address IS NOT NULL;
CREATE INDEX idx_users_did ON users(did) WHERE did IS NOT NULL;
CREATE INDEX idx_users_created_at ON users(created_at);

CREATE TRIGGER users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- User collectives table (organizational entities for marketplace)
CREATE TABLE user_collectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  did TEXT UNIQUE,
  wallet_address TEXT UNIQUE,
  public_key TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by_user_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_collectives_slug ON user_collectives(slug);
CREATE INDEX idx_user_collectives_creator ON user_collectives(created_by_user_id);
CREATE INDEX idx_user_collectives_wallet ON user_collectives(wallet_address) WHERE wallet_address IS NOT NULL;
CREATE INDEX idx_user_collectives_did ON user_collectives(did) WHERE did IS NOT NULL;

CREATE TRIGGER user_collectives_updated_at
BEFORE UPDATE ON user_collectives
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- User collective memberships junction table
CREATE TABLE user_collective_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  collective_id UUID NOT NULL REFERENCES user_collectives(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, collective_id)
);

CREATE INDEX idx_memberships_user ON user_collective_memberships(user_id);
CREATE INDEX idx_memberships_collective ON user_collective_memberships(collective_id);
CREATE INDEX idx_memberships_role ON user_collective_memberships(role);

-- Add user_id to orders table (individual ownership)
ALTER TABLE orders ADD COLUMN user_id UUID REFERENCES users(id);
CREATE INDEX idx_orders_user_id ON orders(user_id);

-- Add created_by_collective_id to products table (creator attribution)
ALTER TABLE products ADD COLUMN created_by_collective_id UUID NOT NULL REFERENCES user_collectives(id);
CREATE INDEX idx_products_collective ON products(created_by_collective_id);

-- Add created_by_collective_id to portfolio_items table (creator attribution)
ALTER TABLE portfolio_items ADD COLUMN created_by_collective_id UUID NOT NULL REFERENCES user_collectives(id);
CREATE INDEX idx_portfolio_items_collective ON portfolio_items(created_by_collective_id);

-- Add user_id to nft_tokens table (individual ownership)
ALTER TABLE nft_tokens ADD COLUMN user_id UUID REFERENCES users(id);
CREATE INDEX idx_nft_tokens_user ON nft_tokens(user_id);

-- Backfill scripts (run manually after seed data)
-- 1. Link existing orders to users by email:
--    UPDATE orders o SET user_id = u.id FROM users u WHERE o.customer_email = u.email AND o.user_id IS NULL;
--
-- 2. Link existing products to Imajin collective (created in seed script):
--    UPDATE products SET created_by_collective_id = (SELECT id FROM user_collectives WHERE slug = 'imajin');
--
-- 3. Link existing portfolio items to Imajin collective:
--    UPDATE portfolio_items SET created_by_collective_id = (SELECT id FROM user_collectives WHERE slug = 'imajin');
--
-- 4. Link existing NFT tokens to users via orders:
--    UPDATE nft_tokens nt SET user_id = o.user_id FROM orders o WHERE nt.order_id = o.id AND nt.user_id IS NULL;
```

---

## Seed Data

**File:** `scripts/seed-users.ts`

**Note:** Seed script creates BOTH Ory identity AND local user record.

```typescript
import { kratosAdmin } from '@/lib/auth/kratos';
import { db } from '@/db';
import { users, trustHubs, userCollectives, userCollectiveMemberships } from '@/db/schema-auth';
import { generateKeyPair } from '@/lib/crypto/keys'; // Utility to generate Ed25519 keypair

export async function seedAuthUsers() {
  console.log('Seeding auth infrastructure...');

  // Create local trust hub (imajin.ca)
  let localHubId: string;
  try {
    const hubKeypair = generateKeyPair(); // Generate Ed25519 keypair for hub

    const [localHub] = await db.insert(trustHubs).values({
      name: 'Imajin',
      slug: 'imajin',
      domain: 'imajin.ca',
      publicKey: hubKeypair.publicKey,
      isLocal: true,
      trustLevel: 0, // Self = trust level 0
      apiEndpoint: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:30000',
      metadata: {
        privateKey: hubKeypair.privateKey, // Store securely in production!
        description: 'Official Imajin trust hub',
      },
    }).onConflictDoNothing().returning();

    localHubId = localHub.id;
    console.log('✅ Local trust hub created (imajin.ca)');
  } catch (error) {
    console.log('⚠️  Local trust hub may already exist');
    // If hub already exists, fetch its ID
    const existingHub = await db.query.trustHubs.findFirst({
      where: (hubs, { eq }) => eq(hubs.isLocal, true),
    });
    localHubId = existingHub!.id;
  }

  // Admin user
  let adminUserId: string;
  try {
    const adminIdentity = await kratosAdmin.createIdentity({
      createIdentityBody: {
        schema_id: 'default',
        traits: {
          email: 'admin@imajin.ca',
          name: 'Admin User',
          role: 'admin',
        },
        credentials: {
          password: {
            config: {
              password: process.env.ADMIN_PASSWORD || 'AdminPassword123!',
            },
          },
        },
        state: 'active',
        verifiable_addresses: [
          {
            value: 'admin@imajin.ca',
            verified: true,
            via: 'email',
          },
        ],
      },
    });

    const [adminUser] = await db.insert(users).values({
      kratosId: adminIdentity.data.id,
      email: 'admin@imajin.ca',
      name: 'Admin User',
      role: 'admin',
    }).onConflictDoNothing().returning();

    adminUserId = adminUser.id;
    console.log('✅ Admin user created');
  } catch (error) {
    console.log('⚠️  Admin user may already exist');
    // If admin already exists, fetch their ID
    const existingAdmin = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, 'admin@imajin.ca'),
    });
    adminUserId = existingAdmin!.id;
  }

  // Imajin collective (official products)
  let imajinCollectiveId: string;
  try {
    const [imajinCollective] = await db.insert(userCollectives).values({
      name: 'Imajin',
      slug: 'imajin',
      description: 'Official Imajin LED fixtures and components',
      createdByUserId: adminUserId,
      hostedOnHubId: localHubId,  // Hosted on local hub
      originHubId: localHubId,    // Originated on local hub
      isCached: false,            // Not a cache, this is the source
    }).onConflictDoNothing().returning();

    imajinCollectiveId = imajinCollective.id;

    // Add admin as owner of Imajin collective
    await db.insert(userCollectiveMemberships).values({
      userId: adminUserId,
      collectiveId: imajinCollectiveId,
      role: 'owner',
    }).onConflictDoNothing();

    console.log('✅ Imajin collective created');
  } catch (error) {
    console.log('⚠️  Imajin collective may already exist');
  }

  // Test customer user
  try {
    const customerIdentity = await kratosAdmin.createIdentity({
      createIdentityBody: {
        schema_id: 'default',
        traits: {
          email: 'customer@example.com',
          name: 'Test Customer',
          role: 'customer',
        },
        credentials: {
          password: {
            config: {
              password: 'CustomerPassword123!',
            },
          },
        },
        state: 'active',
        verifiable_addresses: [
          {
            value: 'customer@example.com',
            verified: true,
            via: 'email',
          },
        ],
      },
    });

    await db.insert(users).values({
      kratosId: customerIdentity.data.id,
      email: 'customer@example.com',
      name: 'Test Customer',
      role: 'customer',
    }).onConflictDoNothing();

    console.log('✅ Test customer created');
  } catch (error) {
    console.log('⚠️  Test customer may already exist');
  }

  console.log('✅ Auth infrastructure seeded successfully');
  console.log('');
  console.log('Hubs created:');
  console.log('  - imajin.ca (official hub, trust_level=0)');
  console.log('');
  console.log('Collectives created:');
  console.log('  - Imajin (official products collective)');
  console.log('  - Test Customer Personal (personal collective)');
}

// Helper function: Create personal hub + collective for new user
export async function createPersonalHubForUser(userId: string, userName: string, userEmail: string) {
  // Generate keypair for user's personal hub
  const hubKeypair = generateKeyPair();

  // Create personal hub (runs on user's device)
  const [personalHub] = await db.insert(trustHubs).values({
    name: `${userName}'s Hub`,
    slug: `${userEmail.split('@')[0]}-hub`, // e.g., "customer-hub"
    domain: `local-${userId.slice(0, 8)}`, // Local identifier
    publicKey: hubKeypair.publicKey,
    isLocal: false, // Not the current server's local hub
    trustLevel: 1, // Verified (user's own hub)
    apiEndpoint: null, // Will be set when device comes online
    metadata: {
      ownerUserId: userId,
      isPersonalHub: true,
    },
  }).returning();

  // Create personal collective (user's own products/portfolio)
  const [personalCollective] = await db.insert(userCollectives).values({
    name: `${userName} Personal`,
    slug: `${userEmail.split('@')[0]}-personal`,
    description: `Personal collective for ${userName}`,
    createdByUserId: userId,
    hostedOnHubId: personalHub.id,
    originHubId: personalHub.id,
    isCached: false,
  }).returning();

  // Add user as owner of their personal collective
  await db.insert(userCollectiveMemberships).values({
    userId: userId,
    collectiveId: personalCollective.id,
    role: 'owner',
  });

  return { hub: personalHub, collective: personalCollective };
}
```

**Add to main seed script:**

```typescript
// db/seed.ts
import { seedAuthUsers } from '../scripts/seed-users';

async function main() {
  // ... existing seeds

  // Seed auth users (requires Ory Kratos running)
  await seedAuthUsers();
}
```

---

## Implementation Steps

### Step 1: Create Drizzle Schema (20 min)

- [ ] Create `db/schema-auth.ts` with users table
- [ ] Define TypeScript types (UserMetadata)
- [ ] Add relations to existing orders schema
- [ ] Export all tables and types

### Step 2: Generate Migration (15 min)

- [ ] Run `npx drizzle-kit generate:pg`
- [ ] Review generated SQL
- [ ] Manually adjust if needed (add comments, ensure indexes)
- [ ] Save as `db/migrations/XXXX_add_auth_tables.sql`

### Step 3: Run Migration (15 min)

- [ ] Ensure Ory Kratos is running (required for seed script)
- [ ] Run migration on dev database: `npm run db:migrate`
- [ ] Verify table created in Drizzle Studio
- [ ] Run migration on test database: `NODE_ENV=test npm run db:migrate`
- [ ] Verify test database table

### Step 4: Create Seed Script (30 min)

- [ ] Create `scripts/seed-users.ts`
- [ ] Add admin user seed (creates Ory identity + local user)
- [ ] Add test customer user seed
- [ ] Integrate with main seed script
- [ ] Run seed: `npm run seed:users`

### Step 5: Update orders Table (10 min)

- [ ] Add user_id column migration
- [ ] Create index
- [ ] Test foreign key constraint
- [ ] Document backfill process (manual after user creation)

### Step 6: Update Schema Exports (10 min)

- [ ] Update `db/schema.ts` to export auth tables
- [ ] Update `db/index.ts` if needed
- [ ] Verify imports work in test files

### Step 7: Validation (20 min)

- [ ] Start Drizzle Studio: `npm run db:studio`
- [ ] Verify users table exists
- [ ] Verify indexes exist
- [ ] Verify seed users exist
- [ ] Verify foreign key relationships
- [ ] Test updated_at trigger
- [ ] Verify kratos_id unique constraint

---

## Acceptance Criteria

- [ ] Users table created with kratos_id field
- [ ] user_collectives table created with creator attribution
- [ ] user_collective_memberships junction table created
- [ ] All indexes created and performant
- [ ] orders.user_id column added
- [ ] products.created_by_collective_id column added (NON-NULLABLE)
- [ ] portfolio_items.created_by_collective_id column added (NON-NULLABLE)
- [ ] nft_tokens.user_id column added
- [ ] Updated_at triggers working for users and user_collectives
- [ ] Seed script creates admin user, Imajin collective, and membership
- [ ] Drizzle Studio shows all new tables
- [ ] No TypeScript errors
- [ ] DID fields are nullable (no breaking changes)
- [ ] Migration runs cleanly on dev and test databases
- [ ] Foreign key constraints work (users → orders, collectives → products, etc.)
- [ ] Existing products/portfolio items backfilled to Imajin collective

---

## Testing

**Manual Testing:**

```bash
# Start Ory Kratos first
docker-compose -f docker/docker-compose.auth.yml up -d

# Verify Ory is healthy
curl http://localhost:4433/health/ready
curl http://localhost:4434/health/ready

# Run migration
npm run db:migrate

# Start Drizzle Studio
npm run db:studio

# Verify tables:
# - users (11 columns including kratos_id)
# - user_collectives (11 columns)
# - user_collective_memberships (5 columns)

# Verify indexes:
# - idx_users_kratos_id
# - idx_users_email
# - idx_users_role
# - idx_users_wallet_address (partial)
# - idx_users_did (partial)
# - idx_user_collectives_slug
# - idx_user_collectives_creator
# - idx_memberships_user
# - idx_memberships_collective
# - idx_orders_user_id
# - idx_products_collective
# - idx_portfolio_items_collective
# - idx_nft_tokens_user

# Run seed script
npm run seed:users

# Verify seed data in Drizzle Studio:
# - admin@imajin.ca (role: admin)
# - customer@example.com (role: customer)
# - Imajin collective (slug: imajin)
# - Admin is owner of Imajin collective
```

**SQL Testing:**

```sql
-- Verify schema for new tables
\d users
\d user_collectives
\d user_collective_memberships

-- Check users table
SELECT id, kratos_id, email, role FROM users;

-- Check Imajin collective exists
SELECT id, name, slug, created_by_user_id FROM user_collectives WHERE slug = 'imajin';

-- Check admin is owner of Imajin collective
SELECT u.email, uc.name, ucm.role
FROM user_collective_memberships ucm
JOIN users u ON ucm.user_id = u.id
JOIN user_collectives uc ON ucm.collective_id = uc.id
WHERE u.email = 'admin@imajin.ca';

-- Test updated_at trigger on users
UPDATE users SET name = 'Test Update' WHERE email = 'customer@example.com';
SELECT name, updated_at FROM users WHERE email = 'customer@example.com';
-- updated_at should be recent

-- Test updated_at trigger on user_collectives
UPDATE user_collectives SET description = 'Updated description' WHERE slug = 'imajin';
SELECT description, updated_at FROM user_collectives WHERE slug = 'imajin';
-- updated_at should be recent

-- Test foreign key constraint (products → collectives)
SELECT p.id, p.name, uc.name as collective_name
FROM products p
JOIN user_collectives uc ON p.created_by_collective_id = uc.id
LIMIT 5;

-- Test foreign key constraint (portfolio_items → collectives)
SELECT pi.id, pi.title, uc.name as collective_name
FROM portfolio_items pi
JOIN user_collectives uc ON pi.created_by_collective_id = uc.id
LIMIT 5;

-- Test NFT ownership tracking
SELECT nt.id, nt.serial_number, u.email as owner_email
FROM nft_tokens nt
LEFT JOIN users u ON nt.user_id = u.id
LIMIT 5;

-- Test cascade delete (membership deleted when user is deleted)
-- NOTE: Don't run this on admin user!
DELETE FROM users WHERE email = 'customer@example.com';
-- Should cascade delete memberships

-- Restore test user
-- (re-run seed script)
```

**Ory Identity Verification:**

```bash
# List Ory identities
curl http://localhost:4434/admin/identities | jq

# Check specific identity
curl http://localhost:4434/admin/identities/{kratos_id} | jq

# Verify traits match local users table
```

---

## Environment Variables

**Required for seed script:**

```bash
# Ory Kratos
KRATOS_ADMIN_URL=http://localhost:4434

# Admin password (optional, defaults to AdminPassword123!)
ADMIN_PASSWORD=your-secure-password
```

---

## Rollback Plan

If migration fails or needs to be reverted:

```sql
-- Drop columns from existing tables first (to remove FK dependencies)
ALTER TABLE products DROP COLUMN IF EXISTS created_by_collective_id;
ALTER TABLE portfolio_items DROP COLUMN IF EXISTS created_by_collective_id;
ALTER TABLE nft_tokens DROP COLUMN IF EXISTS user_id;
ALTER TABLE orders DROP COLUMN IF EXISTS user_id;

-- Drop new tables in dependency order
DROP TABLE IF EXISTS user_collective_memberships CASCADE;
DROP TABLE IF EXISTS user_collectives CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop trigger function
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
```

**Also delete Ory identities:**

```bash
# Delete all identities (dev only!)
curl -X DELETE http://localhost:4434/admin/identities/{identity_id}
```

**Note:** If you need to preserve existing products/portfolio data, DO NOT rollback the migration. Instead, create a temporary "Unknown" collective and re-point FKs before dropping tables.

---

## Comparison: Ory vs DIY NextAuth

**Tables Removed (Ory manages):**
- ❌ accounts (13 columns) → Ory manages credentials
- ❌ sessions (4 columns) → Ory manages sessions
- ❌ verification_tokens (3 columns) → Ory manages verification

**Tables Kept (local shadow):**
- ✅ users (11 columns) → Simplified, added kratos_id

**Net Result:**
- 60% less schema complexity
- No password hashing code needed
- No session management code needed
- No token cleanup jobs needed

---

## User Onboarding Flow (Phase 5+ Vision)

### When User Initializes Their Unit:

```
User receives Imajin unit → Powers on → Initialization wizard
```

**Step 1: Identity Creation**
- User creates account (email/password or wallet)
- Ory Kratos identity created
- Local user record created

**Step 2: Hub Initialization**
- Device generates Ed25519 keypair
- Creates local trust_hub record
- Registers hub on imajin.ca for discovery
- Hub gets unique identifier (domain or DID)

**Step 3: Personal Collective Creation**
- Automatically creates "{User} Personal" collective
- Hosted on user's hub
- User is owner

**Step 4: Federation Options** (user chooses)
- **Option A:** Run as standalone hub (fully local)
- **Option B:** Federate with imajin.ca (sync official catalog)
- **Option C:** Join existing community hub (family/organization)

**Result:**
```
User's Unit (personal hub)
├── User's account
├── Personal collective (for their own creations)
├── [Optional] Cached Imajin catalog (if federated)
└── [Optional] Membership in family/community collectives
```

### Example Scenarios

#### Scenario 1: Solo Artist
- Buys Founder Edition unit
- Initializes as personal hub
- Creates products for their own use
- Optionally: Federates with imajin.ca to sell creations

#### Scenario 2: Family Household
- Parents buy unit for home
- Initialize as "Smith Family Hub"
- Each family member has account on hub
- Share projects within household
- Optionally: Federate to buy from imajin.ca

#### Scenario 3: Artist Collective
- Group of 5 artists
- One member runs dedicated hub unit
- All members create accounts on hub
- Shared collective for group projects
- Federate with imajin.ca + other artist hubs

#### Scenario 4: Convenience User (Web-only)
- No physical unit yet
- Signs up on imajin.ca
- Personal hub created (virtual, runs on imajin.ca servers)
- Later: Can migrate to own unit when purchased

### Data Ownership Guarantees

**What lives on user's hub:**
- User's account data (encrypted)
- Personal collective data
- Products/portfolio they created
- Orders they placed
- NFTs they own

**What's cached from other hubs:**
- Imajin official catalog (if federated)
- Products from trusted collectives
- User profiles (public data only)

**What's NEVER on user's hub without permission:**
- Other users' private data
- Payment information (Stripe holds)
- Passwords (Ory Kratos holds, or on user's hub if self-hosted Ory)

---

## Next Steps

After Phase 4.4.1 complete:
1. **Phase 4.4.2:** Set up Ory Kratos (Docker, config, identity schema)
2. **Phase 4.4.3:** Build auth UI components (Ory self-service flows)
3. **Phase 4.4.4:** Implement protected routes (Ory session checking)

---

**See Also:**
- `docs/AUTH_STRATEGY.md` - Overall auth strategy
- `docs/tasks/Phase 4.4 - Authentication.md` - Parent task
- `docs/tasks/Phase 4.4.2 - Ory Kratos Setup.md` - Next phase
- Ory Kratos Docs: https://www.ory.sh/docs/kratos/
