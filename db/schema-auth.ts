import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  boolean,
  integer,
  index,
  unique,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

/**
 * Users table - Local shadow of Ory Kratos identities
 *
 * Stores user metadata and app-specific fields. Password hashing, sessions,
 * and verification tokens are managed by Ory Kratos (external).
 *
 * Sync strategy: Ory webhooks update this table on identity.created/updated
 */
export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    kratosId: uuid('kratos_id').unique().notNull(), // Links to Ory Kratos identity

    // Denormalized from Ory (for query performance)
    email: text('email').unique().notNull(),
    name: text('name'),
    role: text('role').notNull().default('customer'), // 'customer' | 'admin'

    // DID/wallet authentication (Phase 5+ - nullable for now)
    did: text('did').unique(),
    publicKey: text('public_key'),
    walletAddress: text('wallet_address').unique(),

    // Hub federation (Phase 5+ - architectural readiness)
    homeHubId: uuid('home_hub_id'), // References trust_hubs(id), added after trust_hubs created
    isCached: boolean('is_cached').default(false), // Is this a cached user from another hub?
    cachedFromHubId: uuid('cached_from_hub_id'), // References trust_hubs(id)
    knownOnHubs: jsonb('known_on_hubs').$type<string[]>().default(sql`'[]'::jsonb`), // Array of hub IDs
    lastSyncedAt: timestamp('last_synced_at'),

    // App-specific metadata (NOT in Ory)
    metadata: jsonb('metadata').$type<UserMetadata>().default(sql`'{}'::jsonb`),

    // Timestamps
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    kratosIdIdx: index('idx_users_kratos_id').on(table.kratosId),
    emailIdx: index('idx_users_email').on(table.email),
    roleIdx: index('idx_users_role').on(table.role),
    homeHubIdx: index('idx_users_home_hub').on(table.homeHubId),
    cachedIdx: index('idx_users_cached').on(table.isCached),
    walletAddressIdx: index('idx_users_wallet_address').on(table.walletAddress),
    didIdx: index('idx_users_did').on(table.did),
    createdAtIdx: index('idx_users_created_at').on(table.createdAt),
  })
);

/**
 * Trust hubs table - Federated hosting nodes
 *
 * Phase 5+ architecture. Every Imajin unit can run as a hub. Included now
 * for architectural completeness. Not required for initial auth implementation.
 *
 * Trust levels:
 * - 0 (self): This hub (imajin.ca)
 * - 1 (verified): Verified partner hubs
 * - 2 (federated): Federated hubs (moderate trust)
 * - 3 (cached-only): Cached data from unknown hubs
 */
export const trustHubs = pgTable(
  'trust_hubs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    slug: text('slug').unique().notNull(),
    domain: text('domain').unique().notNull(), // e.g., 'imajin.ca', 'community.example.com'

    // DID/wallet for hub identity
    did: text('did').unique(),
    walletAddress: text('wallet_address').unique(),
    publicKey: text('public_key').notNull(), // Hub's public key for signature verification

    // Hub status
    isLocal: boolean('is_local').notNull().default(false), // Is this the current hub we're running on?
    isActive: boolean('is_active').notNull().default(true),
    trustLevel: integer('trust_level').default(0), // 0=self, 1=verified, 2=federated, 3=cached-only

    // Federation metadata
    apiEndpoint: text('api_endpoint'), // Hub's API URL for federation
    federationProtocol: text('federation_protocol').default('activitypub'), // 'activitypub', 'did-comm', 'ipfs'
    metadata: jsonb('metadata').$type<HubMetadata>().default(sql`'{}'::jsonb`), // Federation policies, rate limits

    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    slugIdx: index('idx_trust_hubs_slug').on(table.slug),
    domainIdx: index('idx_trust_hubs_domain').on(table.domain),
    localIdx: index('idx_trust_hubs_local').on(table.isLocal),
    activeIdx: index('idx_trust_hubs_active').on(table.isActive),
    trustLevelIdx: index('idx_trust_hubs_trust_level').on(table.trustLevel),
  })
);

/**
 * Trust hub federation table - Hub-to-hub trust relationships
 *
 * Phase 5+ architecture. Explicit trust relationships between hubs.
 */
