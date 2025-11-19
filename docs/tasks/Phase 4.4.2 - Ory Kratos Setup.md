# Phase 4.4.2: Ory Kratos Setup

**Status:** Ready for Implementation 🟡
**Estimated Effort:** 4 hours
**Dependencies:** Phase 4.4.1 complete (users table exists)
**Next Phase:** Phase 4.4.3 (Auth UI Components)

---

## Overview

Set up Ory Kratos identity provider with Docker, configure identity schema for DID-readiness, and integrate with SendGrid for email delivery. Ory Kratos will manage all authentication (passwords, sessions, verification) while our local database stores user metadata.

**Key Decisions:**
- ✅ Self-hosted Ory Kratos (Docker)
- ✅ Email/password authentication (no OAuth)
- ✅ SendGrid SMTP for emails
- ✅ Custom identity schema (role, DID fields)
- ✅ Webhook integration for identity sync

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│ Ory Kratos (Docker)                             │
│ ├─ Public API (4433) - Self-service flows      │
│ ├─ Admin API (4434) - Identity management      │
│ ├─ PostgreSQL - Identity storage               │
│ └─ SendGrid SMTP - Email delivery              │
└─────────────────────────────────────────────────┘
           ↓ (webhooks)
┌─────────────────────────────────────────────────┐
│ Next.js App                                      │
│ ├─ /api/auth/webhook - Identity sync handler   │
│ ├─ db/users table - Local shadow               │
│ └─ Ory SDK - Session checking                  │
└─────────────────────────────────────────────────┘
```

**What Ory Manages:**
- ✅ Password hashing (bcrypt)
- ✅ Sessions (cookies, expiry)
- ✅ Email verification tokens
- ✅ Password reset tokens
- ✅ MFA credentials (TOTP secrets)
- ✅ CSRF protection
- ✅ Rate limiting
- ✅ Brute force protection

**What We Manage:**
- ✅ Local users table (shadow)
- ✅ App-specific metadata
- ✅ Role-based access control
- ✅ DID/wallet fields (future)

---

## Dependencies

### NPM Packages

```bash
npm install @ory/client
```

**Version:** Latest stable (@ory/client)

### Docker Images

- `oryd/kratos:v1.1` - Ory Kratos identity server
- `postgres:16` - PostgreSQL for Kratos

---

## Docker Configuration

### File: `docker/docker-compose.auth.yml`

```yaml
version: '3.8'

services:
  kratos:
    image: oryd/kratos:v1.1
    container_name: imajin-kratos
    ports:
      - "4433:4433" # Public API
      - "4434:4434" # Admin API
    environment:
      - DSN=postgres://kratos:kratos_password@kratos-db:5432/kratos?sslmode=disable
      - LOG_LEVEL=info
    volumes:
      - ../config/kratos:/etc/config/kratos:ro
    command: serve -c /etc/config/kratos/kratos.yml --watch-courier
    depends_on:
      - kratos-db
    networks:
      - imajin-net
    restart: unless-stopped

  kratos-db:
    image: postgres:16
    container_name: imajin-kratos-db
    environment:
      - POSTGRES_USER=kratos
      - POSTGRES_PASSWORD=kratos_password
      - POSTGRES_DB=kratos
    volumes:
      - kratos-db-data:/var/lib/postgresql/data
    networks:
      - imajin-net
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U kratos"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  kratos-db-data:
    driver: local

networks:
  imajin-net:
    driver: bridge
```

**Ports:**
- `4433` - Public API (self-service flows for users)
- `4434` - Admin API (identity management, internal only)

**Volumes:**
- `/etc/config/kratos` - Configuration files (kratos.yml, schemas)
- `kratos-db-data` - PostgreSQL data persistence

---

## Kratos Configuration

### File: `config/kratos/kratos.yml`

```yaml
version: v0.13.0

# Database connection
dsn: postgres://kratos:kratos_password@kratos-db:5432/kratos?sslmode=disable

