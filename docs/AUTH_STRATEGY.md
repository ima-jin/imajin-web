# Authentication Strategy: Traditional Auth → DID Evolution

**Purpose:** Define authentication implementation for imajin-web that works today but evolves to Decentralized Identity (DID) without major rework.

**Status:** Phase 4.4 Implementation (Ory Kratos)
**Last Updated:** 2025-11-17

---

## Executive Summary

**The Challenge:** We need authentication NOW for CRM features (customer tracking, order history, cart persistence), but our long-term vision (mjn project) includes Decentralized Identifiers (DIDs) and Self-Sovereign Identity (SSI).

**The Strategy:** Implement traditional auth today with a schema and architecture that can evolve to DID without major rework.

**Key Decision:** Use **Ory Kratos** (self-hosted identity provider) with a DID-ready database schema.

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
- Session management
- Role-based access (customer, admin)
- Password reset flow
- Email verification
- MFA for admin accounts

**What we're building:**
- PostgreSQL-backed auth
- Ory Kratos (self-hosted identity provider)
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
1. Add DID field to Ory identity schema (already included, nullable)
2. Add wallet auth custom flow to Ory
3. Users can link wallet to existing account
4. Eventually: DID becomes primary, email becomes backup
5. No data loss, no account recreation

---

## Technical Architecture

### Database Schema (DID-Ready)

