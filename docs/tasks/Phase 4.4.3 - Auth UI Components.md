# Phase 4.4.3: Auth UI Components

**Status:** Ready for Implementation 🟡
**Estimated Effort:** 6 hours
**Dependencies:** Phase 4.4.2 complete (Ory Kratos running)
**Next Phase:** Phase 4.4.4 (Protected Routes & Middleware)

---

## Overview

Build authentication UI components that render Ory Kratos self-service flows. Instead of custom forms, we render Ory's flow UI nodes dynamically. This approach provides built-in validation, error handling, and security features.

**Key Features:**
- Email/password sign in (Ory login flow)
- Email/password sign up (Ory registration flow)
- Email verification (Ory verification flow)
- Password reset (Ory recovery flow)
- Account settings & MFA (Ory settings flow)
- User navigation dropdown
- Reusable flow renderer

**Ory Self-Service Flow Pattern:**
1. Initialize flow (server-side GET request to Ory)
2. Render form with flow.ui.nodes (dynamic from Ory)
3. Submit form (POST to flow.ui.action)
4. Handle response (success, errors, 2FA challenge)

---

## Component Structure

```
app/
├── auth/
│   ├── signin/
│   │   └── page.tsx (Initialize login flow)
│   ├── signup/
│   │   └── page.tsx (Initialize registration flow)
│   ├── verify/
│   │   └── page.tsx (Verification flow)
│   ├── recovery/
│   │   └── page.tsx (Password reset flow)
│   ├── settings/
│   │   └── page.tsx (Account settings & MFA)
│   ├── mfa-required/
│   │   └── page.tsx (Admin MFA enforcement)
│   └── error/
│       └── page.tsx (Auth error page)

components/
├── auth/
│   ├── OryFlowForm.tsx (Reusable flow renderer)
│   └── UserNav.tsx (User dropdown in header)
```

---

## Reusable Flow Renderer

**File:** `components/auth/OryFlowForm.tsx`

**This component renders ANY Ory flow (login, registration, recovery, settings)**

```typescript
'use client';

import { LoginFlow, RegistrationFlow, RecoveryFlow, SettingsFlow, VerificationFlow } from '@ory/client';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/form/Input';
import { Label } from '@/components/ui/form/Label';

type Flow = LoginFlow | RegistrationFlow | RecoveryFlow | SettingsFlow | VerificationFlow;

interface OryFlowFormProps {
  flow: Flow;
  onSuccess?: (returnTo?: string) => void;
}

export function OryFlowForm({ flow, onSuccess }: OryFlowFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    try {
      const response = await fetch(flow.ui.action, {
        method: flow.ui.method,
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        // Success - redirect or callback
        if (onSuccess) {
          onSuccess(data.return_to);
        } else {
          router.push(data.return_to || '/account');
          router.refresh();
        }
      } else if (data.error) {
        setError(data.error.message || 'An error occurred');
      } else if (data.ui) {
        // Flow updated (e.g., validation errors) - reload page
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
      {/* Global flow messages */}
      {flow.ui.messages?.map((message, idx) => (
        <div
          key={idx}
          className={`px-4 py-3 rounded text-sm ${
            message.type === 'error'
              ? 'bg-red-50 border border-red-200 text-red-600'
              : 'bg-blue-50 border border-blue-200 text-blue-700'
          }`}
        >
          {message.text}
        </div>
      ))}

      {/* Component error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded text-sm">
          {error}
        </div>
      )}

      {/* Render form fields from Ory flow */}
      {flow.ui.nodes.map((node) => {
        const attrs = node.attributes;
        const isInput = node.type === 'input';
        const isSubmit = isInput && attrs.type === 'submit';
        const isHidden = isInput && attrs.type === 'hidden';
        const isButton = node.type === 'button';

        // Hidden inputs (CSRF token, flow ID)
        if (isHidden) {
          return <input key={attrs.name} {...attrs} />;
        }

        // Submit button
        if (isSubmit || isButton) {
          return (
            <Button
              key={attrs.name}
              type="submit"
              disabled={loading || attrs.disabled}
              className="w-full"
            >
              {loading ? 'Loading...' : (node.meta.label?.text || 'Submit')}
            </Button>
          );
        }

        // Input fields (text, email, password, etc.)
        if (isInput && !isHidden && !isSubmit) {
          return (
            <div key={attrs.name}>
              <Label htmlFor={attrs.name}>
                {node.meta.label?.text || attrs.name}
              </Label>
              <Input
                {...attrs}
                disabled={loading || attrs.disabled}
                className="w-full"
              />
              {/* Field-specific error messages */}
              {node.messages?.map((msg, msgIdx) => (
                <p key={msgIdx} className="text-sm text-red-600 mt-1">
                  {msg.text}
                </p>
              ))}
            </div>
          );
        }

        // Script nodes (for WebAuthn, etc.)
        if (node.type === 'script') {
          return (
            <script
              key={node.attributes.id}
              src={node.attributes.src}
              async={node.attributes.async}
              crossOrigin={node.attributes.crossorigin}
            />
          );
        }

        return null;
      })}
    </form>
  );
}
```