# Server configuration
serve:
  public:
    base_url: http://localhost:4433
    cors:
      enabled: true
      allowed_origins:
        - http://localhost:30000
      allowed_methods:
        - POST
        - GET
        - PUT
        - PATCH
        - DELETE
      allowed_headers:
        - Authorization
        - Content-Type
        - Cookie
      exposed_headers:
        - Content-Type
        - Set-Cookie
  admin:
    base_url: http://localhost:4434

# Self-service flows
selfservice:
  default_browser_return_url: http://localhost:30000/
  allowed_return_urls:
    - http://localhost:30000

  flows:
    # Registration flow
    registration:
      enabled: true
      ui_url: http://localhost:30000/auth/signup
      lifespan: 10m
      after:
        password:
          hooks:
            - hook: session
            - hook: web_hook
              config:
                url: http://host.docker.internal:30000/api/auth/webhook
                method: POST
                body: file:///etc/config/kratos/webhook.body.jsonnet
                auth:
                  type: api_key
                  config:
                    name: X-Webhook-Secret
                    value: your-webhook-secret-change-me
                    in: header

    # Login flow
    login:
      enabled: true
      ui_url: http://localhost:30000/auth/signin
      lifespan: 10m
      after:
        password:
          hooks:
            - hook: require_verified_address

    # Verification flow
    verification:
      enabled: true
      ui_url: http://localhost:30000/auth/verify
      use: code
      lifespan: 24h
      after:
        default_browser_return_url: http://localhost:30000/account

    # Recovery flow (password reset)
    recovery:
      enabled: true
      ui_url: http://localhost:30000/auth/recovery
      use: code
      lifespan: 1h
      after:
        default_browser_return_url: http://localhost:30000/auth/signin

    # Settings flow (profile, MFA)
    settings:
      enabled: true
      ui_url: http://localhost:30000/auth/settings
      privileged_session_max_age: 15m
      required_aal: highest_available

    # Logout flow
    logout:
      after:
        default_browser_return_url: http://localhost:30000/

# Session configuration
session:
  cookie:
    domain: localhost
    path: /
    same_site: Lax
    persistent: true
  lifespan: 720h # 30 days
  whoami:
    required_aal: aal1

# Identity schema
identity:
  default_schema_id: default
  schemas:
    - id: default
      url: file:///etc/config/kratos/identity.schema.json

# Courier (email delivery)
courier:
  smtp:
    connection_uri: smtps://apikey:YOUR_SENDGRID_API_KEY@smtp.sendgrid.net:465
    from_address: noreply@imajin.ca
    from_name: Imajin

# Password settings
selfservice:
  methods:
    password:
      enabled: true
      config:
        min_password_length: 10
        identifier_similarity_check_enabled: true
        haveibeenpwned_enabled: false # Optional: check against leaked passwords
    totp:
      enabled: true
      config:
        issuer: Imajin

# Secrets (change in production!)
secrets:
  cookie:
    - PLEASE-CHANGE-ME-COOKIE-SECRET-32-CHARS-MIN
  cipher:
    - PLEASE-CHANGE-ME-CIPHER-SECRET-32-CHARS-MIN

# Logging
log:
  level: info
  format: json
```

**Key Configuration Points:**
- `ui_url` - Points to Next.js app pages (not Ory's default UI)
- `web_hook` - Sends identity events to Next.js webhook handler
- `smtp` - SendGrid configuration for email delivery
- `min_password_length: 10` - Password requirements
- `totp` - MFA support (optional for users, required for admin)
- `require_verified_address` - Users must verify email before accessing app

---

## Identity Schema

### File: `config/kratos/identity.schema.json`

**DID-ready schema with role and wallet fields**

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
          "minLength": 3,
          "maxLength": 320,
          "ory.sh/kratos": {
            "credentials": {
              "password": {
                "identifier": true
              }
            },
            "verification": {
              "via": "email"
            },
            "recovery": {
              "via": "email"
            }
          }
        },
        "name": {
          "type": "string",
          "title": "Full Name",
          "minLength": 1,
          "maxLength": 100
        },
        "role": {
          "type": "string",
          "enum": ["customer", "admin"],
          "default": "customer",
          "title": "Role"
        },
        "wallet_address": {
          "type": "string",
          "title": "Solana Wallet Address",
          "pattern": "^[1-9A-HJ-NP-Za-km-z]{32,44}$"
        },
        "did": {
          "type": "string",
          "title": "Decentralized Identifier",
          "pattern": "^did:[a-z0-9]+:[a-zA-Z0-9._-]+$"
        },
        "public_key": {
          "type": "string",
          "title": "Public Key (Ed25519)",
          "pattern": "^[0-9a-fA-F]{64}$"
        }
      },
      "required": ["email"],
      "additionalProperties": false
    }
  }
}
```