export const trustHubFederation = pgTable(
  'trust_hub_federation',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    fromHubId: uuid('from_hub_id').notNull(), // References trust_hubs(id), added after creation
    toHubId: uuid('to_hub_id').notNull(), // References trust_hubs(id), added after creation

    trustLevel: integer('trust_level').notNull().default(2), // 1=verified, 2=federated, 3=cached-only
    isBidirectional: boolean('is_bidirectional').default(false), // Does other hub trust us back?

    // Federation settings
    syncCollectives: boolean('sync_collectives').default(true),
    syncProducts: boolean('sync_products').default(true),
    syncPortfolio: boolean('sync_portfolio').default(true),
    syncUsers: boolean('sync_users').default(false), // Usually false for privacy

    metadata: jsonb('metadata').$type<FederationMetadata>().default(sql`'{}'::jsonb`),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    fromHubIdx: index('idx_federation_from_hub').on(table.fromHubId),
    toHubIdx: index('idx_federation_to_hub').on(table.toHubId),
    trustLevelIdx: index('idx_federation_trust_level').on(table.trustLevel),
    uniqueFederation: unique('uniq_federation_hubs').on(table.fromHubId, table.toHubId),
  })
);

/**
 * User collectives table - Organizational entities for marketplace
 *
 * Products and portfolio items are attributed to collectives, not individual users.
 * This supports marketplace features and decentralization-ready architecture.
 */
export const userCollectives = pgTable(
  'user_collectives',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    slug: text('slug').unique().notNull(),
    description: text('description'),

    // DID/wallet for future decentralization (Phase 5+)
    did: text('did').unique(),
    walletAddress: text('wallet_address').unique(),
    publicKey: text('public_key'),

    // Hub federation (Phase 5+ - architectural readiness)
    hostedOnHubId: uuid('hosted_on_hub_id'), // Current hosting hub (nullable = local hub)
    originHubId: uuid('origin_hub_id'), // Hub where collective was created
    isCached: boolean('is_cached').default(false), // Is this a cached copy from another hub?
    cachedFromHubId: uuid('cached_from_hub_id'), // If cached, which hub is source of truth?
    lastSyncedAt: timestamp('last_synced_at'), // When was this collective last synced?

    // Migration history (track hub migrations)
    migrationHistory: jsonb('migration_history').$type<MigrationHistoryEntry[]>().default(sql`'[]'::jsonb`),

    // Metadata
    metadata: jsonb('metadata').$type<CollectiveMetadata>().default(sql`'{}'::jsonb`),

    // Founder/creator
    createdByUserId: uuid('created_by_user_id').notNull(), // References users(id), added after users created

    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    slugIdx: index('idx_user_collectives_slug').on(table.slug),
    creatorIdx: index('idx_user_collectives_creator').on(table.createdByUserId),
    hostedOnIdx: index('idx_user_collectives_hosted_on').on(table.hostedOnHubId),
    originIdx: index('idx_user_collectives_origin').on(table.originHubId),
    cachedIdx: index('idx_user_collectives_cached').on(table.isCached),
    walletIdx: index('idx_user_collectives_wallet').on(table.walletAddress),
    didIdx: index('idx_user_collectives_did').on(table.did),
  })
);

/**
 * User collective memberships table - Many-to-many between users and collectives
 *
 * Users can belong to multiple collectives with different roles.
 */
export const userCollectiveMemberships = pgTable(
  'user_collective_memberships',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull(), // References users(id), cascade delete
    collectiveId: uuid('collective_id').notNull(), // References user_collectives(id), cascade delete
    role: text('role').notNull().default('member'), // 'owner' | 'admin' | 'member'

    joinedAt: timestamp('joined_at').notNull().defaultNow(),
  },
  (table) => ({
    userIdx: index('idx_memberships_user').on(table.userId),
    collectiveIdx: index('idx_memberships_collective').on(table.collectiveId),
    roleIdx: index('idx_memberships_role').on(table.role),
    uniqueMembership: unique('uniq_membership').on(table.userId, table.collectiveId),
  })
);

// ==============================================================================
// CONTACTS & MAILING LISTS (Phase 4.4.1.1 - Optional)
// ==============================================================================

