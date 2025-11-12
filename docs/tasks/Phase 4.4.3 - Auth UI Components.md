# Phase 4.4.3: Auth UI Components

**Status:** Ready for Implementation 🟡
**Estimated Effort:** 5 hours
**Dependencies:** Phase 4.4.2 complete (NextAuth configured)
**Next Phase:** Phase 4.4.4 (Protected Routes & Middleware)

---

## Overview

Build authentication UI components for sign in, sign up, password reset, and user navigation. All forms use existing UI library components and follow design system patterns.

**Key Features:**
- Email/password sign in
- Email/password sign up with validation
- Password reset flow
- Email verification page
- User navigation dropdown
- Error handling and loading states

---

## Component Structure

```
app/
├── auth/
│   ├── signin/
│   │   └── page.tsx (Sign in page)
│   ├── signup/
│   │   └── page.tsx (Sign up page)
│   ├── verify/
│   │   └── page.tsx (Email verification)
│   ├── reset-password/
│   │   ├── page.tsx (Request reset)
│   │   └── [token]/
│   │       └── page.tsx (Reset form)
│   └── error/
│       └── page.tsx (Auth error page)

components/
├── auth/
│   ├── SignInForm.tsx (Sign in form component)
│   ├── SignUpForm.tsx (Sign up form component)
│   ├── PasswordResetForm.tsx (Password reset form)
│   ├── UserNav.tsx (User dropdown in header)
│   └── AuthError.tsx (Error display component)
```

---

## Sign In Form

**File:** `components/auth/SignInForm.tsx`

```typescript
'use client';

import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/form/Input';
import { Label } from '@/components/ui/form/Label';

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/account';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password');
      } else if (result?.ok) {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded text-sm">
          {error}
        </div>
      )}

      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          disabled={loading}
        />
      </div>

      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          disabled={loading}
        />
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Signing in...' : 'Sign In'}
      </Button>

      <div className="text-sm text-center space-y-2">
        <div>
          <a href="/auth/reset-password" className="text-blue-600 hover:underline">
            Forgot password?
          </a>
        </div>
        <div>
          Don't have an account?{' '}
          <a href="/auth/signup" className="text-blue-600 hover:underline">
            Sign up
          </a>
        </div>
      </div>
    </form>
  );
}
```

**File:** `app/auth/signin/page.tsx`

```typescript
import { SignInForm } from '@/components/auth/SignInForm';
import { Container } from '@/components/ui/Container';
import { Heading } from '@/components/ui/Heading';
import { Suspense } from 'react';

export const metadata = {
  title: 'Sign In - Imajin',
  description: 'Sign in to your account',
};

export default function SignInPage() {
  return (
    <Container className="py-12">
      <div className="max-w-md mx-auto">
        <Heading level={1} className="text-center mb-8">
          Sign In
        </Heading>

        <div className="bg-white border rounded-lg p-6">
          <Suspense fallback={<div>Loading...</div>}>
            <SignInForm />
          </Suspense>
        </div>
      </div>
    </Container>
  );
}
```

---

## Sign Up Form

**File:** `components/auth/SignUpForm.tsx`

```typescript
'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/form/Input';
import { Label } from '@/components/ui/form/Label';
import { validatePasswordStrength } from '@/lib/auth/password';

export function SignUpForm() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors([]);
    setLoading(true);

    // Validate passwords match
    if (password !== confirmPassword) {
      setErrors(['Passwords do not match']);
      setLoading(false);
      return;
    }

    // Validate password strength
    const validation = validatePasswordStrength(password);
    if (!validation.valid) {
      setErrors(validation.errors);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors([data.error || 'Something went wrong']);
      } else {
        setSuccess(true);
        // Redirect to verify page or sign in
        setTimeout(() => {
          router.push('/auth/verify?email=' + encodeURIComponent(email));
        }, 1000);
      }
    } catch (err) {
      setErrors(['Something went wrong. Please try again.']);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
        <p className="font-medium">Account created successfully!</p>
        <p className="text-sm mt-1">Please check your email to verify your account.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          <ul className="text-sm space-y-1">
            {errors.map((error, i) => (
              <li key={i}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoComplete="name"
          disabled={loading}
        />
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          disabled={loading}
        />
      </div>

      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="new-password"
          disabled={loading}
        />
        <p className="text-xs text-gray-600 mt-1">
          Must be at least 10 characters with uppercase, lowercase, and a number
        </p>
      </div>

      <div>
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <Input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          autoComplete="new-password"
          disabled={loading}
        />
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Creating account...' : 'Sign Up'}
      </Button>

      <div className="text-sm text-center">
        Already have an account?{' '}
        <a href="/auth/signin" className="text-blue-600 hover:underline">
          Sign in
        </a>
      </div>
    </form>
  );
}
```

