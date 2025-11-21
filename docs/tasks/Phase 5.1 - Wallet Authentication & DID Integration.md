# Phase 5.1 - Wallet Authentication & DID Integration

**Status:** 📋 Future Enhancement (Post-Launch)
**Priority:** LOW - Deferred until after Phase 4.4 (email/password auth) is complete
**Estimated Duration:** 4-6 days
**Target Completion:** TBD

---

> **NOTE:** This document was originally Phase 4.4.1 and has been moved to Phase 5.1.
>
> **Current Strategy:** Phase 4.4 implements email/password authentication using **Ory Kratos** (self-hosted identity provider) with a DID-ready database schema (nullable wallet fields in Ory identity traits + local shadow table). This enables a smooth migration path to wallet authentication without breaking changes.
>
> **Ory Integration for Wallet Auth:** When implementing wallet authentication, we will:
> 1. Create API endpoints for wallet signature verification (this document's implementation remains valid)
> 2. Use Ory Kratos Admin API to create/update identities with wallet_address traits
> 3. Keep local users table synced via existing webhook infrastructure
> 4. Leverage Ory session cookies for authenticated wallet users
> 5. No breaking changes to Ory identity schema (wallet fields already nullable)
>
> **See:** `docs/AUTH_STRATEGY.md` and Phase 4.4.1-4.4.7 task documents for the current Ory Kratos implementation.

---

## Overview

Implement hybrid authentication system supporting both:
1. **Solana Wallet Login** - For crypto-native users and Founder Edition buyers
2. **Email/Password Login** - For general customers (accessibility, implemented in Phase 4.4)

This enables a gradual transition to decentralized identity (DIDs) while maintaining accessibility for non-crypto users.

**Philosophy:** Meet users where they are, provide upgrade path to wallet-based auth.

---

## Business Requirements

### Use Cases

**1. Founder Edition Buyers**
- Already have Solana wallets (for NFT minting)
- Prefer wallet login (no passwords to manage)
- DID ties to their NFT ownership

**2. General Customers**
- May not have crypto wallets
- Familiar with email/password
- Can upgrade to wallet later

**3. Pre-Sale Deposit Holders**
- Need accounts to track deposits
- Link deposits to email initially
- Optionally link wallet for wholesale pricing access

**4. Admin Users**
- Use email/password for admin panel
- Multi-factor authentication (future)

---

## Technical Architecture

### Database Schema

**users table:**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identity (at least one required)
  did VARCHAR(255) UNIQUE,                    -- did:sol:... (optional initially)
  email VARCHAR(255) UNIQUE,                  -- email@example.com (optional if wallet-only)

  -- Authentication
  password_hash VARCHAR(255),                 -- bcrypt hash (null if wallet-only)
  wallet_public_key VARCHAR(255) UNIQUE,      -- Solana address (null if email-only)

  -- Profile
  name VARCHAR(255),
  role VARCHAR(50) NOT NULL DEFAULT 'customer', -- 'customer', 'admin'

  -- Account status
  email_verified BOOLEAN DEFAULT false,
  wallet_verified BOOLEAN DEFAULT false,
  last_login TIMESTAMP,

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_did ON users(did);
CREATE INDEX idx_users_wallet ON users(wallet_public_key);
```

**sessions table (optional, if using session-based auth):**
```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sessions_token ON sessions(token_hash);
CREATE INDEX idx_sessions_user ON sessions(user_id);
```

---

## Implementation Plan

### Step 1: Database Setup (2-3 hours)

**1.1 Update schema**
```bash
# Add users table to db/schema.ts
npm run db:push
```

**1.2 Seed admin user**
```typescript
// scripts/seed-admin.ts
import bcrypt from 'bcryptjs';

const adminUser = {
  email: 'info@imajin.ca',
  passwordHash: await bcrypt.hash(process.env.ADMIN_PASSWORD, 10),
  role: 'admin',
  emailVerified: true
};

await db.users.create(adminUser);
```

---

### Step 2: Email/Password Auth (6-8 hours)

**2.1 Install dependencies**
```bash
npm install bcryptjs jsonwebtoken
npm install -D @types/bcryptjs @types/jsonwebtoken
```

**2.2 Create auth service**
```typescript
// lib/services/auth-service.ts

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export interface RegisterParams {
  email: string;
  password: string;
  name?: string;
}

export interface LoginParams {
  email: string;
  password: string;
}

export async function register(params: RegisterParams) {
  const { email, password, name } = params;

  // Check if email exists
  const existing = await db.users.findFirst({
    where: { email }
  });

  if (existing) {
    throw new Error('Email already registered');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  // Create user
  const user = await db.users.create({
    data: {
      email,
      passwordHash,
      name,
      role: 'customer'
    }
  });

  // Generate JWT
  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  );

  return { user, token };
}

export async function login(params: LoginParams) {
  const { email, password } = params;

  // Find user
  const user = await db.users.findFirst({
    where: { email }
  });

  if (!user || !user.passwordHash) {
    throw new Error('Invalid email or password');
  }

  // Verify password
  const isValid = await bcrypt.compare(password, user.passwordHash);

  if (!isValid) {
    throw new Error('Invalid email or password');
  }

  // Update last login
  await db.users.update({
    where: { id: user.id },
    data: { lastLogin: new Date() }
  });

  // Generate JWT
  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  });

  return { user, token };
}