**Schema Features:**
- `email` - Required, used for password credentials and verification
- `name` - Optional display name
- `role` - customer or admin (defaults to customer)
- `wallet_address` - Optional Solana wallet (Phase 5+)
- `did` - Optional DID (Phase 5+)
- `public_key` - Optional public key (Phase 5+)

**Validation:**
- Email format validation
- Wallet address Solana base58 format
- DID W3C format validation
- Public key hex format (64 chars = 32 bytes)

---

## Webhook Body Template

### File: `config/kratos/webhook.body.jsonnet`

```jsonnet
function(ctx) {
  type: if ctx.identity.state == 'active' then 'identity.created' else 'identity.updated',
  identity: {
    id: ctx.identity.id,
    state: ctx.identity.state,
    traits: ctx.identity.traits,
    verifiable_addresses: ctx.identity.verifiable_addresses,
    created_at: ctx.identity.created_at,
    updated_at: ctx.identity.updated_at,
  }
}
```

**Webhook Payload Example:**
```json
{
  "type": "identity.created",
  "identity": {
    "id": "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
    "state": "active",
    "traits": {
      "email": "user@example.com",
      "name": "Test User",
      "role": "customer"
    },
    "verifiable_addresses": [
      {
        "id": "...",
        "value": "user@example.com",
        "verified": false,
        "via": "email",
        "status": "pending"
      }
    ],
    "created_at": "2025-11-17T12:00:00Z",
    "updated_at": "2025-11-17T12:00:00Z"
  }
}
```

---

## Ory SDK Client

### File: `lib/auth/kratos.ts`

```typescript
import { Configuration, FrontendApi, IdentityApi } from '@ory/client';

// Public API - Used by frontend for self-service flows
export const kratosFrontend = new FrontendApi(
  new Configuration({
    basePath: process.env.KRATOS_PUBLIC_URL || 'http://localhost:4433',
    baseOptions: {
      withCredentials: true, // Important for cookies
    },
  })
);

// Admin API - Used by server for identity management
export const kratosAdmin = new IdentityApi(
  new Configuration({
    basePath: process.env.KRATOS_ADMIN_URL || 'http://localhost:4434',
  })
);
```

**Usage:**
- `kratosFrontend` - Create flows, check sessions (public API)
- `kratosAdmin` - Create/update identities, admin operations (private API)

---

## Implementation Steps

### Step 1: Create Config Directory (5 min)

- [ ] Create `config/kratos/` directory
- [ ] Create subdirectory structure if needed

### Step 2: Write Configuration Files (30 min)

- [ ] Create `config/kratos/kratos.yml`
- [ ] Create `config/kratos/identity.schema.json`
- [ ] Create `config/kratos/webhook.body.jsonnet`
- [ ] Replace placeholders (SendGrid API key, secrets)

### Step 3: Create Docker Compose (15 min)

- [ ] Create `docker/docker-compose.auth.yml`
- [ ] Configure ports, volumes, networks
- [ ] Set up environment variables
- [ ] Add health checks

### Step 4: Start Ory Kratos (15 min)

- [ ] Run `docker-compose -f docker/docker-compose.auth.yml up -d`
- [ ] Wait for containers to be healthy
- [ ] Check logs: `docker-compose -f docker/docker-compose.auth.yml logs -f kratos`
- [ ] Verify health: `curl http://localhost:4433/health/ready`