**File:** `app/api/auth/signup/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema-auth';
import { hashPassword, validatePasswordStrength } from '@/lib/auth/password';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    // Validate required fields
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      );
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password strength
    const validation = validatePasswordStrength(password);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.errors.join(', ') },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    await db.insert(users).values({
      email,
      passwordHash,
      name,
      role: 'customer',
      emailVerified: null, // Will be set after verification
    });

    // TODO Phase 4.4.6: Send verification email

    return NextResponse.json(
      { message: 'User created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**File:** `app/auth/signup/page.tsx`

```typescript
import { SignUpForm } from '@/components/auth/SignUpForm';
import { Container } from '@/components/ui/Container';
import { Heading } from '@/components/ui/Heading';

export const metadata = {
  title: 'Sign Up - Imajin',
  description: 'Create your account',
};

export default function SignUpPage() {
  return (
    <Container className="py-12">
      <div className="max-w-md mx-auto">
        <Heading level={1} className="text-center mb-8">
          Sign Up
        </Heading>

        <div className="bg-white border rounded-lg p-6">
          <SignUpForm />
        </div>
      </div>
    </Container>
  );
}
```

---

## Password Reset Form

**File:** `components/auth/PasswordResetForm.tsx`

```typescript
'use client';

import { useState, FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/form/Input';
import { Label } from '@/components/ui/form/Label';

export function PasswordResetForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setSuccess(true);
      } else {
        const data = await response.json();
        setError(data.error || 'Something went wrong');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
        <p className="font-medium">Password reset email sent!</p>
        <p className="text-sm mt-1">
          Check your email for instructions to reset your password.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded text-sm">
          {error}
        </div>
      )}

      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          disabled={loading}
        />
        <p className="text-xs text-gray-600 mt-1">
          We'll send you a link to reset your password.
        </p>
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Sending...' : 'Send Reset Link'}
      </Button>

      <div className="text-sm text-center">
        <a href="/auth/signin" className="text-blue-600 hover:underline">
          Back to sign in
        </a>
      </div>
    </form>
  );
}
```

**File:** `app/auth/reset-password/page.tsx`

```typescript
import { PasswordResetForm } from '@/components/auth/PasswordResetForm';
import { Container } from '@/components/ui/Container';
import { Heading } from '@/components/ui/Heading';

export const metadata = {
  title: 'Reset Password - Imajin',
  description: 'Reset your password',
};

export default function ResetPasswordPage() {
  return (
    <Container className="py-12">
      <div className="max-w-md mx-auto">
        <Heading level={1} className="text-center mb-8">
          Reset Password
        </Heading>

        <div className="bg-white border rounded-lg p-6">
          <PasswordResetForm />
        </div>
      </div>
    </Container>
  );
}
```

---

## User Navigation

**File:** `components/auth/UserNav.tsx`

```typescript
'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';