export async function verifyToken(token: string) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      email: string;
      role: string;
    };

    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}
```

**2.3 Create API routes**
```typescript
// app/api/auth/register/route.ts
import { register } from '@/lib/services/auth-service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { user, token } = await register(body);

    return Response.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      token
    });
  } catch (error) {
    return Response.json(
      { error: error.message },
      { status: 400 }
    );
  }
}

// app/api/auth/login/route.ts
import { login } from '@/lib/services/auth-service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { user, token } = await login(body);

    return Response.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      token
    });
  } catch (error) {
    return Response.json(
      { error: error.message },
      { status: 401 }
    );
  }
}

// app/api/auth/me/route.ts
import { verifyToken } from '@/lib/services/auth-service';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return Response.json({ error: 'No token provided' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    const user = await db.users.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    return Response.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        did: user.did,
        walletPublicKey: user.walletPublicKey
      }
    });
  } catch (error) {
    return Response.json({ error: 'Invalid token' }, { status: 401 });
  }
}
```

---

### Step 3: Solana Wallet Auth (8-10 hours)

**3.1 Install Solana dependencies**
```bash
npm install @solana/wallet-adapter-react @solana/wallet-adapter-react-ui
npm install @solana/wallet-adapter-wallets @solana/web3.js
npm install @solana/wallet-adapter-base
npm install bs58 tweetnacl
npm install -D @types/bs58
```

**3.2 Create wallet provider**
```typescript
// components/auth/WalletProvider.tsx
'use client';

import { useMemo } from 'react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';

require('@solana/wallet-adapter-react-ui/styles.css');

export function SolanaWalletProvider({ children }: { children: React.ReactNode }) {
  const network = WalletAdapterNetwork.Mainnet;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
```

**3.3 Create wallet login service**
```typescript
// lib/services/wallet-auth-service.ts
import { PublicKey } from '@solana/web3.js';
import nacl from 'tweetnacl';
import bs58 from 'bs58';
import jwt from 'jsonwebtoken';

export interface WalletLoginParams {
  publicKey: string;
  message: string;
  signature: string;
}

export async function walletLogin(params: WalletLoginParams) {
  const { publicKey, message, signature } = params;

  // Verify signature
  const pubKey = new PublicKey(publicKey);
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

  // Create or update user
  const did = `did:sol:${publicKey}`;
  const user = await db.users.upsert({
    where: { did },
    update: {
      lastLogin: new Date(),
      walletVerified: true
    },
    create: {
      did,
      walletPublicKey: publicKey,
      role: 'customer',
      walletVerified: true
    }
  });

  // Generate JWT
  const token = jwt.sign(
    { userId: user.id, did: user.did, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  );

  return { user, token };
}

export async function linkWallet(userId: string, params: WalletLoginParams) {
  const { publicKey, message, signature } = params;

  // Verify signature
  const pubKey = new PublicKey(publicKey);
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

  // Check if wallet already linked to another user
  const existing = await db.users.findFirst({
    where: { walletPublicKey: publicKey }
  });

  if (existing && existing.id !== userId) {
    throw new Error('Wallet already linked to another account');
  }

  // Link wallet to user
  const did = `did:sol:${publicKey}`;
  const user = await db.users.update({
    where: { id: userId },
    data: {
      did,
      walletPublicKey: publicKey,
      walletVerified: true
    }
  });

  return { user };
}
```

**3.4 Create wallet login API route**
```typescript
// app/api/auth/wallet/login/route.ts
import { walletLogin } from '@/lib/services/wallet-auth-service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { user, token } = await walletLogin(body);

    return Response.json({
      user: {
        id: user.id,
        did: user.did,
        walletPublicKey: user.walletPublicKey,
        role: user.role
      },
      token
    });
  } catch (error) {
    return Response.json(
      { error: error.message },
      { status: 401 }
    );
  }
}

