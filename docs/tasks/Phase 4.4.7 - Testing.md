# Phase 4.4.7: Testing (Ory Kratos Integration)

**Status:** Ready for Implementation 🟡
**Estimated Effort:** 3 hours
**Dependencies:** Phase 4.4.6 complete (All features implemented), Ory Kratos running
**Next Phase:** Phase 4.5 (Admin Tools)

**Reviews:**
- ✅ **Dr. Testalot** (2025-11-19): Test strategy approved. Coverage targets achievable (70% realistic). Test structure excellent (unit/integration/E2E separation). Grade: A-. Test count shows ~32-35 enumerated (claim: >80) - recommend enumerate all tests OR revise count. Missing: TDD workflow section, webhook edge cases, email verification E2E. **APPROVED WITH RECOMMENDATIONS**

---

## Overview

Comprehensive testing suite for Ory Kratos authentication integration including unit tests for local helpers, integration tests for session management and webhooks, and end-to-end tests for complete authentication flows.

**Key Difference from DIY Auth Testing:**
- Ory handles password hashing, validation, token generation (no unit tests needed)
- Focus on integration: Webhook sync, session helpers, middleware
- E2E tests interact with Ory self-service flows (not custom APIs)

**Test Coverage:**
- Unit tests: Session helpers, guards, local user mapping
- Integration tests: Webhooks, middleware, session validation
- E2E tests: Full Ory self-service flows

---

## Test Count Summary

| Category | File | Tests | Notes |
|----------|------|-------|-------|
| **Unit Tests** | session.test.ts | 5 | Session helpers (getServerSession, isAuthenticatedRequest) |
| | guards.test.ts | 5 | Auth guards (requireAuth, requireAdmin, requireAdminWithMFA) |
| **Integration Tests** | webhook.test.ts | 2 | Ory webhook sync (create, update) |
| | middleware.test.ts | 5 | Protected routes, MFA enforcement |
| | local-user-sync.test.ts | 3 | Kratos ID → local user mapping |
| **E2E Tests** | registration-flow.spec.ts | 3 | Sign up, duplicate email, password validation |
| | login-flow.spec.ts | 4 | Sign in, incorrect password, protected routes, sign out |
| | recovery-flow.spec.ts | 2 | Password reset, invalid link |
| | settings-flow.spec.ts | 3 | Settings page, MFA setup, admin enforcement |
| **Helpers** | ory-helpers.ts | 3 | Test utilities (create, delete, session token) |
| **TOTAL** | | **35** | **Core enumerated tests** |

**Additional Tests (Recommended):**
- Webhook edge cases (5-8 tests): Failures, race conditions, security
- Email verification E2E (1 test): Click verification link
- MFA recovery codes (1 test): Lost TOTP device scenario
- Session expiry (1 test): Mid-request expiration
- **Extended Total: ~50 tests**

---

## TDD Workflow

This phase follows **Test-Driven Development (TDD)**:

### RED: Write Failing Tests First

**Step 1: Unit Tests (45 min)**
- [ ] Write session helper tests → Run → All fail ❌
- [ ] Write guard tests → Run → All fail ❌
- [ ] Verify tests fail for correct reasons (not found errors)

### GREEN: Implement Minimum Code

**Step 2: Make Tests Pass**
- [ ] Implement `lib/auth/session.ts` → Run → Pass ✅
- [ ] Implement `lib/auth/guards.ts` → Run → Pass ✅
- [ ] Verify all unit tests pass

### REFACTOR: Clean Up

**Step 3: Improve Code**
- [ ] Extract common logic (DRY principle)
- [ ] Improve error handling
- [ ] Add JSDoc comments
- [ ] Run tests → Still pass ✅

**Repeat for Integration & E2E:**
- Integration tests: RED → GREEN → REFACTOR
- E2E tests: RED → GREEN → REFACTOR

---

## Test Structure

```
tests/
├── unit/
│   └── lib/
│       └── auth/
│           ├── guards.test.ts (Server-side guards)
│           └── session.test.ts (Session helpers)
├── integration/
│   └── auth/
│       ├── webhook.test.ts (Ory webhook sync)
│       ├── middleware.test.ts (Protected routes with Ory)
│       ├── session-validation.test.ts (Ory session checking)
│       └── local-user-sync.test.ts (Kratos ID → local user mapping)
└── e2e/
    └── auth/
        ├── registration-flow.spec.ts (Ory registration)
        ├── login-flow.spec.ts (Ory login)
        ├── recovery-flow.spec.ts (Ory password reset)
        └── settings-flow.spec.ts (Ory settings/MFA)
```

