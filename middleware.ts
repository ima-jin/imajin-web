import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { kratosFrontend } from '@/lib/auth/kratos';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Get Ory session cookie
  const sessionCookie = req.cookies.get('ory_session_imajinweb')?.value;

  let session = null;
  let isAuthenticated = false;
  let isAdmin = false;
  let hasMFA = false;

  if (sessionCookie) {
    try {
      // Validate session with Ory Kratos
      const { data } = await kratosFrontend.toSession({
        cookie: `ory_session_imajinweb=${sessionCookie}`,
      });
      session = data;
      isAuthenticated = session.active;
      isAdmin = session.identity.traits.role === 'admin';
      hasMFA = session.authenticator_assurance_level === 'aal2';
    } catch (error) {
      // Invalid or expired session
      isAuthenticated = false;
    }
  }

  // Protect admin routes
  if (pathname.startsWith('/admin')) {
    if (!isAuthenticated) {
      // Not authenticated → redirect to signin
      const signInUrl = new URL('/auth/signin', req.url);
      signInUrl.searchParams.set('return_to', pathname);
      return NextResponse.redirect(signInUrl);
    }

    if (!isAdmin) {
      // Authenticated but not admin → redirect to home
      return NextResponse.redirect(new URL('/', req.url));
    }

    if (!hasMFA) {
      // Admin without MFA → redirect to MFA setup
      const mfaUrl = new URL('/auth/mfa-required', req.url);
      mfaUrl.searchParams.set('return_to', pathname);
      return NextResponse.redirect(mfaUrl);
    }
  }

  // Protect account routes
  if (pathname.startsWith('/account')) {
    if (!isAuthenticated) {
      const signInUrl = new URL('/auth/signin', req.url);
      signInUrl.searchParams.set('return_to', pathname);
      return NextResponse.redirect(signInUrl);
    }
  }

  // Redirect authenticated users away from auth pages
  if (isAuthenticated) {
    if (pathname === '/auth/signin' || pathname === '/auth/signup') {
      return NextResponse.redirect(new URL('/account', req.url));
    }
  }

  // Allow request to proceed
  return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    // Auth routes
    '/auth/signin',
    '/auth/signup',

    // Protected routes
    '/account/:path*',
    '/admin/:path*',
  ],
};