// app/api/auth/wallet/link/route.ts
import { linkWallet } from '@/lib/services/wallet-auth-service';
import { verifyToken } from '@/lib/services/auth-service';

export async function POST(request: Request) {
  try {
    // Verify user is logged in
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const decoded = await verifyToken(token);

    // Link wallet
    const body = await request.json();
    const { user } = await linkWallet(decoded.userId, body);

    return Response.json({
      user: {
        id: user.id,
        email: user.email,
        did: user.did,
        walletPublicKey: user.walletPublicKey
      }
    });
  } catch (error) {
    return Response.json(
      { error: error.message },
      { status: 400 }
    );
  }
}
```

**3.5 Create wallet login button**
```typescript
// components/auth/WalletLoginButton.tsx
'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useEffect } from 'react';
import bs58 from 'bs58';

export function WalletLoginButton() {
  const { publicKey, signMessage, connected } = useWallet();

  const handleLogin = async () => {
    if (!publicKey || !signMessage) return;

    try {
      // Create challenge message
      const message = `Sign to login: ${Date.now()}`;
      const messageBytes = new TextEncoder().encode(message);

      // Request signature
      const signature = await signMessage(messageBytes);

      // Send to backend
      const response = await fetch('/api/auth/wallet/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          publicKey: publicKey.toString(),
          message,
          signature: bs58.encode(signature)
        })
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const { token, user } = await response.json();

      // Store token
      localStorage.setItem('authToken', token);

      // Redirect or update UI
      window.location.href = '/account';
    } catch (error) {
      console.error('Wallet login failed:', error);
      alert('Login failed. Please try again.');
    }
  };

  useEffect(() => {
    if (connected && publicKey) {
      handleLogin();
    }
  }, [connected, publicKey]);

  return <WalletMultiButton />;
}
```

---

### Step 4: UI Components (4-6 hours)

**4.1 Login page**
```typescript
// app/login/page.tsx
import { LoginForm } from '@/components/auth/LoginForm';
import { WalletLoginButton } from '@/components/auth/WalletLoginButton';