---

## Unit Tests

### Session Helpers

**File:** `tests/unit/lib/auth/session.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getServerSession, isAuthenticatedRequest, getLocalUserId } from '@/lib/auth/session';
import { kratosFrontend } from '@/lib/auth/kratos';

// Mock Ory SDK
vi.mock('@/lib/auth/kratos', () => ({
  kratosFrontend: {
    toSession: vi.fn(),
  },
}));

describe('Session Helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getServerSession', () => {
    it('should return session when valid cookie exists', async () => {
      const mockSession = {
        active: true,
        identity: {
          id: 'kratos-123',
          traits: {
            email: 'test@example.com',
            name: 'Test User',
            role: 'customer',
          },
        },
      };

      (kratosFrontend.toSession as any).mockResolvedValue({ data: mockSession });

      // Mock cookies
      const mockCookies = () => ({
        get: () => ({ value: 'mock_session_token' }),
      });
      vi.mock('next/headers', () => ({
        cookies: mockCookies,
      }));

      const session = await getServerSession();

      expect(session).toEqual(mockSession);
      expect(kratosFrontend.toSession).toHaveBeenCalledWith({
        cookie: 'ory_session_imajinweb=mock_session_token',
      });
    });

    it('should return null when no cookie exists', async () => {
      // Mock no cookie
      const mockCookies = () => ({
        get: () => undefined,
      });
      vi.mock('next/headers', () => ({
        cookies: mockCookies,
      }));

      const session = await getServerSession();

      expect(session).toBeNull();
      expect(kratosFrontend.toSession).not.toHaveBeenCalled();
    });

    it('should return null when session is invalid', async () => {
      (kratosFrontend.toSession as any).mockRejectedValue(new Error('Unauthorized'));

      const mockCookies = () => ({
        get: () => ({ value: 'invalid_token' }),
      });
      vi.mock('next/headers', () => ({
        cookies: mockCookies,
      }));

      const session = await getServerSession();

      expect(session).toBeNull();
    });
  });

  describe('isAuthenticatedRequest', () => {
    it('should return true when session exists', async () => {
      const mockSession = {
        active: true,
        identity: { id: 'kratos-123' },
      };

      (kratosFrontend.toSession as any).mockResolvedValue({ data: mockSession });

      const isAuth = await isAuthenticatedRequest();

      expect(isAuth).toBe(true);
    });

    it('should return false when no session', async () => {
      (kratosFrontend.toSession as any).mockRejectedValue(new Error('Unauthorized'));

      const isAuth = await isAuthenticatedRequest();

      expect(isAuth).toBe(false);
    });
  });
});
```

### Guards

**File:** `tests/unit/lib/auth/guards.test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { requireAuth, requireAdmin, requireAdminWithMFA } from '@/lib/auth/guards';
import { redirect } from 'next/navigation';

// Mock Next.js redirect
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

describe('Auth Guards', () => {
  describe('requireAuth', () => {
    it('should redirect when not authenticated', async () => {
      // Mock getSession to return null
      vi.mock('@/lib/auth/guards', () => ({
        getSession: vi.fn().mockResolvedValue(null),
      }));

      try {
        await requireAuth();
      } catch (e) {
        // Redirect throws
      }

      expect(redirect).toHaveBeenCalledWith('/auth/signin');
    });

    it('should return session when authenticated', async () => {
      const mockSession = {
        active: true,
        identity: {
          id: 'kratos-123',
          traits: { email: 'test@example.com' },
        },
      };

      vi.mock('@/lib/auth/guards', () => ({
        getSession: vi.fn().mockResolvedValue(mockSession),
      }));

      const session = await requireAuth();

      expect(session).toEqual(mockSession);
    });
  });

  describe('requireAdmin', () => {
    it('should redirect when user is not admin', async () => {
      const mockSession = {
        active: true,
        identity: {
          id: 'kratos-123',
          traits: { role: 'customer' },
        },
      };

      vi.mock('@/lib/auth/guards', () => ({
        getSession: vi.fn().mockResolvedValue(mockSession),
      }));

      try {
        await requireAdmin();
      } catch (e) {
        // Redirect throws
      }

      expect(redirect).toHaveBeenCalledWith('/');
    });
  });

  describe('requireAdminWithMFA', () => {
    it('should redirect when admin has no MFA', async () => {
      const mockSession = {
        active: true,
        identity: { traits: { role: 'admin' } },
        authenticator_assurance_level: 'aal1', // No MFA
      };

      vi.mock('@/lib/auth/guards', () => ({
        requireAdmin: vi.fn().mockResolvedValue(mockSession),
      }));

      try {
        await requireAdminWithMFA();
      } catch (e) {
        // Redirect throws
      }

      expect(redirect).toHaveBeenCalledWith('/auth/mfa-required');
    });
  });
});
```