### Step 5: Verify Configuration (20 min)

- [ ] Test public API: `curl http://localhost:4433/health/ready`
- [ ] Test admin API: `curl http://localhost:4434/health/ready`
- [ ] Check identity schema loaded: `curl http://localhost:4434/admin/identities/schema`
- [ ] Verify SMTP config (check logs for errors)

### Step 6: Install Ory SDK (5 min)

- [ ] Run `npm install @ory/client`
- [ ] Verify package.json updated

### Step 7: Create SDK Client (15 min)

- [ ] Create `lib/auth/kratos.ts`
- [ ] Export kratosFrontend (public API client)
- [ ] Export kratosAdmin (admin API client)
- [ ] Test imports work

### Step 8: Configure Environment Variables (10 min)

- [ ] Add KRATOS_PUBLIC_URL to .env.local
- [ ] Add KRATOS_ADMIN_URL to .env.local
- [ ] Add SENDGRID_API_KEY to .env.local
- [ ] Add EMAIL_FROM to .env.local
- [ ] Add WEBHOOK_SECRET to .env.local
- [ ] Document in README

### Step 9: Test Kratos (45 min)

- [ ] Create test identity via admin API
- [ ] Verify identity created in Kratos DB
- [ ] Test login flow (manual browser test)
- [ ] Test verification flow (check email)
- [ ] Test recovery flow
- [ ] Verify MFA setup works

---

## Environment Variables

### File: `.env.local`

```bash
# Ory Kratos
KRATOS_PUBLIC_URL=http://localhost:4433
KRATOS_ADMIN_URL=http://localhost:4434

# SendGrid
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@imajin.ca

# Webhook security
WEBHOOK_SECRET=your-webhook-secret-change-me

# Kratos secrets (production only)
# KRATOS_COOKIE_SECRET=<generate with: openssl rand -base64 32>
# KRATOS_CIPHER_SECRET=<generate with: openssl rand -base64 32>
```

**Generate secrets:**

```bash
# Webhook secret
openssl rand -base64 32

# Kratos secrets (update kratos.yml in production)
openssl rand -base64 32
```

---

## Testing

### Health Checks

```bash
# Check Kratos public API
curl http://localhost:4433/health/ready
# Expected: {"status":"ok"}

# Check Kratos admin API
curl http://localhost:4434/health/ready
# Expected: {"status":"ok"}

# Check Kratos version
curl http://localhost:4434/version
```

### Create Test Identity

```bash
# Create identity via admin API
curl -X POST http://localhost:4434/admin/identities \
  -H "Content-Type: application/json" \
  -d '{
    "schema_id": "default",
    "traits": {
      "email": "test@example.com",
      "name": "Test User",
      "role": "customer"
    },
    "credentials": {
      "password": {
        "config": {
          "password": "TestPassword123!"
        }
      }
    },
    "state": "active",
    "verifiable_addresses": [
      {
        "value": "test@example.com",
        "verified": true,
        "via": "email"
      }
    ]
  }'
```

### List Identities

```bash
# List all identities
curl http://localhost:4434/admin/identities | jq

# Get specific identity
curl http://localhost:4434/admin/identities/{identity_id} | jq
```

### Test Email Delivery

```bash
# Trigger verification email (via registration flow)
# Check Kratos logs for SMTP activity
docker-compose -f docker/docker-compose.auth.yml logs -f kratos | grep smtp
```

### Test Browser Flows

```bash
# Start app
npm run dev

# Try registration (will create flow)
open http://localhost:30000/auth/signup

# Try login (will create flow)
open http://localhost:30000/auth/signin
```

---

## Acceptance Criteria

- [ ] Ory Kratos containers running and healthy
- [ ] Public API (4433) responds to health checks
- [ ] Admin API (4434) responds to health checks
- [ ] Identity schema loaded successfully
- [ ] Can create identity via admin API
- [ ] Can list identities via admin API
- [ ] SendGrid SMTP configured (check logs, no errors)
- [ ] Ory SDK installed and imports work
- [ ] Environment variables configured
- [ ] Docker volumes persist data
- [ ] Can restart containers without data loss

