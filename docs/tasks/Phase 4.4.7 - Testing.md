# Phase 4.4.7: Testing

**Status:** Ready for Implementation 🟡
**Estimated Effort:** 4 hours
**Dependencies:** Phase 4.4.6 complete (All features implemented)
**Next Phase:** Phase 4.5 (Admin Tools)

---

## Overview

Comprehensive testing suite for authentication system including unit tests, integration tests, and end-to-end tests. Achieve >80% code coverage for auth modules.

**Test Coverage:**
- Unit tests: Password hashing, validation, utilities
- Integration tests: Sign in, sign up, password reset, protected routes
- E2E tests: Full authentication flows

---

## Test Structure

```
tests/
├── unit/
│   └── lib/
│       └── auth/
│           ├── password.test.ts (Password utilities)
│           └── guards.test.ts (Server-side guards)
├── integration/
│   └── auth/
│       ├── signin.test.ts (Sign in API)
│       ├── signup.test.ts (Sign up API)
│       ├── password-reset.test.ts (Password reset API)
│       ├── protected-routes.test.ts (Middleware)
│       └── session.test.ts (Session management)
└── e2e/
    └── auth/
        ├── auth-flow.spec.ts (Full sign up/in flow)
        └── password-reset-flow.spec.ts (Full password reset)
```

---

## Unit Tests

### Password Utilities

**File:** `tests/unit/lib/auth/password.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, validatePasswordStrength } from '@/lib/auth/password';

describe('Password Utilities', () => {
  describe('hashPassword', () => {
    it('should hash password', async () => {
      const password = 'SecurePassword123';
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.startsWith('$2a$')).toBe(true); // bcrypt hash
    });

    it('should generate different hashes for same password', async () => {
      const password = 'SecurePassword123';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2); // Different salts
    });
  });

  describe('verifyPassword', () => {
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

    it('should reject empty password', async () => {
      const hash = await hashPassword('SecurePassword123');
      const isValid = await verifyPassword('', hash);

      expect(isValid).toBe(false);
    });
  });

  describe('validatePasswordStrength', () => {
    it('should accept strong password', () => {
      const result = validatePasswordStrength('SecurePassword123');

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject password too short', () => {
      const result = validatePasswordStrength('Short1');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must be at least 10 characters');
    });

    it('should reject password without uppercase', () => {
      const result = validatePasswordStrength('securepassword123');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    it('should reject password without lowercase', () => {
      const result = validatePasswordStrength('SECUREPASSWORD123');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    it('should reject password without number', () => {
      const result = validatePasswordStrength('SecurePassword');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });

    it('should reject common passwords', () => {
      const result = validatePasswordStrength('Password123');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password is too common');
    });
  });
});
```

---

## Integration Tests

### Sign In API

**File:** `tests/integration/auth/signin.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '@/db';
import { users } from '@/db/schema-auth';
import { hashPassword } from '@/lib/auth/password';

describe('Sign In API', () => {
  const testUser = {
    email: 'test@example.com',
    password: 'TestPassword123',
    name: 'Test User',
  };

  beforeEach(async () => {
    // Clean up
    await db.delete(users).where(eq(users.email, testUser.email));

    // Create test user
    await db.insert(users).values({
      email: testUser.email,
      passwordHash: await hashPassword(testUser.password),
      name: testUser.name,
      role: 'customer',
      emailVerified: new Date(),
    });
  });

  afterEach(async () => {
    // Clean up
    await db.delete(users).where(eq(users.email, testUser.email));
  });

  it('should sign in with correct credentials', async () => {
    const response = await fetch('http://localhost:30000/api/auth/signin/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password,
      }),
    });

    expect(response.status).toBe(200);
  });

  it('should reject incorrect password', async () => {
    const response = await fetch('http://localhost:30000/api/auth/signin/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUser.email,
        password: 'WrongPassword',
      }),
    });

    expect(response.status).toBe(401);
  });

  it('should reject non-existent user', async () => {
    const response = await fetch('http://localhost:30000/api/auth/signin/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'nonexistent@example.com',
        password: testUser.password,
      }),
    });

    expect(response.status).toBe(401);
  });
});
```

### Sign Up API