**Why This Component is Powerful:**
- ✅ Works with ALL Ory flows (login, signup, recovery, settings)
- ✅ Handles validation automatically (Ory provides errors)
- ✅ Handles 2FA challenges (TOTP codes)
- ✅ Handles WebAuthn (future)
- ✅ Secure by default (CSRF tokens included)
- ✅ Mobile-friendly (responsive inputs)

---

## Sign In Page

**File:** `app/auth/signin/page.tsx`

```typescript
import { kratosFrontend } from '@/lib/auth/kratos';
import { OryFlowForm } from '@/components/auth/OryFlowForm';
import { Container } from '@/components/ui/Container';
import { Heading } from '@/components/ui/Heading';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Sign In - Imajin',
  description: 'Sign in to your account',
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: { flow?: string; return_to?: string };
}) {
  let flow;

  try {
    if (searchParams.flow) {
      // Fetch existing flow
      const { data } = await kratosFrontend.getLoginFlow({
        id: searchParams.flow,
      });
      flow = data;
    } else {
      // Create new login flow
      const { data } = await kratosFrontend.createBrowserLoginFlow({
        returnTo: searchParams.return_to || '/account',
      });
      // Redirect to same page with flow ID
      redirect(`/auth/signin?flow=${data.id}`);
    }
  } catch (error) {
    // Flow expired or invalid - redirect to error page
    redirect('/auth/error?error=FlowExpired');
  }

  return (
    <Container className="py-12">
      <div className="max-w-md mx-auto">
        <Heading level={1} className="text-center mb-8">
          Sign In
        </Heading>

        <div className="bg-white border rounded-lg p-6">
          <OryFlowForm flow={flow} />

          <div className="mt-4 text-sm text-center space-y-2">
            <div>
              <a href="/auth/recovery" className="text-blue-600 hover:underline">
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
        </div>
      </div>
    </Container>
  );
}
```

---

## Sign Up Page

**File:** `app/auth/signup/page.tsx`

```typescript
import { kratosFrontend } from '@/lib/auth/kratos';
import { OryFlowForm } from '@/components/auth/OryFlowForm';
import { Container } from '@/components/ui/Container';
import { Heading } from '@/components/ui/Heading';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Sign Up - Imajin',
  description: 'Create your account',
};

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: { flow?: string };
}) {
  let flow;

  try {
    if (searchParams.flow) {
      const { data } = await kratosFrontend.getRegistrationFlow({
        id: searchParams.flow,
      });
      flow = data;
    } else {
      const { data } = await kratosFrontend.createBrowserRegistrationFlow();
      redirect(`/auth/signup?flow=${data.id}`);
    }
  } catch (error) {
    redirect('/auth/error?error=FlowExpired');
  }

  return (
    <Container className="py-12">
      <div className="max-w-md mx-auto">
        <Heading level={1} className="text-center mb-8">
          Sign Up
        </Heading>

        <div className="bg-white border rounded-lg p-6">
          <OryFlowForm flow={flow} />

          <div className="mt-4 text-sm text-center">
            Already have an account?{' '}
            <a href="/auth/signin" className="text-blue-600 hover:underline">
              Sign in
            </a>
          </div>
        </div>

        <p className="text-xs text-gray-600 mt-4 text-center">
          Password must be at least 10 characters.
        </p>
      </div>
    </Container>
  );
}
```

---

## Password Recovery Page

**File:** `app/auth/recovery/page.tsx`