/**
 * Contacts table - Reusable contact methods (email/phone)
 *
 * Can exist with or without an account. Supports marketing signups before
 * account creation. Keeps one primary per channel while preserving alternates.
 */
export const contacts = pgTable(
  'contacts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id'), // nullable for non-account subscribers
    kind: text('kind').notNull(), // 'email' | 'phone'
    value: text('value').notNull(), // email lowercased; phone E.164
    isPrimary: boolean('is_primary').notNull().default(false), // one per user+kind
    isVerified: boolean('is_verified').notNull().default(false),
    verifiedAt: timestamp('verified_at'),
    source: text('source').notNull(), // 'auth', 'signup_form', 'order', 'manual'
    metadata: jsonb('metadata').$type<ContactMetadata>().default(sql`'{}'::jsonb`), // bounce codes, locale
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index('idx_contacts_user').on(table.userId),
    kindIdx: index('idx_contacts_kind').on(table.kind),
    valueIdx: index('idx_contacts_value').on(table.value),
    uniqueValuePerKind: unique('uniq_contacts_value_kind').on(table.value, table.kind),
    // Partial unique index for single primary per user+kind enforced in migration SQL
  })
);

/**
 * Mailing lists table - Managed lists (e.g., product alerts, newsletter, SMS alerts)
 */
export const mailingLists = pgTable(
  'mailing_lists',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').unique().notNull(), // 'product-alerts', 'newsletter', 'sms-alerts'
    name: text('name').notNull(),
    description: text('description'),
    isDefault: boolean('is_default').notNull().default(false),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    slugIdx: index('idx_mailing_lists_slug').on(table.slug),
  })
);

/**
 * Contact subscriptions table - Consent/opt-in state per contact per mailing list
 *
 * Stores consent separately from auth user record. Handles double opt-in,
 * unsubscribe, and bounce states. Works for both account-linked and guest contacts.
 */
export const contactSubscriptions = pgTable(
  'contact_subscriptions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    contactId: uuid('contact_id').notNull(), // References contacts(id), cascade delete
    mailingListId: uuid('mailing_list_id').notNull(), // References mailing_lists(id), cascade delete
    status: text('status').notNull(), // 'pending' | 'subscribed' | 'unsubscribed' | 'bounced'
    optInAt: timestamp('opt_in_at'),
    optOutAt: timestamp('opt_out_at'),
    optInIp: text('opt_in_ip'),
    optInUserAgent: text('opt_in_user_agent'),
    metadata: jsonb('metadata').$type<SubscriptionMetadata>().default(sql`'{}'::jsonb`), // bounce/complaint details
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    contactIdx: index('idx_contact_subs_contact').on(table.contactId),
    mailingListIdx: index('idx_contact_subs_list').on(table.mailingListId),
    statusIdx: index('idx_contact_subs_status').on(table.status),
    uniqueSubscription: unique('uniq_contact_subscription').on(table.contactId, table.mailingListId),
  })
);

/**
 * Contact verification tokens table - Double opt-in verification flow
 *
 * For email verification before subscribing to mailing lists.
 */
export const contactVerificationTokens = pgTable(
  'contact_verification_tokens',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    contactId: uuid('contact_id').notNull(), // References contacts(id), cascade delete
    mailingListId: uuid('mailing_list_id').notNull(), // References mailing_lists(id)
    token: text('token').notNull().unique(),
    expiresAt: timestamp('expires_at').notNull(),
    usedAt: timestamp('used_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    contactIdx: index('idx_verification_tokens_contact').on(table.contactId),
    tokenIdx: index('idx_verification_tokens_token').on(table.token),
    expiresIdx: index('idx_verification_tokens_expires').on(table.expiresAt),
  })
);

// ==============================================================================
// DRIZZLE RELATIONS
// ==============================================================================

export const usersRelations = relations(users, ({ one, many }) => ({
  homeHub: one(trustHubs, {
    fields: [users.homeHubId],
    references: [trustHubs.id],
    relationName: 'homeHub',
  }),
  cachedFromHub: one(trustHubs, {
    fields: [users.cachedFromHubId],
    references: [trustHubs.id],
    relationName: 'cachedFrom',
  }),
  createdCollectives: many(userCollectives),
  collectiveMemberships: many(userCollectiveMemberships),
  contacts: many(contacts),
}));

