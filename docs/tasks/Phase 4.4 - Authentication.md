# Phase 4.4: Authentication Implementation

**Status:** Ready for Implementation 🟡
**Estimated Effort:** 13 hours
**Dependencies:** Phase 2.5.2.1 complete (orders, checkout flow)
**Next Phase:** Phase 4.5 (Admin Tools)

**Reviews:**
- ✅ **Dr. Clean** (2025-11-19): Documentation reviewed. Ory Kratos implementation consistent across all sub-phases. No NextAuth remnants found. Minor phase description fixes applied. Trust hub scope clarified. Grade: A-. **APPROVED**
- ✅ **Dr. Testalot** (2025-11-19): Test strategy approved. Coverage targets achievable (70% realistic). Test structure excellent. Grade: A-. Test count clarified (35 core, 50 extended). TDD workflow, webhook edge cases, and email verification E2E documented. **APPROVED WITH RECOMMENDATIONS**

---

## Overview

Implement authentication using **Ory Kratos** (open-source identity provider) with email/password, designed to evolve to DID/wallet auth without breaking changes.

**Philosophy Alignment:**
- ✅ Self-hosted (no vendor lock-in)
- ✅ No subscriptions
- ✅ No big tech OAuth (skip Google/GitHub)
- ✅ DID-ready schema (wallet auth path)
- ✅ SendGrid for email (via Ory SMTP)
- ✅ Enterprise-grade security (MFA, rate limiting, brute force protection)

**Why Ory Kratos:**
- Battle-tested OAuth2/OIDC provider
- Self-hosted, open-source (Apache 2.0)
- Built-in MFA (TOTP), email verification, password reset
- Security hardening (rate limiting, brute force protection)
- DID-ready (custom identity schemas)
- Saves 10-15 hours vs building from scratch
- Offloads security maintenance to Ory project

**Why Now:**
- Blocks CRM features (customer tracking, order history)
- Blocks user dashboard (my orders, profile)
- Blocks admin panel (user management)
- Cart persistence across sessions

---

## Architecture Decisions

### Auth Provider: Ory Kratos

**Components:**
- ✅ **Ory Kratos** - Identity management (signup, login, MFA, recovery)
- ✅ **Local users table** - Shadow of Ory identities + app-specific fields
- ✅ **Ory SDK** - Direct integration (no NextAuth.js wrapper)

**Why Direct Ory SDK (not NextAuth.js):**
- Ory already handles sessions, cookies, CSRF
- NextAuth.js designed for OAuth providers, not wrapping another identity system
- Less code to maintain
- Lighter weight

**Selected Auth Methods:**
- ✅ **Email/password** (Ory credentials) - Today
- ✅ **Wallet** (Solana) - Future (Phase 5+)
- ❌ **OAuth** (Google/GitHub) - Doesn't align with philosophy

### Database Schema

**Shadow Pattern:**
```
Ory Kratos Identity (external)
    ↓ (webhook sync)
users.kratos_id (local shadow)
    ↓ (FK constraint)
orders.user_id
```

**Local users table includes:**
- `kratos_id` - Links to Ory identity
- `email`, `name`, `role` - Denormalized from Ory
- `wallet_address`, `did`, `public_key` - DID-ready (nullable)
- `metadata` - App-specific fields

**What Ory Manages (NOT in local DB):**
- ❌ Password hashes
- ❌ Sessions
- ❌ Verification tokens
- ❌ MFA credentials

### MFA Requirements

**Admin accounts:** MFA required (TOTP)
**Customer accounts:** MFA optional (user can enable)
**Enforcement:** Middleware checks `authenticator_assurance_level`

---

## Implementation Phases

### Phase 4.4.1: Database Schema (2 hours)

**Create simplified users table with kratos_id field**

- Create `db/schema-auth.ts` with users table
- Generate migration
- Add `user_id` to orders table
- Create seed script (creates Ory identity + local user)

**Deliverables:**
- Users table with kratos_id, email, name, role
- DID-ready fields (wallet_address, did, public_key) - nullable
- Metadata JSONB for app-specific data
- orders.user_id column (nullable for guest checkout)

**See:** [Phase 4.4.1 - Database Schema.md](./Phase%204.4.1%20-%20Database%20Schema.md)

---

### Phase 4.4.2: Ory Kratos Setup (4 hours)

**Set up Ory Kratos Docker container with identity schema**

- Docker compose for Kratos + PostgreSQL
- Identity schema with email + wallet/DID fields
- SendGrid SMTP configuration (via Ory Courier)
- Webhook configuration (identity sync)
- Environment variables