```typescript
import { kratosFrontend } from '@/lib/auth/kratos';
import { OryFlowForm } from '@/components/auth/OryFlowForm';
import { Container } from '@/components/ui/Container';
import { Heading } from '@/components/ui/Heading';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Reset Password - Imajin',
  description: 'Reset your password',
};

export default async function RecoveryPage({
  searchParams,
}: {
  searchParams: { flow?: string };
}) {
  let flow;

  try {
    if (searchParams.flow) {
      const { data } = await kratosFrontend.getRecoveryFlow({
        id: searchParams.flow,
      });
      flow = data;
    } else {
      const { data } = await kratosFrontend.createBrowserRecoveryFlow();
      redirect(`/auth/recovery?flow=${data.id}`);
    }
  } catch (error) {
    redirect('/auth/error?error=FlowExpired');
  }

  return (
    <Container className="py-12">
      <div className="max-w-md mx-auto">
        <Heading level={1} className="text-center mb-8">
          Reset Password
        </Heading>

        <div className="bg-white border rounded-lg p-6">
          <p className="text-sm text-gray-600 mb-4">
            Enter your email address and we'll send you a recovery code.
          </p>

          <OryFlowForm flow={flow} />

          <div className="mt-4 text-sm text-center">
            <a href="/auth/signin" className="text-blue-600 hover:underline">
              Back to sign in
            </a>
          </div>
        </div>
      </div>
    </Container>
  );
}
```

---

## Email Verification Page

**File:** `app/auth/verify/page.tsx`

```typescript
import { kratosFrontend } from '@/lib/auth/kratos';
import { OryFlowForm } from '@/components/auth/OryFlowForm';
import { Container } from '@/components/ui/Container';
import { Heading } from '@/components/ui/Heading';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Verify Email - Imajin',
  description: 'Verify your email address',
};

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: { flow?: string };
}) {
  let flow;

  try {
    if (searchParams.flow) {
      const { data } = await kratosFrontend.getVerificationFlow({
        id: searchParams.flow,
      });
      flow = data;
    } else {
      const { data } = await kratosFrontend.createBrowserVerificationFlow();
      redirect(`/auth/verify?flow=${data.id}`);
    }
  } catch (error) {
    redirect('/auth/error?error=FlowExpired');
  }

  return (
    <Container className="py-12">
      <div className="max-w-md mx-auto text-center">
        <Heading level={1} className="mb-6">
          Verify Your Email
        </Heading>

        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-6 py-4 rounded mb-6 text-left">
          <p className="font-medium mb-2">Verification email sent</p>
          <p className="text-sm">
            Check your email for a verification code and enter it below.
          </p>
        </div>

        <div className="bg-white border rounded-lg p-6">
          <OryFlowForm flow={flow} />
        </div>
      </div>
    </Container>
  );
}
```

---

## Account Settings Page (MFA Setup)

**File:** `app/auth/settings/page.tsx`

```typescript
import { requireAuth } from '@/lib/auth/session';
import { kratosFrontend } from '@/lib/auth/kratos';
import { OryFlowForm } from '@/components/auth/OryFlowForm';
import { Container } from '@/components/ui/Container';
import { Heading } from '@/components/ui/Heading';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Account Settings - Imajin',
  description: 'Manage your account settings',
};

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: { flow?: string };
}) {
  await requireAuth();

  let flow;

  try {
    if (searchParams.flow) {
      const { data } = await kratosFrontend.getSettingsFlow({
        id: searchParams.flow,
      });
      flow = data;
    } else {
      const { data } = await kratosFrontend.createBrowserSettingsFlow();
      redirect(`/auth/settings?flow=${data.id}`);
    }
  } catch (error) {
    redirect('/auth/error?error=FlowExpired');
  }

  return (
    <Container className="py-12">
      <div className="max-w-2xl mx-auto">
        <Heading level={1} className="mb-8">
          Account Settings
        </Heading>

        <div className="space-y-8">
          <section className="bg-white border rounded-lg p-6">
            <Heading level={2} className="mb-4">
              Profile
            </Heading>
            <OryFlowForm flow={flow} />
          </section>

          <section className="bg-white border rounded-lg p-6">
            <Heading level={2} className="mb-4">
              Two-Factor Authentication
            </Heading>
            <p className="text-sm text-gray-600 mb-4">
              Secure your account with time-based one-time passwords (TOTP).
            </p>
            <OryFlowForm flow={flow} />
          </section>
        </div>
      </div>
    </Container>
  );
}
```

---

