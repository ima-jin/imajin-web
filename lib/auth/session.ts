/**
 * Session helpers for Ory Kratos authentication
 * Low-level functions for session management
 * Use guards.ts for route protection with redirects
 */

import { kratosFrontend } from './kratos';
import { cookies } from 'next/headers';
import type { Session } from '@ory/client';

/**
 * Get current session (server-side only)
 * Returns Session or null, does not redirect
 */
export async function getServerSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('ory_session_imajinweb')?.value;

  if (!sessionCookie) {
    return null;
  }

  try {
    const { data } = await kratosFrontend.toSession({
      cookie: `ory_session_imajinweb=${sessionCookie}`,
    });
    return data.active ? data : null;
  } catch (error) {
    return null;
  }
}

/**
 * Check if request is from authenticated user
 * Use in API routes for conditional logic
 */
export async function isAuthenticatedRequest(): Promise<boolean> {
  const session = await getServerSession();
  return !!session;
}

/**
 * Get authenticated user ID from request
 * Throws if not authenticated
 * Returns Kratos identity ID
 */
export async function getAuthenticatedUserId(): Promise<string> {
  const session = await getServerSession();
  if (!session || !session.identity) {
    throw new Error('Unauthorized');
  }
  return session.identity.id;
}

/**
 * Get local user ID from request
 * Throws if not authenticated
 * Returns local database user ID
 */
export async function getLocalUserId(): Promise<string> {
  const session = await getServerSession();
  if (!session || !session.identity) {
    throw new Error('Unauthorized');
  }

  const { db } = await import('@/db');
  const { users } = await import('@/db/schema-auth');
  const { eq } = await import('drizzle-orm');

  const user = await db.query.users.findFirst({
    where: eq(users.kratosId, session.identity.id),
    columns: { id: true },
  });

  if (!user) {
    throw new Error('User not found in local database');
  }

  return user.id;
}

/**
 * Get full local user record from database
 * Throws if not authenticated
 * Returns complete user object
 */
export async function getLocalUser() {
  const session = await getServerSession();
  if (!session || !session.identity) {
    throw new Error('Unauthorized');
  }

  const { db } = await import('@/db');
  const { users } = await import('@/db/schema-auth');
  const { eq } = await import('drizzle-orm');

  const user = await db.query.users.findFirst({
    where: eq(users.kratosId, session.identity.id),
  });

  if (!user) {
    throw new Error('User not found in local database');
  }

  return user;
}

/**
 * Check if request is from admin user
 * Use in API routes for conditional logic
 */
export async function isAdminRequest(): Promise<boolean> {
  const session = await getServerSession();
  return session?.identity?.traits?.role === 'admin';
}

/**
 * Check if request is from admin with MFA
 * Use in sensitive API routes
 */
export async function isAdminWithMFA(): Promise<boolean> {
  const session = await getServerSession();
  return (
    session?.identity?.traits?.role === 'admin' &&
    session?.authenticator_assurance_level === 'aal2'
  );
}