export function UserNav() {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (status === 'loading') {
    return <div className="text-sm">Loading...</div>;
  }

  if (!session) {
    return (
      <div className="flex items-center gap-4">
        <Link href="/auth/signin" className="text-sm hover:underline">
          Sign In
        </Link>
        <Link
          href="/auth/signup"
          className="bg-black text-white px-4 py-2 rounded text-sm hover:bg-gray-800 transition"
        >
          Sign Up
        </Link>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 hover:opacity-75 transition"
      >
        <span className="text-sm">{session.user.name || session.user.email}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white border rounded shadow-lg py-1">
          <Link
            href="/account"
            className="block px-4 py-2 text-sm hover:bg-gray-100"
            onClick={() => setIsOpen(false)}
          >
            My Account
          </Link>
          <Link
            href="/account/orders"
            className="block px-4 py-2 text-sm hover:bg-gray-100"
            onClick={() => setIsOpen(false)}
          >
            Order History
          </Link>
          {session.user.role === 'admin' && (
            <Link
              href="/admin"
              className="block px-4 py-2 text-sm hover:bg-gray-100 border-t"
              onClick={() => setIsOpen(false)}
            >
              Admin Panel
            </Link>
          )}
          <button
            onClick={() => {
              setIsOpen(false);
              signOut({ callbackUrl: '/' });
            }}
            className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 border-t"
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
```

**Update header to include UserNav:**

```typescript
// components/layout/Header.tsx
import { UserNav } from '@/components/auth/UserNav';

export function Header() {
  return (
    <header>
      {/* ... existing header content */}
      <UserNav />
    </header>
  );
}
```

---

## Error Page

**File:** `app/auth/error/page.tsx`

```typescript
'use client';

import { useSearchParams } from 'next/navigation';
import { Container } from '@/components/ui/Container';
import { Heading } from '@/components/ui/Heading';
import Link from 'next/link';

const errorMessages: Record<string, string> = {
  Configuration: 'There is a problem with the server configuration.',
  AccessDenied: 'You do not have permission to sign in.',
  Verification: 'The verification link is invalid or has expired.',
  Default: 'An error occurred during authentication.',
};

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error') || 'Default';
  const message = errorMessages[error] || errorMessages.Default;

  return (
    <Container className="py-12">
      <div className="max-w-md mx-auto text-center">
        <Heading level={1} className="mb-4">
          Authentication Error
        </Heading>

        <div className="bg-red-50 border border-red-200 text-red-600 px-6 py-4 rounded mb-6">
          <p>{message}</p>
        </div>

        <Link
          href="/auth/signin"
          className="inline-block bg-black text-white px-6 py-2 rounded hover:bg-gray-800"
        >
          Back to Sign In
        </Link>
      </div>
    </Container>
  );
}
```

---

## Email Verification Page

**File:** `app/auth/verify/page.tsx`

```typescript
'use client';

import { useSearchParams } from 'next/navigation';
import { Container } from '@/components/ui/Container';
import { Heading } from '@/components/ui/Heading';

export default function VerifyPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email');

  return (
    <Container className="py-12">
      <div className="max-w-md mx-auto text-center">
        <Heading level={1} className="mb-6">
          Check Your Email
        </Heading>

        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-6 py-4 rounded mb-6">
          <p className="font-medium mb-2">Verification email sent</p>
          {email && (
            <p className="text-sm">
              We sent a verification link to <strong>{email}</strong>
            </p>
          )}
          <p className="text-sm mt-2">
            Click the link in the email to verify your account.
          </p>
        </div>

        <p className="text-sm text-gray-600">
          Didn't receive the email? Check your spam folder or{' '}
          <button className="text-blue-600 hover:underline">
            resend verification email
          </button>
        </p>
      </div>
    </Container>
  );
}
```

---

## Implementation Steps

### Step 1: Create Sign In Components (60 min)

- [ ] Create SignInForm.tsx
- [ ] Create app/auth/signin/page.tsx
- [ ] Test sign in manually
- [ ] Verify error handling
- [ ] Test "forgot password" link

### Step 2: Create Sign Up Components (90 min)

- [ ] Create SignUpForm.tsx
- [ ] Create app/api/auth/signup/route.ts
- [ ] Create app/auth/signup/page.tsx
- [ ] Test password validation
- [ ] Test duplicate email handling
- [ ] Test success flow

### Step 3: Create Password Reset (60 min)

- [ ] Create PasswordResetForm.tsx
- [ ] Create app/auth/reset-password/page.tsx
- [ ] Create reset token form page
- [ ] Test email submission
- [ ] Placeholder for email sending (Phase 4.4.6)

### Step 4: Create User Navigation (45 min)

- [ ] Create UserNav.tsx
- [ ] Add to Header component
- [ ] Test dropdown open/close
- [ ] Test sign out
- [ ] Test admin link (if admin user)

### Step 5: Create Support Pages (30 min)

- [ ] Create error page
- [ ] Create verification page
- [ ] Test error display
- [ ] Test verification message

### Step 6: Styling & Accessibility (45 min)

- [ ] Ensure consistent design system usage
- [ ] Add keyboard navigation
- [ ] Add ARIA labels
- [ ] Test with screen reader
- [ ] Test mobile responsiveness

---

## Acceptance Criteria

- [ ] Sign in form works
- [ ] Sign up form works with validation
- [ ] Password reset request works
- [ ] User dropdown works (sign out, navigation)
- [ ] Error page displays correctly
- [ ] Verification page displays correctly
- [ ] All forms accessible (keyboard, screen reader)
- [ ] Loading states display correctly
- [ ] Error messages clear and helpful
- [ ] Mobile responsive

---

## Testing

### Manual Testing Checklist

**Sign In:**
- [ ] Sign in with valid credentials
- [ ] Sign in with invalid password
- [ ] Sign in with non-existent email
- [ ] Test "forgot password" link
- [ ] Test "sign up" link

**Sign Up:**
- [ ] Create account with valid data
- [ ] Test password too short
- [ ] Test password missing requirements
- [ ] Test duplicate email
- [ ] Test passwords don't match
- [ ] Verify redirect to verification page

**Password Reset:**
- [ ] Request reset for existing email
- [ ] Request reset for non-existent email
- [ ] Test "back to sign in" link

**User Nav:**
- [ ] Verify shows when signed in
- [ ] Verify shows "Sign In" when signed out
- [ ] Test dropdown open/close
- [ ] Test sign out
- [ ] Test admin link (admin user only)
- [ ] Test navigation links

---

## Next Steps

After Phase 4.4.3 complete:
1. **Phase 4.4.4:** Add middleware for protected routes
2. **Phase 4.4.5:** Integrate with orders and checkout
3. **Phase 4.4.6:** SendGrid email integration

---

**See Also:**
- `docs/tasks/Phase 4.4.2 - NextAuth Configuration.md` - Previous phase
- `docs/tasks/Phase 4.4.4 - Protected Routes & Middleware.md` - Next phase
- `docs/DESIGN_SYSTEM.md` - UI component library
