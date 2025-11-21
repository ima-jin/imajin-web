import { describe, it, expect, vi, beforeEach } from 'vitest';
import { requireAuth, requireAdmin, requireAdminWithMFA, getLocalUser } from '@/lib/auth/guards';
import { getServerSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { db } from '@/db';

// Mock dependencies
vi.mock('@/lib/auth/session', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn(() => {
    throw new Error('NEXT_REDIRECT');
  }),
}));

vi.mock('@/db', () => ({
  db: {
    query: {
      users: {
        findFirst: vi.fn(),
      },
    },
  },
}));

describe('Auth Guards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('requireAuth', () => {
    it('should redirect to signin when not authenticated', async () => {
      (getServerSession as any).mockResolvedValue(null);

      try {
        await requireAuth();
        expect.fail('Should have redirected');
      } catch (error: any) {
        expect(error.message).toBe('NEXT_REDIRECT');
      }

      expect(redirect).toHaveBeenCalledWith('/auth/signin');
    });

    it('should return session when authenticated', async () => {
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
        authenticator_assurance_level: 'aal1',
      };

      (getServerSession as any).mockResolvedValue(mockSession);

      const session = await requireAuth();

      expect(session).toEqual(mockSession);
      expect(redirect).not.toHaveBeenCalled();
    });
  });

  describe('requireAdmin', () => {
    it('should redirect to signin when not authenticated', async () => {
      (getServerSession as any).mockResolvedValue(null);

      try {
        await requireAdmin();
        expect.fail('Should have redirected');
      } catch (error: any) {
        expect(error.message).toBe('NEXT_REDIRECT');
      }

      expect(redirect).toHaveBeenCalledWith('/auth/signin');
    });

    it('should redirect to home when user is not admin', async () => {
      const mockSession = {
        active: true,
        identity: {
          id: 'kratos-123',
          traits: {
            email: 'customer@example.com',
            role: 'customer',
          },
        },
      };

      (getServerSession as any).mockResolvedValue(mockSession);

      try {
        await requireAdmin();
        expect.fail('Should have redirected');
      } catch (error: any) {
        expect(error.message).toBe('NEXT_REDIRECT');
      }

      expect(redirect).toHaveBeenCalledWith('/');
    });

    it('should return session when user is admin', async () => {
      const mockSession = {
        active: true,
        identity: {
          id: 'kratos-admin',
          traits: {
            email: 'admin@example.com',
            role: 'admin',
          },
        },
      };

      (getServerSession as any).mockResolvedValue(mockSession);

      const session = await requireAdmin();

      expect(session).toEqual(mockSession);
      expect(redirect).not.toHaveBeenCalled();
    });
  });

  describe('requireAdminWithMFA', () => {
    it('should redirect to MFA page when admin has no MFA', async () => {
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

      (getServerSession as any).mockResolvedValue(mockSession);

      try {
        await requireAdminWithMFA();
        expect.fail('Should have redirected');
      } catch (error: any) {
        expect(error.message).toBe('NEXT_REDIRECT');
      }

      expect(redirect).toHaveBeenCalledWith('/auth/mfa-required');
    });

    it('should return session when admin has MFA enabled', async () => {
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

      (getServerSession as any).mockResolvedValue(mockSession);

      const session = await requireAdminWithMFA();

      expect(session).toEqual(mockSession);
      expect(redirect).not.toHaveBeenCalled();
    });
  });

  describe('getLocalUser', () => {
    it('should return local user record', async () => {
      const mockSession = {
        active: true,
        identity: {
          id: 'kratos-123',
          traits: {
            email: 'test@example.com',
          },
        },
      };

      const mockUser = {
        id: 'local-123',
        kratosId: 'kratos-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'customer',
      };

      (getServerSession as any).mockResolvedValue(mockSession);
      (db.query.users.findFirst as any).mockResolvedValue(mockUser);

      const user = await getLocalUser();

      expect(user).toEqual(mockUser);
      expect(db.query.users.findFirst).toHaveBeenCalled();
    });

    it('should throw error when user not found in database', async () => {
      const mockSession = {
        active: true,
        identity: {
          id: 'kratos-orphan',
          traits: { email: 'orphan@example.com' },
        },
      };

      (getServerSession as any).mockResolvedValue(mockSession);
      (db.query.users.findFirst as any).mockResolvedValue(null);

      await expect(getLocalUser()).rejects.toThrow('User not found in local database');
    });
  });
});