export default function LoginPage() {
  return (
    <div className="container max-w-md mx-auto py-16">
      <h1 className="text-3xl font-bold mb-8">Login</h1>

      {/* Wallet login (preferred) */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Connect Wallet</h2>
        <WalletLoginButton />
        <p className="text-sm text-gray-600 mt-2">
          For Founder Edition buyers and crypto users
        </p>
      </div>

      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Or</span>
        </div>
      </div>

      {/* Email/password login (fallback) */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Login with Email</h2>
        <LoginForm />
        <p className="text-sm text-gray-600 mt-4">
          Don't have an account? <a href="/register" className="text-blue-600">Sign up</a>
        </p>
      </div>
    </div>
  );
}
```

**4.2 Register page**
```typescript
// app/register/page.tsx
import { RegisterForm } from '@/components/auth/RegisterForm';

export default function RegisterPage() {
  return (
    <div className="container max-w-md mx-auto py-16">
      <h1 className="text-3xl font-bold mb-8">Create Account</h1>
      <RegisterForm />
      <p className="text-sm text-gray-600 mt-4">
        Already have an account? <a href="/login" className="text-blue-600">Login</a>
      </p>
    </div>
  );
}
```

**4.3 Account page (link wallet)**
```typescript
// app/account/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { WalletLinkButton } from '@/components/auth/WalletLinkButton';

export default function AccountPage() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Fetch user data
    const fetchUser = async () => {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setUser(data.user);
    };

    fetchUser();
  }, []);

  if (!user) return <div>Loading...</div>;

  return (
    <div className="container max-w-2xl mx-auto py-16">
      <h1 className="text-3xl font-bold mb-8">Account</h1>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <p>{user.email || 'Not set'}</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Wallet</label>
          {user.walletPublicKey ? (
            <p className="font-mono text-sm">{user.walletPublicKey}</p>
          ) : (
            <div>
              <p className="text-gray-600 mb-2">No wallet linked</p>
              <WalletLinkButton />
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">DID</label>
          <p className="font-mono text-sm">{user.did || 'Not set'}</p>
        </div>
      </div>
    </div>
  );
}
```

---

### Step 5: Middleware & Protected Routes (2-3 hours)

**5.1 Auth middleware**
```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/services/auth-service';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('authToken')?.value ||
                request.headers.get('authorization')?.replace('Bearer ', '');

  // Protected routes
  const protectedRoutes = ['/account', '/orders'];
  const isProtected = protectedRoutes.some(route =>
    request.nextUrl.pathname.startsWith(route)
  );

  if (isProtected && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (token) {
    try {
      await verifyToken(token);
      return NextResponse.next();
    } catch (error) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/account/:path*', '/orders/:path*', '/admin/:path*']
};
```

---

## Testing Strategy

### Unit Tests

```typescript
// tests/unit/lib/services/auth-service.test.ts
describe('auth-service', () => {
  describe('register', () => {
    it('should create user with hashed password', async () => {
      const result = await register({
        email: 'test@example.com',
        password: 'password123'
      });

      expect(result.user.email).toBe('test@example.com');
      expect(result.user.passwordHash).not.toBe('password123');
      expect(result.token).toBeTruthy();
    });

    it('should throw error if email exists', async () => {
      await register({ email: 'test@example.com', password: 'pw' });

      await expect(
        register({ email: 'test@example.com', password: 'pw2' })
      ).rejects.toThrow('Email already registered');
    });
  });

  describe('login', () => {
    it('should return token for valid credentials', async () => {
      await register({ email: 'test@example.com', password: 'password123' });

      const result = await login({
        email: 'test@example.com',
        password: 'password123'
      });

      expect(result.token).toBeTruthy();
      expect(result.user.email).toBe('test@example.com');
    });

    it('should throw error for invalid password', async () => {
      await register({ email: 'test@example.com', password: 'password123' });

      await expect(
        login({ email: 'test@example.com', password: 'wrongpassword' })
      ).rejects.toThrow('Invalid email or password');
    });
  });
});

// tests/unit/lib/services/wallet-auth-service.test.ts
describe('wallet-auth-service', () => {
  it('should verify valid wallet signature', async () => {
    // Mock signature verification
    // Test implementation
  });

  it('should create user with DID on wallet login', async () => {
    // Test implementation
  });

  it('should link wallet to existing user', async () => {
    // Test implementation
  });

  it('should prevent linking wallet to multiple users', async () => {
    // Test implementation
  });
});
```

### Integration Tests

```typescript
// tests/integration/api/auth.test.ts
describe('POST /api/auth/register', () => {
  it('should create user and return token', async () => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.user.email).toBe('test@example.com');
    expect(data.token).toBeTruthy();
  });
});