**Deliverables:**
- `docker/docker-compose.auth.yml`
- `config/kratos/kratos.yml`
- `config/kratos/identity.schema.json`
- Kratos running on ports 4433 (public) and 4434 (admin)

**See:** [Phase 4.4.2 - Ory Kratos Setup.md](./Phase%204.4.2%20-%20Ory%20Kratos%20Setup.md)

---

### Phase 4.4.3: Auth UI Components (2.5 hours)

**Build UI for Ory self-service flows**

- Reusable `OryFlowForm` component
- Sign in page (Ory login flow)
- Sign up page (Ory registration flow)
- Recovery page (password reset flow)
- Verification page (email verification flow)
- Settings page (MFA setup flow)
- MFA required page (admin enforcement)
- Error page

**Deliverables:**
- Dynamic form renderer for Ory flows
- All auth pages using Ory SDK
- User navigation dropdown
- Styled with design system

**See:** [Phase 4.4.3 - Auth UI Components.md](./Phase%204.4.3%20-%20Auth%20UI%20Components.md)

---

### Phase 4.4.4: Protected Routes & Middleware (3 hours)

**Implement route protection with Ory session validation**

- Middleware with Ory session checking
- Guard functions (requireAuth, requireAdmin, requireAdminWithMFA)
- Session helpers (getSession, getLocalUserId)
- Role-based access control
- MFA enforcement for admin routes (AAL2)

**Deliverables:**
- `middleware.ts` - Protects /admin and /account routes
- `lib/auth/guards.ts` - Server-side guards
- `lib/auth/session.ts` - Session helpers
- `lib/auth/kratos.ts` - Ory SDK clients

**See:** [Phase 4.4.4 - Protected Routes & Middleware.md](./Phase%204.4.4%20-%20Protected%20Routes%20%26%20Middleware.md)

---

### Phase 4.4.5: Integration with Existing Features (1.5 hours)

**Link auth to orders, account pages**

- Update checkout to link orders to users
- Create account dashboard page
- Create order history page
- Pre-fill checkout form for authenticated users
- Backfill existing orders by email match