## MFA Required Page (Admin Enforcement)

**File:** `app/auth/mfa-required/page.tsx`

```typescript
import { requireAuth } from '@/lib/auth/session';
import { Container } from '@/components/ui/Container';
import { Heading } from '@/components/ui/Heading';
import { Button } from '@/components/ui/Button';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const metadata = {
  title: 'MFA Required - Imajin',
  description: 'Multi-factor authentication required',
};

export default async function MFARequiredPage() {
  const session = await requireAuth();

  // If already has MFA, redirect to admin
  if (session.kratosSession.authenticator_assurance_level === 'aal2') {
    redirect('/admin');
  }

  return (
    <Container className="py-12">
      <div className="max-w-md mx-auto text-center">
        <Heading level={1} className="mb-6 text-red-600">
          MFA Required
        </Heading>

        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded mb-6 text-left">
          <p className="font-medium mb-2">Admin accounts require two-factor authentication</p>
          <p className="text-sm">
            For security, admin accounts must have multi-factor authentication enabled
            before accessing the admin panel.
          </p>
        </div>

        <Link href="/auth/settings">
          <Button className="w-full">
            Set Up Two-Factor Authentication
          </Button>
        </Link>
      </div>
    </Container>
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
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { Suspense } from 'react';

const errorMessages: Record<string, string> = {
  Configuration: 'There is a problem with the server configuration.',
  FlowExpired: 'The authentication flow has expired. Please try again.',
  AccessDenied: 'You do not have permission to sign in.',
  Verification: 'The verification link is invalid or has expired.',
  SessionRefreshRequired: 'Your session needs to be refreshed.',
  Default: 'An error occurred during authentication.',
};

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error') || 'Default';
  const message = errorMessages[error] || errorMessages.Default;

  return (
    <>
      <Heading level={1} className="mb-4">
        Authentication Error
      </Heading>

      <div className="bg-red-50 border border-red-200 text-red-600 px-6 py-4 rounded mb-6">
        <p>{message}</p>
      </div>

      <Link href="/auth/signin">
        <Button className="w-full">
          Back to Sign In
        </Button>
      </Link>
    </>
  );
}

export default function AuthErrorPage() {
  return (
    <Container className="py-12">
      <div className="max-w-md mx-auto text-center">
        <Suspense fallback={<div>Loading...</div>}>
          <ErrorContent />
        </Suspense>
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

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';

interface UserNavProps {
  session: {
    user: {
      id: string;
      email: string;
      name: string | null;
      role: string;
    };
  } | null;
}

export function UserNav({ session }: UserNavProps) {
  const router = useRouter();
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

  async function handleSignOut() {
    setIsOpen(false);

    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Sign out error:', error);
    }
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
        aria-label="User menu"
        aria-expanded={isOpen}
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
        <div className="absolute right-0 mt-2 w-48 bg-white border rounded shadow-lg py-1 z-50">
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
          <Link
            href="/auth/settings"
            className="block px-4 py-2 text-sm hover:bg-gray-100"
            onClick={() => setIsOpen(false)}
          >
            Settings
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
            onClick={handleSignOut}
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
import { getSession } from '@/lib/auth/session';
import { UserNav } from '@/components/auth/UserNav';

export async function Header() {
  const session = await getSession();

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <a href="/" className="text-xl font-bold">
          Imajin
        </a>

        <nav className="flex items-center gap-6">
          <a href="/products">Products</a>
          <a href="/portfolio">Portfolio</a>
          <a href="/about">About</a>
          <a href="/contact">Contact</a>
        </nav>

        <UserNav session={session} />
      </div>
    </header>
  );
}
```

---

## Implementation Steps

### Step 1: Create OryFlowForm Component (90 min)

- [ ] Create `components/auth/OryFlowForm.tsx`
- [ ] Handle all node types (input, button, script)
- [ ] Add error display (flow messages, field messages)
- [ ] Add loading states
- [ ] Test with login flow manually

### Step 2: Create Sign In Page (30 min)

- [ ] Create `app/auth/signin/page.tsx`
- [ ] Initialize Ory login flow (server-side)
- [ ] Render OryFlowForm
- [ ] Add forgot password link
- [ ] Add sign up link
- [ ] Test signin works

### Step 3: Create Sign Up Page (30 min)