describe('POST /api/auth/wallet/login', () => {
  it('should login with valid wallet signature', async () => {
    // Mock Solana wallet signature
    // Test implementation
  });
});
```

---

## Acceptance Criteria

- [ ] Database schema includes users table with DID and email fields
- [ ] Email/password registration works
- [ ] Email/password login works and returns JWT
- [ ] Solana wallet login works with signature verification
- [ ] Users can link wallet to existing email account
- [ ] Protected routes require authentication
- [ ] JWT tokens expire after 7 days
- [ ] Passwords hashed with bcrypt
- [ ] Admin users can be created via seed script
- [ ] Login page shows both wallet and email options
- [ ] Account page displays linked wallet/email
- [ ] All unit tests passing (auth-service, wallet-auth-service)
- [ ] All integration tests passing (API routes)
- [ ] Security audit complete (no plaintext passwords, secure JWT)

---

## Security Considerations

**1. Password Security**
- Bcrypt with salt rounds >= 10
- Password minimum length: 8 characters
- No password in logs or error messages

**2. JWT Security**
- Strong secret (min 32 bytes)
- Short expiry (7 days)
- Include only necessary claims (userId, role)
- Verify signature on every request

**3. Wallet Security**
- Verify signature on every wallet login
- Check message timestamp (prevent replay attacks)
- Never store private keys (user's responsibility)

**4. Session Security**
- HttpOnly cookies for browser (if using cookies)
- Secure flag (HTTPS only)
- SameSite=Strict (CSRF protection)

---

## Environment Variables

```bash
# .env.local
JWT_SECRET=your-super-secret-jwt-key-minimum-32-bytes
ADMIN_PASSWORD=your-admin-password-for-seed-script

# Optional: If using custom Solana RPC
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
```

---

## Rollback Plan

If auth system has issues:
1. Keep checkout as guest (email-only, no account)
2. Orders still tracked by email in orders table
3. Disable login/register pages
4. Deploy fix and re-enable

**Guest checkout always works** - auth is optional enhancement.

---

## Dependencies

**Requires:**
- PostgreSQL database
- JWT secret configured

**Blocks:**
- Pre-sale deposit self-service refunds (need login to request)
- Order history page (need login to view)
- Admin panel (need login with admin role)

---

## Estimated Timeline

- **Day 1**: Database schema + email auth backend (8h)
- **Day 2**: Wallet auth backend + API routes (8h)
- **Day 3**: UI components (login, register, account) (8h)
- **Day 4**: Middleware, protected routes, testing (8h)
- **Day 5**: Integration testing, security audit (4h)
- **Day 6**: Bug fixes, polish, documentation (4h)

**Total: 4-6 days**

---

## Future Enhancements

See also:
- **Phase 4.4.8**: Verifiable Credentials (TBD)
- **Phase 4.4.9**: Full Self-Sovereign Identity (TBD)

### Phase 4.4.8: Verifiable Credentials (Future - No Fixed Date)

**Goal:** Issue W3C-compliant verifiable credentials for user actions

**Credential Types:**
- "Verified Email" (after email confirmation)
- "Founder Edition Owner" (after NFT mint)
- "Customer Since YYYY" (loyalty credential)
- "Address Verified" (after first successful delivery)

**Implementation:**
- Use `@veramo/core` or `@spruceid/didkit-wasm`
- Store credential hashes on Solana
- Full credentials in user's wallet (IPFS or local)
- Users present credentials for special access/discounts

**Estimated:** 2-3 weeks when prioritized

---

### Phase 4.4.9: Full Self-Sovereign Identity (Future - No Fixed Date)

**Goal:** Transition to DID-first identity system

**Changes:**
- Email/password becomes backup recovery method
- Primary login via DID wallet
- Portable identity across services
- Zero-knowledge proofs for privacy-preserving auth
- Integration with MJN token attention marketplace

**Implementation:**
- Migrate existing users to DIDs
- Issue migration credentials
- Update all auth flows to prefer DID
- Deprecate password auth (but keep for recovery)

**Estimated:** 4-6 weeks when prioritized

**Reference:** See `https://github.com/ima-jin/imajin-token/blob/main/layer-2-identity/IDENTITY_LAYER.md` for full vision

---

## Related Documents

- [MJN Identity Layer](D:/Projects/imajin/imajin-ai/mjn/layer-2-identity/IDENTITY_LAYER.md)
- [Phase 4.4 - Auth & Admin](../IMPLEMENTATION_PLAN.md#44-auth--admin)
- [Database Schema](../DATABASE_SCHEMA.md)