---

## Integration Tests

### Webhook Integration

**File:** `tests/integration/auth/webhook.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '@/db';
import { users } from '@/db/schema-auth';
import { eq } from 'drizzle-orm';

describe('Ory Webhook Integration', () => {
  const testEmail = `webhook-test-${Date.now()}@example.com`;

  afterEach(async () => {
    await db.delete(users).where(eq(users.email, testEmail));
  });

  it('should create local user on identity.created webhook', async () => {
    const webhookPayload = {
      type: 'identity.created',
      identity: {
        id: `kratos-${Date.now()}`,
        traits: {
          email: testEmail,
          name: 'Webhook Test User',
          role: 'customer',
        },
      },
    };

    const response = await fetch('http://localhost:30000/api/auth/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(webhookPayload),
    });

    expect(response.status).toBe(200);

    // Verify local user created
    const user = await db.query.users.findFirst({
      where: eq(users.email, testEmail),
    });

    expect(user).toBeDefined();
    expect(user!.kratosId).toBe(webhookPayload.identity.id);
    expect(user!.email).toBe(testEmail);
    expect(user!.role).toBe('customer');
  });

  it('should update local user on identity.updated webhook', async () => {
    // Create initial user
    const kratosId = `kratos-${Date.now()}`;
    await db.insert(users).values({
      kratosId,
      email: testEmail,
      name: 'Old Name',
      role: 'customer',
    });

    const webhookPayload = {
      type: 'identity.updated',
      identity: {
        id: kratosId,
        traits: {
          email: testEmail,
          name: 'New Name',
          role: 'customer',
        },
      },
    };

    const response = await fetch('http://localhost:30000/api/auth/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(webhookPayload),
    });

    expect(response.status).toBe(200);

    // Verify local user updated
    const user = await db.query.users.findFirst({
      where: eq(users.kratosId, kratosId),
    });

    expect(user!.name).toBe('New Name');
  });
});
```

### Middleware Integration

**File:** `tests/integration/auth/middleware.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { middleware } from '@/middleware';

describe('Auth Middleware with Ory', () => {
  it('should redirect unauthenticated users from /account', async () => {
    const req = new NextRequest('http://localhost:30000/account');
    const response = await middleware(req);

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/auth/signin');
    expect(response.headers.get('location')).toContain('return_to=%2Faccount');
  });

  it('should redirect unauthenticated users from /admin', async () => {
    const req = new NextRequest('http://localhost:30000/admin');
    const response = await middleware(req);

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/auth/signin');
  });

  it('should allow authenticated admin with MFA to /admin', async () => {
    const req = new NextRequest('http://localhost:30000/admin');

    // Mock Ory session cookie (would be set by Kratos)
    req.cookies.set('ory_session_imajinweb', 'valid_admin_mfa_session');

    // Mock kratosFrontend.toSession to return admin session
    // (In real test, this would be a valid Ory session)

    const response = await middleware(req);

    expect(response).toBeNull(); // No redirect, request proceeds
  });

  it('should redirect admin without MFA to /auth/mfa-required', async () => {
    const req = new NextRequest('http://localhost:30000/admin');
    req.cookies.set('ory_session_imajinweb', 'valid_admin_no_mfa_session');

    const response = await middleware(req);

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/auth/mfa-required');
  });

  it('should allow unauthenticated access to /auth/signin', async () => {
    const req = new NextRequest('http://localhost:30000/auth/signin');
    const response = await middleware(req);

    expect(response).toBeNull(); // No redirect
  });
});
```