**File:** `tests/integration/auth/signup.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '@/db';
import { users } from '@/db/schema-auth';
import { eq } from 'drizzle-orm';

describe('Sign Up API', () => {
  const testEmail = 'newuser@example.com';

  beforeEach(async () => {
    // Clean up
    await db.delete(users).where(eq(users.email, testEmail));
  });

  afterEach(async () => {
    // Clean up
    await db.delete(users).where(eq(users.email, testEmail));
  });

  it('should create new user', async () => {
    const response = await fetch('http://localhost:30000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'SecurePassword123',
        name: 'New User',
      }),
    });

    expect(response.status).toBe(201);

    // Verify user created
    const user = await db.query.users.findFirst({
      where: eq(users.email, testEmail),
    });

    expect(user).toBeDefined();
    expect(user!.email).toBe(testEmail);
    expect(user!.name).toBe('New User');
    expect(user!.emailVerified).toBeNull(); // Not verified yet
  });

  it('should reject duplicate email', async () => {
    // Create first user
    await fetch('http://localhost:30000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'SecurePassword123',
        name: 'First User',
      }),
    });

    // Try to create second user with same email
    const response = await fetch('http://localhost:30000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'SecurePassword123',
        name: 'Second User',
      }),
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('already exists');
  });

  it('should reject weak password', async () => {
    const response = await fetch('http://localhost:30000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'weak',
        name: 'New User',
      }),
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBeDefined();
  });

  it('should reject invalid email', async () => {
    const response = await fetch('http://localhost:30000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'invalid-email',
        password: 'SecurePassword123',
        name: 'New User',
      }),
    });

    expect(response.status).toBe(400);
  });
});
```

### Protected Routes

**File:** `tests/integration/auth/protected-routes.test.ts`

```typescript
import { describe, it, expect } from 'vitest';

describe('Protected Routes Middleware', () => {
  it('should redirect to signin for /account without auth', async () => {
    const response = await fetch('http://localhost:30000/account', {
      redirect: 'manual',
    });

    expect(response.status).toBe(307); // Temporary redirect
    expect(response.headers.get('location')).toContain('/auth/signin');
    expect(response.headers.get('location')).toContain('callbackUrl');
  });

  it('should redirect to signin for /admin without auth', async () => {
    const response = await fetch('http://localhost:30000/admin', {
      redirect: 'manual',
    });

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/auth/signin');
  });

  it('should allow /auth/signin without auth', async () => {
    const response = await fetch('http://localhost:30000/auth/signin');

    expect(response.status).toBe(200);
  });

  it('should allow homepage without auth', async () => {
    const response = await fetch('http://localhost:30000');

    expect(response.status).toBe(200);
  });
});
```

---

## End-to-End Tests

### Full Authentication Flow

**File:** `tests/e2e/auth/auth-flow.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123';
  const testName = 'E2E Test User';

  test('complete signup and signin flow', async ({ page }) => {
    // Navigate to signup page
    await page.goto('/auth/signup');

    // Fill in signup form
    await page.fill('input[name="name"]', testName);
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="confirmPassword"]', testPassword);

    // Submit form
    await page.click('button[type="submit"]');

    // Should see success message
    await expect(page.locator('text=/check your email/i')).toBeVisible();

    // Navigate to signin page
    await page.goto('/auth/signin');

    // Fill in signin form
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to account page
    await expect(page).toHaveURL('/account');

    // Should see user name
    await expect(page.locator(`text=${testName}`)).toBeVisible();
  });

  test('protected route redirects to signin', async ({ page }) => {
    // Try to access protected route
    await page.goto('/account');

    // Should redirect to signin with callback URL
    await expect(page).toHaveURL(/\/auth\/signin\?callbackUrl/);
  });

  test('signin redirects to callback URL', async ({ page }) => {
    // Setup: Create user (assumes signup works)
    // ...

    // Try to access protected route (redirects to signin)
    await page.goto('/account/orders');
    await expect(page).toHaveURL(/\/auth\/signin\?callbackUrl/);

    // Sign in
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');

    // Should redirect to originally requested URL
    await expect(page).toHaveURL('/account/orders');
  });

  test('signout works', async ({ page }) => {
    // Setup: Sign in first
    // ...

    // Click signout in dropdown
    await page.click('button:has-text("Test User")'); // Open dropdown
    await page.click('button:has-text("Sign Out")');

    // Should redirect to homepage
    await expect(page).toHaveURL('/');

    // Should show "Sign In" button
    await expect(page.locator('text=Sign In')).toBeVisible();
  });

  test('password validation works', async ({ page }) => {
    await page.goto('/auth/signup');

    // Try weak password
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'weak');
    await page.fill('input[name="confirmPassword"]', 'weak');
    await page.click('button[type="submit"]');

    // Should see error messages
    await expect(page.locator('text=/at least 10 characters/i')).toBeVisible();
  });
});
```

### Password Reset Flow