- [ ] Create `app/auth/signup/page.tsx`
- [ ] Initialize Ory registration flow
- [ ] Render OryFlowForm
- [ ] Add password requirements hint
- [ ] Add sign in link
- [ ] Test signup works

### Step 4: Create Recovery Page (30 min)

- [ ] Create `app/auth/recovery/page.tsx`
- [ ] Initialize Ory recovery flow
- [ ] Render OryFlowForm
- [ ] Add back to sign in link
- [ ] Test recovery flow

### Step 5: Create Verification Page (30 min)

- [ ] Create `app/auth/verify/page.tsx`
- [ ] Initialize Ory verification flow
- [ ] Render OryFlowForm
- [ ] Add instructions
- [ ] Test verification flow

### Step 6: Create Settings Page (45 min)

- [ ] Create `app/auth/settings/page.tsx`
- [ ] Initialize Ory settings flow
- [ ] Render OryFlowForm (profile + MFA sections)
- [ ] Add section headings
- [ ] Test profile update
- [ ] Test MFA setup

### Step 7: Create MFA Required Page (15 min)

- [ ] Create `app/auth/mfa-required/page.tsx`
- [ ] Check AAL level (redirect if already MFA)
- [ ] Display warning message
- [ ] Link to settings page

### Step 8: Create Error Page (15 min)

- [ ] Create `app/auth/error/page.tsx`
- [ ] Handle common error types
- [ ] Display error message
- [ ] Add back to sign in link

### Step 9: Create UserNav Component (45 min)

- [ ] Create `components/auth/UserNav.tsx`
- [ ] Server-side session prop
- [ ] Dropdown open/close logic
- [ ] Sign out handler
- [ ] Add to Header component
- [ ] Test navigation

### Step 10: Styling & Accessibility (60 min)

- [ ] Consistent design system usage
- [ ] Keyboard navigation (dropdown)
- [ ] ARIA labels (all forms)
- [ ] Focus management
- [ ] Mobile responsiveness
- [ ] Screen reader testing

---

## Acceptance Criteria

- [ ] Sign in page works (Ory login flow)
- [ ] Sign up page works (Ory registration flow)
- [ ] Password recovery works (Ory recovery flow)
- [ ] Email verification works (Ory verification flow)
- [ ] Settings page works (profile + MFA)
- [ ] MFA required page displays correctly
- [ ] Error page handles all error types
- [ ] User dropdown works (navigation, sign out)
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
- [ ] Test callback URL redirect

**Sign Up:**
- [ ] Create account with valid data
- [ ] Test password too short (Ory validation)
- [ ] Test duplicate email (Ory validation)
- [ ] Test passwords don't match (if confirm field exists)
- [ ] Verify redirect to verification page
- [ ] Check email for verification code

**Password Recovery:**
- [ ] Request reset for existing email
- [ ] Request reset for non-existent email
- [ ] Test "back to sign in" link
- [ ] Check email for recovery code
- [ ] Submit recovery code
- [ ] Test invalid/expired code

**Email Verification:**
- [ ] Check email for verification code
- [ ] Submit verification code
- [ ] Test invalid code
- [ ] Test expired code

**Settings:**
- [ ] Update profile name
- [ ] Update email (requires verification)
- [ ] Set up TOTP MFA (scan QR code)
- [ ] Enter TOTP code to confirm
- [ ] Verify MFA enabled (check AAL level)

**MFA Required:**
- [ ] Access as admin without MFA (redirects)
- [ ] Link to settings works
- [ ] After MFA setup, can access admin

**User Nav:**
- [ ] Shows when signed in
- [ ] Shows "Sign In" when signed out
- [ ] Dropdown open/close
- [ ] Sign out works
- [ ] Admin link (admin user only)
- [ ] Navigation links work

---

## Next Steps

After Phase 4.4.3 complete:
1. **Phase 4.4.4:** Integrate Ory SDK (session helpers, webhook handler, middleware)
2. **Phase 4.4.5:** Protected routes (middleware)
3. **Phase 4.4.6:** Integration with existing features (orders, account pages)

---

**See Also:**
- `docs/tasks/Phase 4.4.2 - Ory Kratos Setup.md` - Previous phase
- `docs/tasks/Phase 4.4.4 - Ory SDK Integration.md` - Next phase
- `docs/tasks/Phase 4.4 - Authentication.md` - Parent task
- Ory Kratos Self-Service Flows: https://www.ory.sh/docs/kratos/self-service