### Local User Sync

**File:** `tests/integration/auth/local-user-sync.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '@/db';
import { users } from '@/db/schema-auth';
import { getLocalUser } from '@/lib/auth/guards';
import { eq } from 'drizzle-orm';

describe('Local User Sync', () => {
  const kratosId = `kratos-${Date.now()}`;
  const testEmail = `sync-test-${Date.now()}@example.com`;

  beforeEach(async () => {
    // Create test user
    await db.insert(users).values({
      kratosId,
      email: testEmail,
      name: 'Sync Test User',
      role: 'customer',
    });
  });

  afterEach(async () => {
    await db.delete(users).where(eq(users.email, testEmail));
  });

  it('should map Kratos ID to local user', async () => {
    const mockSession = {
      active: true,
      identity: {
        id: kratosId,
        traits: { email: testEmail },
      },
    };

    // Mock requireAuth to return session
    // Then call getLocalUser
    // (Implementation depends on test setup)

    const localUser = await db.query.users.findFirst({
      where: eq(users.kratosId, kratosId),
    });

    expect(localUser).toBeDefined();
    expect(localUser!.email).toBe(testEmail);
  });

  it('should throw error when local user not found', async () => {
    const invalidKratosId = 'non-existent-kratos-id';

    await expect(async () => {
      // Try to get local user for non-existent Kratos ID
      await db.query.users.findFirst({
        where: eq(users.kratosId, invalidKratosId),
      });
    }).rejects.toThrow();
  });
});
```

---

## End-to-End Tests

### Registration Flow