export const trustHubsRelations = relations(trustHubs, ({ many }) => ({
  usersAtThisHub: many(users, { relationName: 'homeHub' }),
  cachedUsers: many(users, { relationName: 'cachedFrom' }),
  hostedCollectives: many(userCollectives, { relationName: 'hostedOn' }),
  originatedCollectives: many(userCollectives, { relationName: 'origin' }),
  cachedCollectives: many(userCollectives, { relationName: 'cachedFrom' }),
  federationFrom: many(trustHubFederation, { relationName: 'federationFrom' }),
  federationTo: many(trustHubFederation, { relationName: 'federationTo' }),
}));

export const trustHubFederationRelations = relations(trustHubFederation, ({ one }) => ({
  fromHub: one(trustHubs, {
    fields: [trustHubFederation.fromHubId],
    references: [trustHubs.id],
    relationName: 'federationFrom',
  }),
  toHub: one(trustHubs, {
    fields: [trustHubFederation.toHubId],
    references: [trustHubs.id],
    relationName: 'federationTo',
  }),
}));

export const userCollectivesRelations = relations(userCollectives, ({ one, many }) => ({
  creator: one(users, {
    fields: [userCollectives.createdByUserId],
    references: [users.id],
  }),
  hostedOnHub: one(trustHubs, {
    fields: [userCollectives.hostedOnHubId],
    references: [trustHubs.id],
    relationName: 'hostedOn',
  }),
  originHub: one(trustHubs, {
    fields: [userCollectives.originHubId],
    references: [trustHubs.id],
    relationName: 'origin',
  }),
  cachedFromHub: one(trustHubs, {
    fields: [userCollectives.cachedFromHubId],
    references: [trustHubs.id],
    relationName: 'cachedFrom',
  }),
  memberships: many(userCollectiveMemberships),
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

export const contactsRelations = relations(contacts, ({ one, many }) => ({
  user: one(users, {
    fields: [contacts.userId],
    references: [users.id],
  }),
  subscriptions: many(contactSubscriptions),
  verificationTokens: many(contactVerificationTokens),
}));

export const mailingListsRelations = relations(mailingLists, ({ many }) => ({
  subscriptions: many(contactSubscriptions),
}));

export const contactSubscriptionsRelations = relations(contactSubscriptions, ({ one }) => ({
  contact: one(contacts, {
    fields: [contactSubscriptions.contactId],
    references: [contacts.id],
  }),
  mailingList: one(mailingLists, {
    fields: [contactSubscriptions.mailingListId],
    references: [mailingLists.id],
  }),
}));

export const contactVerificationTokensRelations = relations(contactVerificationTokens, ({ one }) => ({
  contact: one(contacts, {
    fields: [contactVerificationTokens.contactId],
    references: [contacts.id],
  }),
}));

// ==============================================================================
// TYPESCRIPT TYPES FOR METADATA FIELDS
// ==============================================================================

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

export type HubMetadata = {
  // Hub profile
  description?: string;
  operatorEmail?: string;

  // Federation policies
  contentPolicy?: string;
  rateLimit?: {
    requestsPerMinute?: number;
    requestsPerHour?: number;
  };

  // Private key (store securely in production!)
  privateKey?: string;

  [key: string]: any;
};

export type FederationMetadata = {
  // Sync settings
  lastSyncAt?: string;
  syncErrors?: string[];

  // Content filters
  allowedCategories?: string[];
  blockedTags?: string[];

  [key: string]: any;
};

export type MigrationHistoryEntry = {
  fromHub: string; // Hub ID or domain
  toHub: string; // Hub ID or domain
  timestamp: string;
  reason?: string;
};

export type ContactMetadata = {
  // Bounce tracking
  bounceCount?: number;
  lastBounceAt?: string;
  bounceType?: 'hard' | 'soft';

  // Locale & carrier
  locale?: string;
  carrier?: string;

  [key: string]: any;
};

export type SubscriptionMetadata = {
  // Bounce/complaint details
  bounceDetails?: string;
  complaintDetails?: string;

  // Campaign source
  campaignId?: string;
  referrer?: string;

  [key: string]: any;
};
