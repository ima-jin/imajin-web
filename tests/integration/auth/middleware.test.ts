import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { middleware } from '@/middleware';
import { kratosFrontend } from '@/lib/auth/kratos';

// Mock Ory SDK
vi.mock('@/lib/auth/kratos', () => ({
  kratosFrontend: {
    toSession: vi.fn(),
  },
}));

describe('Auth Middleware with Ory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should redirect unauthenticated users from /account', async () => {
    const req = new NextRequest('http://localhost:30000/account');

    // No session cookie
    (kratosFrontend.toSession as any).mockRejectedValue(new Error('Unauthorized'));

    const response = await middleware(req);

    expect(response).toBeDefined();
    expect(response!.status).toBe(307);
    expect(response!.headers.get('location')).toContain('/auth/signin');
  });

  it('should redirect unauthenticated users from /admin', async () => {
    const req = new NextRequest('http://localhost:30000/admin');

    (kratosFrontend.toSession as any).mockRejectedValue(new Error('Unauthorized'));

    const response = await middleware(req);

    expect(response).toBeDefined();
    expect(response!.status).toBe(307);
    expect(response!.headers.get('location')).toContain('/auth/signin');
  });

  it('should redirect non-admin users from /admin', async () => {
    const req = new NextRequest('http://localhost:30000/admin');
    req.cookies.set('ory_session_imajinweb', 'customer_session');

    const mockSession = {
      active: true,
      identity: {
        id: 'kratos-customer',
        traits: {
          email: 'customer@example.com',
          role: 'customer',
        },
      },
      authenticator_assurance_level: 'aal1',
    };

    (kratosFrontend.toSession as any).mockResolvedValue({ data: mockSession });

    const response = await middleware(req);

    expect(response).toBeDefined();
    expect(response!.status).toBe(307);
    expect(response!.headers.get('location')).toBe('http://localhost:30000/');
  });

  it('should redirect admin without MFA to /auth/mfa-required', async () => {
    const req = new NextRequest('http://localhost:30000/admin');
    req.cookies.set('ory_session_imajinweb', 'admin_no_mfa_session');

    const mockSession = {
      active: true,
      identity: {
        id: 'kratos-admin',
        traits: {
          email: 'admin@example.com',
          role: 'admin',
        },
      },
      authenticator_assurance_level: 'aal1', // No MFA
    };

    (kratosFrontend.toSession as any).mockResolvedValue({ data: mockSession });

    const response = await middleware(req);

    expect(response).toBeDefined();
    expect(response!.status).toBe(307);
    expect(response!.headers.get('location')).toContain('/auth/mfa-required');
  });

  it('should allow admin with MFA to access /admin', async () => {
    const req = new NextRequest('http://localhost:30000/admin');
    req.cookies.set('ory_session_imajinweb', 'admin_with_mfa_session');

    const mockSession = {
      active: true,
      identity: {
        id: 'kratos-admin',
        traits: {
          email: 'admin@example.com',
          role: 'admin',
        },
      },
      authenticator_assurance_level: 'aal2', // MFA enabled
    };

    (kratosFrontend.toSession as any).mockResolvedValue({ data: mockSession });

    const response = await middleware(req);

    expect(response).toBeInstanceOf(NextResponse);
    // No redirect, request proceeds
  });

  it('should allow unauthenticated access to /auth/signin', async () => {
    const req = new NextRequest('http://localhost:30000/auth/signin');

    (kratosFrontend.toSession as any).mockRejectedValue(new Error('Unauthorized'));

    const response = await middleware(req);

    expect(response).toBeInstanceOf(NextResponse);
    // No redirect
  });

  it('should allow authenticated customer to access /account', async () => {
    const req = new NextRequest('http://localhost:30000/account');
    req.cookies.set('ory_session_imajinweb', 'customer_session');

    const mockSession = {
      active: true,
      identity: {
        id: 'kratos-customer',
        traits: {
          email: 'customer@example.com',
          role: 'customer',
        },
      },
      authenticator_assurance_level: 'aal1',
    };

    (kratosFrontend.toSession as any).mockResolvedValue({ data: mockSession });

    const response = await middleware(req);

    expect(response).toBeInstanceOf(NextResponse);
    // No redirect, customer can access their account
  });
});