**Local users table (shadows Ory identities):**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kratos_id UUID UNIQUE NOT NULL, -- Links to Ory Kratos identity

  -- Denormalized from Ory (for query performance)
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'customer', -- 'customer' | 'admin'

  -- DID fields (Phase 5+ - nullable for now)
  did TEXT UNIQUE,                     -- W3C DID (e.g., 'did:sol:...')
  public_key TEXT,                     -- Ed25519 public key for signature verification
  wallet_address TEXT UNIQUE,          -- Solana wallet address

  -- Verifiable credentials (Phase 5+ - JSONB for flexibility)
  credentials JSONB DEFAULT '[]'::jsonb,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_users_kratos_id ON users(kratos_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_did ON users(did) WHERE did IS NOT NULL;
CREATE INDEX idx_users_wallet_address ON users(wallet_address) WHERE wallet_address IS NOT NULL;
```

**What Ory Manages (NOT in local DB):**
- ❌ Password hashes (Ory stores securely in its own database)
- ❌ Sessions (Ory manages session cookies)
- ❌ Verification tokens (Ory self-service flows)
- ❌ MFA credentials (TOTP secrets in Ory)

**Ory Identity Schema (in Kratos config):**
```json
{
  "$id": "https://imajin.ca/schemas/identity.schema.json",
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "User Identity",
  "type": "object",
  "properties": {
    "traits": {
      "type": "object",
      "properties": {
        "email": {
          "type": "string",
          "format": "email",
          "title": "Email",
          "ory.sh/kratos": {
            "credentials": {
              "password": { "identifier": true }
            },
            "verification": { "via": "email" },
            "recovery": { "via": "email" }
          }
        },
        "name": {
          "type": "string",
          "title": "Full Name"
        },
        "role": {
          "type": "string",
          "enum": ["customer", "admin"],
          "default": "customer",
          "title": "Role"
        },
        "wallet_address": {
          "type": "string",
          "title": "Solana Wallet Address"
        },
        "did": {
          "type": "string",
          "title": "Decentralized Identifier"
        },
        "public_key": {
          "type": "string",
          "title": "Public Key"
        }
      },
      "required": ["email"],
      "additionalProperties": false
    }
  }
}
```

### Why This Architecture Works for DID Evolution

**1. Ory identity schema includes DID fields (nullable):**
- Users can be created with traditional auth (email/password)
- DID fields populated later when user links wallet
- No schema migration needed when adding DID support

**2. Local users table shadows Ory + app-specific data:**
- `kratos_id` links to Ory identity
- `email`, `name`, `role` denormalized for query performance
- `did`, `wallet_address`, `public_key` for future wallet auth
- `credentials` JSONB for Verifiable Credentials
- `metadata` JSONB for app-specific extensions

**3. Ory Kratos supports custom authentication methods:**
- Start with password strategy
- Add custom wallet auth flow later (Phase 5+)
- Users can have multiple auth methods simultaneously

**4. Webhook sync keeps local DB in sync:**
- Ory sends webhook on identity.created → Create local user
- Ory sends webhook on identity.updated → Update local user
- Fallback: Create on-demand in session helper if webhook missed

---

## Auth Provider: Ory Kratos

### Why Ory Kratos?

**✅ Pros:**
- **Self-hosted:** No subscriptions, full control (aligns with philosophy)
- **PostgreSQL storage:** Ory uses its own database for credentials/sessions
- **Next.js compatible:** Works with App Router, Server Components
- **Extensible:** Can add custom auth strategies (wallet auth later)
- **Session management built-in:** Secure cookies, CSRF protection
- **Email verification:** Built-in self-service flows
- **MFA ready:** TOTP (2FA) with QR code setup
- **DID-compatible:** Custom identity schemas support any fields
- **Battle-tested:** Used by Grafana, GitLab, and other major projects
- **Saves 10-15 hours:** No need to build password hashing, session management, MFA

**❌ Cons:**
- Learning curve for Ory's self-service flow pattern
- Docker container required (not just npm package)

**Alternatives Considered:**
- **NextAuth.js:** ❌ Requires managing accounts/sessions tables, less secure for DIY password auth
- **Clerk:** ❌ Subscription-based, vendor lock-in
- **Auth0:** ❌ Expensive, proprietary
- **Supabase Auth:** ❌ Tied to Supabase ecosystem
- **Custom auth:** ❌ Too much work, security risks
- **Lucia Auth:** ⚠️ Good, but less mature, smaller community

**Decision:** Ory Kratos best balance of control, security, and DID evolution path.

---

## Implementation Plan

See detailed task documents:
- **Phase 4.4.1:** Database Schema (users table with kratos_id, 2 hours)
- **Phase 4.4.2:** Ory Kratos Setup (Docker, identity schema, webhooks, 4 hours)
- **Phase 4.4.3:** Auth UI Components (Ory self-service flows, 2.5 hours)
- **Phase 4.4.4:** Protected Routes & Middleware (Ory session checking, 3 hours)
- **Phase 4.4.5:** Integration with Existing Features (orders, account pages, 1.5 hours)
- **Phase 4.4.6:** SendGrid Email Integration (Ory SMTP config, 2 hours)
- **Phase 4.4.7:** Testing (unit, integration, E2E, 3 hours)

**Total: ~13 hours** (vs 20-25 hours for DIY NextAuth)

---

## Future: DID Integration (Phase 5+)

### Phase 5.1: Wallet Auth Provider

**Add Solana wallet authentication to Ory:**

Approach: Custom Ory Kratos authentication strategy

**Wallet login flow:**
1. User connects Phantom/Solflare wallet
2. Frontend requests challenge message from backend
3. User signs message with wallet
4. Backend verifies signature
5. Backend creates/updates Ory identity with wallet_address trait
6. Backend creates local user with DID

**Implementation:**
```typescript
// lib/auth/wallet-verification.ts
import { PublicKey } from '@solana/web3.js';
import nacl from 'tweetnacl';
import bs58 from 'bs58';
import { kratosAdmin } from './kratos';
import { db } from '@/db';
import { users } from '@/db/schema-auth';

export async function verifyWalletAndCreateIdentity(
  walletAddress: string,
  signature: string,
  message: string
) {
  // Verify signature
  const pubKey = new PublicKey(walletAddress);
  const messageBytes = new TextEncoder().encode(message);
  const signatureBytes = bs58.decode(signature);

  const isValid = nacl.sign.detached.verify(
    messageBytes,
    signatureBytes,
    pubKey.toBytes()
  );

  if (!isValid) {
    throw new Error('Invalid signature');
  }

  // Check message timestamp (prevent replay attacks)
  const timestamp = parseInt(message.split(':')[1]);
  const now = Date.now();
  if (now - timestamp > 60000) { // 1 minute expiry
    throw new Error('Message expired');
  }

  // Create or update Ory identity
  const did = `did:sol:${walletAddress}`;

  // Check if identity exists
  let identity;
  try {
    const { data: identities } = await kratosAdmin.listIdentities({
      credentialsIdentifier: walletAddress,
    });
    identity = identities[0];
  } catch (error) {
    // Create new identity
    const { data } = await kratosAdmin.createIdentity({
      createIdentityBody: {
        schema_id: 'default',
        traits: {
          wallet_address: walletAddress,
          did,
          role: 'customer',
        },
        state: 'active',
      },
    });
    identity = data;
  }

  // Create or update local user
  const user = await db
    .insert(users)
    .values({
      kratosId: identity.id,
      walletAddress,
      did,
      role: 'customer',
    })
    .onConflictDoUpdate({
      target: users.kratosId,
      set: {
        walletAddress,
        did,
        updatedAt: new Date(),
      },
    })
    .returning();

  return { identity, user: user[0] };
}
```

**Link wallet to existing account:**
```typescript
// lib/auth/link-wallet.ts
export async function linkWalletToUser(
  kratosId: string,
  walletAddress: string,
  signature: string,
  message: string
) {
  // Verify signature (same as above)
  // ...

  // Check if wallet already linked
  const existing = await db.query.users.findFirst({
    where: eq(users.walletAddress, walletAddress),
  });

  if (existing && existing.kratosId !== kratosId) {
    throw new Error('Wallet already linked to another account');
  }

  // Update Ory identity traits
  const did = `did:sol:${walletAddress}`;
  const { data: identity } = await kratosAdmin.getIdentity({ id: kratosId });

  await kratosAdmin.updateIdentity({
    id: kratosId,
    updateIdentityBody: {
      traits: {
        ...identity.traits,
        wallet_address: walletAddress,
        did,
      },
    },
  });

  // Update local user
  await db
    .update(users)
    .set({
      walletAddress,
      did,
      updatedAt: new Date(),
    })
    .where(eq(users.kratosId, kratosId));
}
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

// In Ory session enrichment
async function enrichSession(kratosSession: Session) {
  const walletAddress = kratosSession.identity.traits.wallet_address;
  if (walletAddress) {
    const isFounder = await isFounderEditionHolder(walletAddress);
    return { ...kratosSession, isFounder };
  }
  return kratosSession;
}
```

---

## Migration Path: Email Auth → DID Auth

### Step-by-Step User Experience

**Today (Phase 4.4):**
1. User signs up with email/password via Ory
2. User shops, checks out, views order history
3. User exists in Ory Kratos + local shadow table

**Future (Phase 5+):**
1. User goes to account settings
2. Clicks "Link Solana Wallet"
3. Connects Phantom/Solflare wallet
4. Signs message to prove ownership
5. Wallet address and DID saved to Ory identity traits + local user record
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

### Password Security (Managed by Ory)

- Ory uses Argon2id password hashing (stronger than bcrypt)
- Configurable password policies
- Built-in breach detection
- Rate limiting on login attempts
- Brute force protection

### Session Security

**Ory session cookies:**
- HTTP-only cookies (prevent XSS)
- Secure flag (HTTPS only)
- SameSite=Lax (CSRF protection)
- Configurable session lifetime (default: 30 days)
- Session invalidation on logout
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
- Timestamp validation (1-minute window)

---

## Email Service Setup

**Options:**
- **SendGrid:** Free tier (100 emails/day), scalable ($19.95/month for 50K emails)
- **Resend:** $20/month for 10K emails, great DX
- **Postmark:** $15/month for 10K emails, transactional focus
- **AWS SES:** Cheapest ($0.10 per 1K emails), more setup

**Recommendation:** Start with **SendGrid** (free tier for dev, easy SMTP relay with Ory).

**Ory Courier handles:**
- Email verification
- Password recovery
- Account settings changes
- Custom email templates (Go templates)

---

## Environment Variables

```bash
# Ory Kratos
KRATOS_PUBLIC_URL=http://localhost:4433
KRATOS_ADMIN_URL=http://localhost:4434
KRATOS_SECRET=<generate with: openssl rand -base64 32>

# SendGrid SMTP
SMTP_CONNECTION_URI=smtps://apikey:YOUR_SENDGRID_API_KEY@smtp.sendgrid.net:465
EMAIL_FROM=noreply@imajin.ca
EMAIL_FROM_NAME=Imajin

# App
NEXT_PUBLIC_BASE_URL=http://localhost:30000

# Future: Solana (Phase 5+)
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
SOLANA_CLUSTER=mainnet-beta
```

---

## Testing Strategy

### Unit Tests

**Test coverage:**
- Session helpers (getSession, requireAuth, requireAdmin)
- Guard functions (requireAuth, requireAdminWithMFA)
- DID generation/validation (future)
- Wallet signature verification (future)

### Integration Tests

**Test flows:**
- Sign up with email/password (Ory flow)
- Sign in with email/password (Ory flow)
- Sign out (Ory logout)
- Password reset (Ory recovery flow)
- Email verification (Ory verification flow)
- MFA setup (Ory settings flow)
- Protected route access
- Role-based access control
- Admin MFA enforcement
- Webhook identity sync

### E2E Tests (Playwright)

**User flows:**
- New user signs up and checks out
- Returning user signs in and views orders
- Admin signs in and accesses admin panel
- User resets forgotten password
- Admin enables MFA and accesses protected routes

---

## Success Criteria

**Phase 4.4 Complete When:**
- [ ] Users can sign up with email/password via Ory
- [ ] Users can sign in and sign out via Ory
- [ ] Users can reset forgotten passwords via Ory
- [ ] Email verification works via Ory Courier
- [ ] Users can enable optional MFA (TOTP)
- [ ] Admin accounts require MFA
- [ ] Users can view order history
- [ ] Cart persists across sessions
- [ ] Admin routes protected by role check + MFA
- [ ] Local users table synced via webhooks
- [ ] All auth tests passing
- [ ] Documentation complete

**Future DID Integration Ready When:**
- [ ] Ory identity schema supports DID fields
- [ ] Local users table supports wallet_address, did, public_key
- [ ] No breaking changes required for DID migration
- [ ] Users can link wallet to existing account
- [ ] Verifiable credentials can be stored in JSONB

---

## Timeline Estimate

**Phase 4.4 (Ory Kratos Auth):** 13 hours
- Database schema: 2 hours
- Ory Kratos setup: 4 hours
- UI components: 2.5 hours
- Protected routes: 3 hours
- Integration: 1.5 hours
- SendGrid email: 2 hours
- Testing: 3 hours

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
1. **Ory identity schema is DID-ready** (nullable wallet/DID fields in traits)
2. **Local shadow table ready** (wallet_address, did, public_key columns)
3. **Extensible architecture** (can add custom wallet auth flow to Ory)
4. **No breaking changes** when migrating to DID
5. **Self-hosted and open** (aligns with philosophy)
6. **Progressive enhancement** (email today, wallet tomorrow)

**Next Steps:**
1. Begin Phase 4.4 implementation (Ory Kratos)
2. Test thoroughly (unit, integration, E2E)
3. Document for users and developers
4. Plan Phase 5.1 (wallet auth) when ready

---

**See Also:**
- `docs/tasks/Phase 4.4 - Authentication.md` - Main implementation plan
- `docs/tasks/Phase 4.4.1 - Database Schema.md` - Users table design
- `docs/tasks/Phase 4.4.2 - Ory Kratos Setup.md` - Docker and identity schema
- `docs/tasks/Phase 5.1 - Wallet Authentication & DID Integration.md` - Future wallet auth
- `https://github.com/ima-jin/imajin-token/blob/main/layer-2-identity/IDENTITY_LAYER.md` - DID/VC architecture
- `https://github.com/ima-jin/imajin-token/blob/main/layer-2-identity/IMAJIN_OS_SPEC.md` - Personal AI agent spec
- `https://github.com/ima-jin/imajin-token/blob/main/architecture/SECURITY.md` - Key management and recovery
- Ory Kratos Documentation: https://www.ory.sh/docs/kratos/