**Deliverables:**
- Account dashboard showing user info
- Order history page (user's orders only)
- Checkout integration (authenticated users)
- Backfill script

**See:** [Phase 4.4.5 - Integration with Existing Features.md](./Phase%204.4.5%20-%20Integration%20with%20Existing%20Features.md)

---

### Phase 4.4.6: SendGrid Email Integration (2 hours)

**Configure Ory Kratos to send emails via SendGrid SMTP**

- Ory Courier SMTP configuration
- Email templates (verification, recovery)
- Go template syntax (.gotmpl files)
- Branded email styling

**Deliverables:**
- Ory SMTP configuration in kratos.yml
- Email templates (HTML + plaintext)
- SendGrid sender verification
- Email testing

**See:** [Phase 4.4.6 - SendGrid Email Integration.md](./Phase%204.4.6%20-%20SendGrid%20Email%20Integration.md)

---

### Phase 4.4.7: Testing (3 hours)

**Comprehensive testing for Ory integration**

- Unit tests (session helpers, guards)
- Integration tests (webhook sync, middleware)
- E2E tests (Ory self-service flows)
- Test helpers (Ory identity creation)

**Deliverables:**
- >80 tests covering auth integration
- >70% code coverage for auth modules
- Webhook sync tests
- MFA enforcement tests
- E2E flows (registration, login, recovery, settings)

**See:** [Phase 4.4.7 - Testing.md](./Phase%204.4.7%20-%20Testing.md)

---

## Success Criteria

**Phase 4.4 Complete When:**
- ✅ Ory Kratos running in Docker
- ✅ Users can sign up with email/password
- ✅ Users can sign in and sign out
- ✅ Users can reset forgotten passwords
- ✅ Email verification works (SendGrid via Ory)
- ✅ Users can enable optional MFA (TOTP)
- ✅ Admin accounts require MFA (enforced in middleware)
- ✅ Users can view order history
- ✅ Admin routes protected by role + MFA check
- ✅ Local users table synced via webhooks
- ✅ All tests passing (unit, integration, E2E)
- ✅ Documentation complete

**DID-Ready When:**
- ✅ Identity schema supports wallet/DID fields
- ✅ Users table has wallet_address, did, public_key columns
- ✅ No breaking changes needed for wallet auth
- ✅ Users can link wallet to existing account (Phase 5)

---

## Environment Setup

**Required Environment Variables:**
```bash
# Ory Kratos
KRATOS_PUBLIC_URL=http://localhost:4433
KRATOS_ADMIN_URL=http://localhost:4434

# SendGrid
SMTP_CONNECTION_URI=smtps://apikey:YOUR_SENDGRID_API_KEY@smtp.sendgrid.net:465
EMAIL_FROM=noreply@imajin.ca
EMAIL_FROM_NAME=Imajin

# App
NEXT_PUBLIC_BASE_URL=http://localhost:30000
```

**Start Ory Kratos:**
```bash
docker-compose -f docker/docker-compose.auth.yml up -d

# Check health
curl http://localhost:4433/health/ready
curl http://localhost:4434/health/ready
```

**Run Migrations & Seeds:**
```bash
npm run db:migrate
npm run seed:users  # Creates admin@imajin.ca + test customer
```

---

## Admin User

**Seed script creates:**
- Email: `admin@imajin.ca`
- Password: Set via `ADMIN_PASSWORD` env var (default: `AdminPassword123!`)
- Role: `admin`
- MFA: Required for /admin access

---

## Timeline

**Total Estimated: 13 hours** (reduced from 27 hours with DIY NextAuth)

| Phase | Task | Time |
|-------|------|------|
| 4.4.1 | Database Schema | 2h |
| 4.4.2 | Ory Kratos Setup | 4h |
| 4.4.3 | Auth UI Components | 2.5h |
| 4.4.4 | Protected Routes & Middleware | 3h |
| 4.4.5 | Integration | 1.5h |
| 4.4.6 | SendGrid Email | 2h |
| 4.4.7 | Testing | 3h |

**Time Savings vs DIY:**
- DIY NextAuth: ~20-25 hours
- Ory Kratos: ~13 hours
- **Net savings: 7-12 hours**

**Why Ory is Faster:**
- No password hashing code
- No session management code
- No token cleanup jobs
- No MFA implementation (built-in)
- No rate limiting code (built-in)
- No email sending infrastructure

---

## Dependencies

**NPM Packages:**
```bash
npm install @ory/client
```

**Docker:**
- Ory Kratos v1.1
- PostgreSQL 16 (for Kratos)

**SendGrid:**
- Free tier: 100 emails/day
- Paid: $19.95/month for 50K emails

---

## Risk Mitigation

**Email deliverability:**
- Use SendGrid verified sender
- Configure SPF/DKIM records
- Test with multiple email providers

**Webhook sync lag:**
- On-demand user creation fallback in session helper
- Handles race condition gracefully

**Session security:**
- HTTPS only in production
- HTTP-only cookies (Ory default)
- CSRF protection (built into Ory)
- SameSite=Lax cookie attribute

**MFA lockout:**
- Recovery codes (Ory feature)
- Admin can disable MFA via admin API

---

## Future Enhancements (Phase 5+)

**Phase 5.1: Wallet Auth**
- Add custom Solana identity provider to Ory
- Sign-in with wallet signature
- Link wallet to existing account

**Phase 5.2: DID Integration**
- Generate W3C DIDs for users
- Store DID in identity traits
- Implement DID resolution

**Phase 5.3: Verifiable Credentials**
- Store VCs in user metadata
- Verify credential signatures
- Display verified badges

**Phase 5.4: Social Recovery**
- Shamir's Secret Sharing for key recovery
- Trusted contacts
- Time-locked recovery

---

## See Also

- [Phase 4.4.1 - Database Schema.md](./Phase%204.4.1%20-%20Database%20Schema.md)
- [Phase 4.4.2 - Ory Kratos Setup.md](./Phase%204.4.2%20-%20Ory%20Kratos%20Setup.md)
- [Phase 4.4.3 - Auth UI Components.md](./Phase%204.4.3%20-%20Auth%20UI%20Components.md)
- [Phase 4.4.4 - Protected Routes & Middleware.md](./Phase%204.4.4%20-%20Protected%20Routes%20%26%20Middleware.md)
- [Phase 4.4.5 - Integration with Existing Features.md](./Phase%204.4.5%20-%20Integration%20with%20Existing%20Features.md)
- [Phase 4.4.6 - SendGrid Email Integration.md](./Phase%204.4.6%20-%20SendGrid%20Email%20Integration.md)
- [Phase 4.4.7 - Testing.md](./Phase%204.4.7%20-%20Testing.md)
- [AUTH_STRATEGY.md](../AUTH_STRATEGY.md) (if exists)
- Ory Kratos Documentation: https://www.ory.sh/docs/kratos/
