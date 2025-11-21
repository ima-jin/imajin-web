import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getServerSession, isAuthenticatedRequest, getLocalUserId } from '@/lib/auth/session';
import { kratosFrontend } from '@/lib/auth/kratos';
import { db } from '@/db';

// Mock Ory SDK
vi.mock('@/lib/auth/kratos', () => ({
  kratosFrontend: {
    toSession: vi.fn(),
  },
}));

// Mock database
vi.mock('@/db', () => ({
  db: {
    query: {
      users: {
        findFirst: vi.fn(),
      },
    },
  },
}));

// Mock Next.js cookies
vi.mock('next/headers', () => ({
  cookies: vi.fn(),
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
        authenticator_assurance_level: 'aal1',
      };

      (kratosFrontend.toSession as any).mockResolvedValue({ data: mockSession });

      // Mock cookies
      const { cookies } = await import('next/headers');
      (cookies as any).mockResolvedValue({
        get: () => ({ value: 'mock_session_token' }),
      });

      const session = await getServerSession();

      expect(session).toEqual(mockSession);
      expect(kratosFrontend.toSession).toHaveBeenCalledWith({
        cookie: 'ory_session_imajinweb=mock_session_token',
      });
    });

    it('should return null when no cookie exists', async () => {
      // Mock no cookie
      const { cookies } = await import('next/headers');
      (cookies as any).mockResolvedValue({
        get: () => undefined,
      });

      const session = await getServerSession();

      expect(session).toBeNull();
      expect(kratosFrontend.toSession).not.toHaveBeenCalled();
    });

    it('should return null when session is invalid', async () => {
      (kratosFrontend.toSession as any).mockRejectedValue(new Error('Unauthorized'));

      const { cookies } = await import('next/headers');
      (cookies as any).mockResolvedValue({
        get: () => ({ value: 'invalid_token' }),
      });

      const session = await getServerSession();

      expect(session).toBeNull();
    });

    it('should return null when session is not active', async () => {
      const mockSession = {
        active: false,
        identity: { id: 'kratos-123' },
      };

      (kratosFrontend.toSession as any).mockResolvedValue({ data: mockSession });

      const { cookies } = await import('next/headers');
      (cookies as any).mockResolvedValue({
        get: () => ({ value: 'expired_token' }),
      });

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

      const { cookies } = await import('next/headers');
      (cookies as any).mockResolvedValue({
        get: () => ({ value: 'valid_token' }),
      });

      const isAuth = await isAuthenticatedRequest();

      expect(isAuth).toBe(true);
    });

    it('should return false when no session', async () => {
      const { cookies } = await import('next/headers');
      (cookies as any).mockResolvedValue({
        get: () => undefined,
      });

      const isAuth = await isAuthenticatedRequest();

      expect(isAuth).toBe(false);
    });
  });

  describe('getLocalUserId', () => {
    it('should return local user ID when user exists', async () => {
      const mockSession = {
        active: true,
        identity: {
          id: 'kratos-123',
          traits: { email: 'test@example.com' },
        },
      };

      (kratosFrontend.toSession as any).mockResolvedValue({ data: mockSession });

      const { cookies } = await import('next/headers');
      (cookies as any).mockResolvedValue({
        get: () => ({ value: 'valid_token' }),
      });

      (db.query.users.findFirst as any).mockResolvedValue({
        id: 'local-user-123',
        kratosId: 'kratos-123',
      });

      const userId = await getLocalUserId();

      expect(userId).toBe('local-user-123');
      expect(db.query.users.findFirst).toHaveBeenCalled();
    });

    it('should throw error when not authenticated', async () => {
      const { cookies } = await import('next/headers');
      (cookies as any).mockResolvedValue({
        get: () => undefined,
      });

      await expect(getLocalUserId()).rejects.toThrow('Unauthorized');
    });

    it('should throw error when local user not found', async () => {
      const mockSession = {
        active: true,
        identity: {
          id: 'kratos-orphan',
          traits: { email: 'orphan@example.com' },
        },
      };

      (kratosFrontend.toSession as any).mockResolvedValue({ data: mockSession });

      const { cookies } = await import('next/headers');
      (cookies as any).mockResolvedValue({
        get: () => ({ value: 'valid_token' }),
      });

      (db.query.users.findFirst as any).mockResolvedValue(null);

      await expect(getLocalUserId()).rejects.toThrow('User not found in local database');
    });
  });
});