**File:** `tests/e2e/auth/password-reset-flow.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Password Reset Flow', () => {
  const testEmail = 'reset-test@example.com';

  test('password reset request and confirmation', async ({ page }) => {
    // Navigate to password reset page
    await page.goto('/auth/reset-password');

    // Fill in email
    await page.fill('input[name="email"]', testEmail);
    await page.click('button[type="submit"]');

    // Should see success message
    await expect(page.locator('text=/email sent/i')).toBeVisible();

    // Note: In real flow, user would click link in email
    // For E2E test, we'd need to:
    // 1. Intercept email (use test email service)
    // 2. Extract reset link
    // 3. Navigate to reset link
    // 4. Fill in new password
    // 5. Verify can sign in with new password
  });

  test('shows error for invalid reset link', async ({ page }) => {
    // Navigate to invalid reset link
    await page.goto('/auth/reset-password/invalid-token-123?email=test@example.com');

    // Should see error message
    await expect(page.locator('text=/invalid or expired/i')).toBeVisible();
  });
});
```

---

## Test Helpers

**File:** `tests/helpers/auth-helpers.ts`

```typescript
import { db } from '@/db';
import { users, sessions } from '@/db/schema-auth';
import { hashPassword } from '@/lib/auth/password';
import { randomBytes } from 'crypto';

/**
 * Create a test user
 */
export async function createTestUser(overrides?: Partial<{
  email: string;
  password: string;
  name: string;
  role: string;
  emailVerified: Date | null;
}>) {
  const defaults = {
    email: `test-${Date.now()}@example.com`,
    password: 'TestPassword123',
    name: 'Test User',
    role: 'customer',
    emailVerified: new Date(),
  };

  const userData = { ...defaults, ...overrides };
  const passwordHash = await hashPassword(userData.password);

  const [user] = await db.insert(users).values({
    email: userData.email,
    passwordHash,
    name: userData.name,
    role: userData.role,
    emailVerified: userData.emailVerified,
  }).returning();

  return { user, password: userData.password };
}

/**
 * Delete test user
 */
export async function deleteTestUser(email: string) {
  await db.delete(users).where(eq(users.email, email));
}

/**
 * Create authenticated session for testing
 */
export async function createTestSession(userId: string) {
  const sessionToken = randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  await db.insert(sessions).values({
    userId,
    sessionToken,
    expires,
  });

  return sessionToken;
}
```

---

## Test Coverage Goals

**Target:** >80% coverage for auth modules

```bash
# Run tests with coverage
npm run test:coverage

# View coverage report
open coverage/index.html
```

**Critical Modules:**
- `lib/auth/password.ts` - 100% coverage
- `lib/auth/config.ts` - 90% coverage
- `lib/auth/guards.ts` - 95% coverage
- `app/api/auth/signup/route.ts` - 90% coverage
- `components/auth/*` - 80% coverage

---

## Implementation Steps

### Step 1: Unit Tests (60 min)

- [ ] Create password utility tests
- [ ] Run tests: `npm run test:unit`
- [ ] Verify all pass

### Step 2: Integration Tests (90 min)

- [ ] Create sign in API tests
- [ ] Create sign up API tests
- [ ] Create protected route tests
- [ ] Run tests: `npm run test:integration`
- [ ] Verify all pass

### Step 3: E2E Tests (60 min)

- [ ] Create full auth flow test
- [ ] Create password reset flow test
- [ ] Run tests: `npm run test:e2e`
- [ ] Verify all pass

### Step 4: Coverage Check (30 min)

- [ ] Run coverage: `npm run test:coverage`
- [ ] Review coverage report
- [ ] Add tests for uncovered lines
- [ ] Achieve >80% coverage

---

## Acceptance Criteria

- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] All E2E tests passing
- [ ] Test coverage >80% for auth modules
- [ ] No flaky tests (run 3 times, all pass)
- [ ] Tests run in CI/CD (if configured)

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

---

## Success Criteria

**Phase 4.4 Complete When:**
- [ ] All 7 sub-phases complete
- [ ] All tests passing (>100 new tests)
- [ ] Coverage >80% for auth modules
- [ ] Sign in/sign up works
- [ ] Password reset works
- [ ] Email verification works
- [ ] Protected routes work
- [ ] Order history works
- [ ] No critical bugs
- [ ] Documentation complete

---

## Next Steps

After Phase 4.4.7 complete:
1. **Update IMPLEMENTATION_PLAN.md** - Mark Phase 4.4 complete
2. **Update CLAUDE.md** - Update current phase
3. **Phase 4.5:** Admin Tools (order management, inventory)

---

**See Also:**
- `docs/tasks/Phase 4.4.6 - SendGrid Email Integration.md` - Previous phase
- `docs/TESTING_STRATEGY.md` - Overall testing strategy
- `docs/IMPLEMENTATION_PLAN.md` - Project roadmap