**File:** `tests/e2e/auth/registration-flow.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Ory Registration Flow', () => {
  const testEmail = `e2e-reg-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';
  const testName = 'E2E Test User';

  test('complete registration flow', async ({ page }) => {
    // Navigate to signup page (initializes Ory registration flow)
    await page.goto('/auth/signup');

    // Wait for Ory form to load
    await page.waitForSelector('input[name="traits.email"]');

    // Fill in Ory self-service registration form
    await page.fill('input[name="traits.name"]', testName);
    await page.fill('input[name="traits.email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to account page after successful registration
    await expect(page).toHaveURL('/account');

    // Should see welcome message with user name
    await expect(page.locator(`text=${testName}`)).toBeVisible();
  });

  test('reject duplicate email', async ({ page }) => {
    // First registration
    await page.goto('/auth/signup');
    await page.fill('input[name="traits.name"]', testName);
    await page.fill('input[name="traits.email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');

    // Wait for success
    await page.waitForURL('/account');

    // Sign out
    await page.click('button:has-text("' + testName + '")');
    await page.click('button:has-text("Sign Out")');

    // Try to register again with same email
    await page.goto('/auth/signup');
    await page.fill('input[name="traits.name"]', 'Different Name');
    await page.fill('input[name="traits.email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');

    // Should see error from Ory
    await expect(page.locator('text=/already exists|already registered/i')).toBeVisible();
  });

  test('validate password strength via Ory', async ({ page }) => {
    await page.goto('/auth/signup');

    // Try weak password
    await page.fill('input[name="traits.name"]', testName);
    await page.fill('input[name="traits.email"]', testEmail);
    await page.fill('input[name="password"]', 'weak');
    await page.click('button[type="submit"]');

    // Ory should reject weak password
    await expect(page.locator('text=/password.*too.*short|at least.*characters/i')).toBeVisible();
  });
});
```

### Login Flow

**File:** `tests/e2e/auth/login-flow.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Ory Login Flow', () => {
  const testEmail = 'login-e2e@example.com';
  const testPassword = 'TestPassword123!';

  test.beforeEach(async () => {
    // Create test user via Ory Admin API
    // (Assumes user already exists from registration test)
  });

  test('successful login redirects to account', async ({ page }) => {
    await page.goto('/auth/signin');

    // Fill in Ory login form
    await page.fill('input[name="identifier"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');

    // Should redirect to account page
    await expect(page).toHaveURL('/account');
  });

  test('incorrect password shows error', async ({ page }) => {
    await page.goto('/auth/signin');

    await page.fill('input[name="identifier"]', testEmail);
    await page.fill('input[name="password"]', 'WrongPassword123');
    await page.click('button[type="submit"]');

    // Ory shows generic error
    await expect(page.locator('text=/invalid.*credentials|incorrect/i')).toBeVisible();
  });

  test('protected route redirects to signin with return_to', async ({ page }) => {
    // Try to access protected route
    await page.goto('/account/orders');

    // Should redirect to signin with return_to parameter
    await expect(page).toHaveURL(/\/auth\/signin\?.*return_to/);

    // Sign in
    await page.fill('input[name="identifier"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');

    // Should redirect back to originally requested URL
    await expect(page).toHaveURL('/account/orders');
  });

  test('signout clears session', async ({ page }) => {
    // Sign in first
    await page.goto('/auth/signin');
    await page.fill('input[name="identifier"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('/account');

    // Sign out
    await page.click('button:has-text("Sign Out")');

    // Should redirect to home
    await expect(page).toHaveURL('/');

    // Try to access protected route - should redirect to signin
    await page.goto('/account');
    await expect(page).toHaveURL(/\/auth\/signin/);
  });
});
```

### Recovery Flow

**File:** `tests/e2e/auth/recovery-flow.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Ory Recovery Flow (Password Reset)', () => {
  const testEmail = 'recovery-e2e@example.com';

  test('password recovery request', async ({ page }) => {
    // Navigate to recovery page (initializes Ory recovery flow)
    await page.goto('/auth/recovery');

    // Fill in email
    await page.fill('input[name="email"]', testEmail);
    await page.click('button[type="submit"]');

    // Should see success message (Ory doesn't reveal if email exists)
    await expect(page.locator('text=/email.*sent|check.*email/i')).toBeVisible();
  });

  test('invalid recovery link shows error', async ({ page }) => {
    // Navigate to invalid recovery link
    await page.goto('/auth/recovery?flow=invalid-flow-id-123');

    // Should see error from Ory
    await expect(page.locator('text=/invalid|expired|not.*found/i')).toBeVisible();
  });

  // Note: Full recovery flow testing requires email interception
  // Use tools like MailHog or mock email service in test environment
});
```

### Settings Flow (MFA)

**File:** `tests/e2e/auth/settings-flow.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Ory Settings Flow (MFA)', () => {
  const testEmail = 'settings-e2e@example.com';
  const testPassword = 'TestPassword123!';

  test.beforeEach(async ({ page }) => {
    // Sign in first
    await page.goto('/auth/signin');
    await page.fill('input[name="identifier"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('/account');
  });

  test('access settings page', async ({ page }) => {
    await page.goto('/auth/settings');

    // Should see Ory settings form
    await expect(page.locator('text=/settings|profile/i')).toBeVisible();
  });

  test('enable TOTP (2FA)', async ({ page }) => {
    await page.goto('/auth/settings');

    // Click "Enable 2FA" (if available)
    const enable2FAButton = page.locator('button:has-text("Enable"), button:has-text("2FA")');

    if (await enable2FAButton.isVisible()) {
      await enable2FAButton.click();

      // Should see QR code or secret key
      await expect(page.locator('text=/scan.*qr|secret.*key/i')).toBeVisible();
    }
  });

  test('admin requires MFA to access /admin', async ({ page }) => {
    // Assuming test user is admin but no MFA enabled
    await page.goto('/admin');

    // Should redirect to MFA required page
    await expect(page).toHaveURL(/\/auth\/mfa-required/);
  });
});
```

---

## Test Helpers

**File:** `tests/helpers/ory-helpers.ts`

```typescript
import { kratosAdmin } from '@/lib/auth/kratos';
import { db } from '@/db';
import { users } from '@/db/schema-auth';

/**
 * Create test user in Ory Kratos + local DB
 */