---

## Troubleshooting

**Containers won't start:**
```bash
# Check logs
docker-compose -f docker/docker-compose.auth.yml logs

# Check PostgreSQL
docker-compose -f docker/docker-compose.auth.yml logs kratos-db

# Verify DSN in kratos.yml matches PostgreSQL credentials
```

**"Schema not found" error:**
```bash
# Verify schema file mounted correctly
docker-compose -f docker/docker-compose.auth.yml exec kratos ls -la /etc/config/kratos/

# Check schema syntax
cat config/kratos/identity.schema.json | jq .
```

**SMTP errors:**
```bash
# Verify SendGrid API key
curl --request POST \
  --url https://api.sendgrid.com/v3/mail/send \
  --header "Authorization: Bearer $SENDGRID_API_KEY" \
  --header 'Content-Type: application/json' \
  --data '{"personalizations":[{"to":[{"email":"your@email.com"}]}],"from":{"email":"noreply@imajin.ca"},"subject":"Test","content":[{"type":"text/plain","value":"Test"}]}'

# Check Kratos courier logs
docker-compose -f docker/docker-compose.auth.yml logs kratos | grep courier
```

**Webhook not firing:**
```bash
# Verify webhook URL in kratos.yml
# host.docker.internal should resolve to host machine
# Check Next.js app logs for webhook POST requests

# Test webhook endpoint directly
curl -X POST http://localhost:30000/api/auth/webhook \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: your-webhook-secret" \
  -d '{"type":"identity.created","identity":{"id":"test"}}'
```

**Can't create identity:**
```bash
# Check schema validation
curl http://localhost:4434/admin/identities/schema

# Verify traits match schema
# Common issue: missing required fields (email)
```

---

## Security Considerations

### Secrets Management

**Development:**
- Secrets in kratos.yml (acceptable for dev)
- Webhook secret in .env.local

**Production:**
- Use environment variables for Kratos secrets
- Store SendGrid API key in secrets manager
- Rotate webhook secret regularly
- Use strong random secrets (32+ bytes)

### Network Security

**Docker Network:**
- Kratos and Kratos DB on private network
- Only expose necessary ports (4433, 4434)
- Use firewall rules in production

**API Access:**
- Admin API (4434) should NOT be publicly accessible
- Only Next.js app should access admin API
- Use API gateway or VPN in production

### Password Security

**Ory Kratos handles:**
- ✅ bcrypt hashing (automatic)
- ✅ Salt generation (automatic)
- ✅ Timing attack prevention (automatic)
- ✅ Password strength enforcement (configured)

### Session Security

**Ory Kratos handles:**
- ✅ HTTP-only cookies (automatic)
- ✅ Secure flag (automatic in production)
- ✅ SameSite=Lax (configured)
- ✅ CSRF protection (automatic)

---

## Next Steps

After Phase 4.4.2 complete:
1. **Phase 4.4.3:** Integrate Ory SDK (session helpers, webhook handler)
2. **Phase 4.4.4:** Build auth UI components (Ory self-service flows)
3. **Phase 4.4.5:** Implement protected routes (middleware)

---

## Reference Links

- [Ory Kratos Documentation](https://www.ory.sh/docs/kratos/)
- [Ory Kratos Configuration](https://www.ory.sh/docs/kratos/reference/configuration)
- [Ory Kratos Self-Service Flows](https://www.ory.sh/docs/kratos/self-service)
- [Ory SDK Reference](https://www.ory.sh/docs/kratos/sdk/overview)

---

**See Also:**
- `docs/tasks/Phase 4.4.1 - Database Schema.md` - Previous phase
- `docs/tasks/Phase 4.4.3 - Ory SDK Integration.md` - Next phase
- `docs/tasks/Phase 4.4 - Authentication.md` - Parent task
- `docs/AUTH_STRATEGY.md` - Overall strategy
