/**
 * Auth guards for server components and route handlers
 * Guards redirect to appropriate pages when conditions aren't met
 * Use these in Server Components, Route Handlers, and Server Actions
 */

import { kratosFrontend } from '@/lib/auth/kratos';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { Session } from '@ory/client';

/**
 * Get current Ory session (no redirect)
 * Use when session is optional
 */
export async function getSession(): Promise<Session | null> {
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
 * Server-side guard: Require authentication
 * Redirects to signin if not authenticated
 * Use in Server Components and Route Handlers
 */
export async function requireAuth(): Promise<Session> {
  const session = await getSession();
  if (!session) {
    redirect('/auth/signin');
  }
  return session;
}

/**
 * Server-side guard: Require admin role
 * Redirects to signin if not authenticated, home if not admin
 * Use in Server Components and Route Handlers
 */
export async function requireAdmin(): Promise<Session> {
  const session = await getSession();
  if (!session || !session.identity) {
    redirect('/auth/signin');
  }
  if (session.identity.traits.role !== 'admin') {
    redirect('/');
  }
  return session;
}

/**
 * Server-side guard: Require admin with MFA (AAL2)
 * Redirects to MFA setup if admin doesn't have 2FA enabled
 * Use in sensitive admin routes
 */
export async function requireAdminWithMFA(): Promise<Session> {
  const session = await requireAdmin();
  if (session.authenticator_assurance_level !== 'aal2') {
    redirect('/auth/mfa-required');
  }
  return session;
}

/**
 * Server-side check: Is user authenticated?
 * Use for conditional rendering in Server Components
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return !!session;
}

/**
 * Server-side check: Is user admin?
 * Use for conditional rendering in Server Components
 */
export async function isAdmin(): Promise<boolean> {
  const session = await getSession();
  return session?.identity?.traits?.role === 'admin';
}

/**
 * Get current user ID (throws if not authenticated)
 * Use when you need just the user ID
 * Returns Kratos identity ID
 */
export async function getUserId(): Promise<string> {
  const session = await requireAuth();
  if (!session.identity) {
    throw new Error('Session has no identity');
  }
  return session.identity.id;
}

/**
 * Get local user from database by Kratos ID
 * Use when you need full user record
 * Throws if not authenticated or not found in DB
 */
export async function getLocalUser() {
  const session = await requireAuth();
  if (!session.identity) {
    throw new Error('Session has no identity');
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