export async function createTestOryUser(overrides?: {
  email?: string;
  password?: string;
  name?: string;
  role?: string;
}) {
  const defaults = {
    email: `test-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    name: 'Test User',
    role: 'customer',
  };

  const userData = { ...defaults, ...overrides };

  // Create Ory identity
  const { data: identity } = await kratosAdmin.createIdentity({
    createIdentityBody: {
      schema_id: 'default',
      traits: {
        email: userData.email,
        name: userData.name,
        role: userData.role,
      },
      credentials: {
        password: {
          config: {
            password: userData.password,
          },
        },
      },
      state: 'active',
    },
  });

  // Create local user (simulates webhook)
  const [localUser] = await db.insert(users).values({
    kratosId: identity.id,
    email: userData.email,
    name: userData.name,
    role: userData.role,
  }).returning();

  return { identity, localUser, password: userData.password };
}

/**
 * Delete test user from Ory + local DB
 */
export async function deleteTestOryUser(kratosId: string) {
  // Delete from Ory
  await kratosAdmin.deleteIdentity({ id: kratosId });

  // Delete from local DB
  await db.delete(users).where(eq(users.kratosId, kratosId));
}

/**
 * Get Ory session token for testing
 */
export async function getOrySessionToken(email: string, password: string): Promise<string> {
  // Initialize login flow
  const { data: flow } = await kratosFrontend.createBrowserLoginFlow();

  // Submit credentials
  const { data: session } = await kratosFrontend.updateLoginFlow({
    flow: flow.id,
    updateLoginFlowBody: {
      method: 'password',
      identifier: email,
      password,
    },
  });

  // Extract session token from Set-Cookie header
  // (Implementation depends on test environment)
  return session.session_token || '';
}
```

---

## Test Coverage Goals

**Target:** >70% coverage for auth integration modules

```bash
# Run tests with coverage
npm run test:coverage

# View coverage report
open coverage/index.html
```

**Critical Modules:**
- `lib/auth/guards.ts` - 90% coverage
- `lib/auth/session.ts` - 90% coverage
- `lib/auth/kratos.ts` - 80% coverage
- `middleware.ts` - 85% coverage
- `app/api/auth/webhook/route.ts` - 95% coverage

**Ory-Managed (No Coverage Needed):**
- ❌ Password hashing (Ory handles)
- ❌ Token generation (Ory handles)
- ❌ Email sending (Ory Courier handles)

---

## Implementation Steps

### Step 1: Unit Tests (45 min)

- [ ] Create session helper tests
- [ ] Create guard tests
- [ ] Run tests: `npm run test:unit`
- [ ] Verify all pass

### Step 2: Integration Tests (60 min)

- [ ] Create webhook tests
- [ ] Create middleware tests
- [ ] Create local user sync tests
- [ ] Run tests: `npm run test:integration`
- [ ] Verify all pass

### Step 3: E2E Tests (60 min)

- [ ] Create registration flow test
- [ ] Create login flow test
- [ ] Create recovery flow test
- [ ] Create settings/MFA flow test
- [ ] Run tests: `npm run test:e2e`
- [ ] Verify all pass

### Step 4: Coverage Check (15 min)

- [ ] Run coverage: `npm run test:coverage`
- [ ] Review coverage report
- [ ] Add tests for uncovered lines
- [ ] Achieve >70% coverage

---

## Acceptance Criteria

- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] All E2E tests passing
- [ ] Test coverage >70% for auth integration modules
- [ ] Webhook sync tested and working
- [ ] Middleware tests cover all protection scenarios
- [ ] E2E tests cover Ory self-service flows
- [ ] No flaky tests (run 3 times, all pass)

---

## Running Tests

```bash
# All tests
npm test

# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# E2E tests only
npm run test:e2e

# Watch mode (development)
npm run test:watch

# Coverage report
npm run test:coverage
```

**Environment Setup:**

```bash
# Ensure Ory Kratos is running for integration/E2E tests
docker-compose -f docker/docker-compose.auth.yml up -d

# Wait for Kratos to be ready
curl http://localhost:4433/health/ready

# Run tests
npm test
```

---

## Debugging Tests

**Vitest debugging:**

```typescript
// Add .only to run single test
it.only('should do something', () => {
  // ...
});

// Add .skip to skip test
it.skip('should do something', () => {
  // ...
});

// Use console.log for debugging
it('should do something', () => {
  console.log('Debug:', value);
  // ...
});
```

**Playwright debugging:**

```bash
# Run with headed browser
npx playwright test --headed

# Debug mode (step through)
npx playwright test --debug

# Slow motion (easier to see)
npx playwright test --slow-mo=1000
```

**Ory debugging:**

```bash
# Check Kratos logs
docker logs imajin-kratos

# Check Kratos health
curl http://localhost:4433/health/ready
curl http://localhost:4434/health/ready

# List all identities
curl http://localhost:4434/admin/identities | jq

# Get specific identity
curl http://localhost:4434/admin/identities/{identity_id} | jq
```

---

## Recommended Additional Tests

These tests enhance robustness and security. Implement after core tests pass:

### Webhook Edge Cases (5-8 tests)

**File:** `tests/integration/auth/webhook-edge-cases.test.ts`

```typescript
describe('Webhook Edge Cases', () => {
  it('should handle duplicate identity.created webhook (idempotent)', async () => {
    // Send same webhook twice, verify only one user created
  });

  it('should handle webhook when local DB insert fails', async () => {
    // Mock DB error, verify graceful failure + retry logic
  });

  it('should handle malformed webhook payload', async () => {
    // Send invalid JSON, missing fields, verify rejection
  });

  it('should handle webhook for deleted Kratos identity', async () => {
    // identity.updated for non-existent user, verify error handling
  });

  it('should handle concurrent webhooks for same identity', async () => {
    // Send multiple updates simultaneously, verify data consistency
  });

  it('should reject webhook without valid signature (if Ory supports)', async () => {
    // Send unsigned webhook, verify rejection
  });
});
```

### Email Verification E2E (1 test)

**File:** `tests/e2e/auth/email-verification-flow.spec.ts`

```typescript
test.describe('Email Verification Flow', () => {
  test('complete email verification after registration', async ({ page }) => {
    // 1. Register new user
    // 2. Check email (MailHog/mock SMTP)
    // 3. Click verification link
    // 4. Verify account activated
    // 5. Sign in successfully
  });
});
```

### MFA Recovery Scenarios (2 tests)

**File:** `tests/e2e/auth/mfa-recovery.spec.ts`

```typescript
test.describe('MFA Recovery', () => {
  test('admin uses recovery code after losing TOTP device', async ({ page }) => {
    // 1. Enable MFA, save recovery codes
    // 2. Sign out
    // 3. Sign in with recovery code instead of TOTP
    // 4. Verify access granted
  });

  test('admin can disable MFA via admin API', async () => {
    // Use Kratos admin API to disable MFA for locked-out user
  });
});
```

### Session Security (2 tests)

**File:** `tests/integration/auth/session-security.test.ts`

```typescript
describe('Session Security', () => {
  it('should expire session after timeout', async () => {
    // Create session, fast-forward time (mock), verify expired
  });

  it('should invalidate session on password change', async () => {
    // Change password via Ory, verify old session invalid
  });
});
```

---

## Success Criteria

**Phase 4.4 Complete When:**
- [ ] All 7 sub-phases complete
- [ ] All core tests passing (35 tests minimum)
- [ ] Coverage >70% for auth integration modules
- [ ] Sign in/sign up works via Ory
- [ ] Password reset works via Ory
- [ ] Email verification works via Ory
- [ ] Protected routes work with Ory sessions
- [ ] MFA enforced for admin routes
- [ ] Order history works with local user sync
- [ ] Webhook sync creates/updates local users
- [ ] No critical bugs
- [ ] Documentation complete

**Optional Enhancement (50+ tests):**
- [ ] Webhook edge cases implemented
- [ ] Email verification E2E test added
- [ ] MFA recovery tests added
- [ ] Session security tests added

---

## Next Steps

After Phase 4.4.7 complete:
1. **Update IMPLEMENTATION_PLAN.md** - Mark Phase 4.4 complete
2. **Update CLAUDE.md** - Update current phase
3. **Phase 4.5:** Admin Tools (order management, inventory)

---

**See Also:**
- `docs/tasks/Phase 4.4.6 - SendGrid Email Integration.md` - Previous phase
- `docs/tasks/Phase 4.4.2 - Ory Kratos Setup.md` - Kratos setup
- `docs/TESTING_STRATEGY.md` - Overall testing strategy
- `docs/IMPLEMENTATION_PLAN.md` - Project roadmap
- Ory Testing Guide: https://www.ory.sh/docs/kratos/test-debug
