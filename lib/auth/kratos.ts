import { Configuration, FrontendApi, IdentityApi } from '@ory/client';

/**
 * Ory Kratos client configuration
 *
 * Public API (4433): Used for self-service flows (login, registration, etc.)
 * Admin API (4434): Used for identity management (create users, etc.)
 */

const KRATOS_PUBLIC_URL = process.env.NEXT_PUBLIC_KRATOS_URL || process.env.KRATOS_PUBLIC_URL || 'http://localhost:4433';
const KRATOS_ADMIN_URL = process.env.KRATOS_ADMIN_URL || 'http://localhost:4434';

/**
 * Frontend API client for self-service flows
 * Used in browser and server-side rendering
 */
export const kratosFrontend = new FrontendApi(
  new Configuration({
    basePath: KRATOS_PUBLIC_URL,
    baseOptions: {
      withCredentials: true, // Required for cookie-based sessions
    },
  })
);

/**
 * Admin API client for identity management
 * Used server-side only for creating/managing identities
 */
export const kratosAdmin = new IdentityApi(
  new Configuration({
    basePath: KRATOS_ADMIN_URL,
  })
);

/**
 * Helper to get Kratos public URL for redirects
 */
export function getKratosPublicUrl(): string {
  return KRATOS_PUBLIC_URL;
}

/**
 * Helper to get Kratos admin URL
 */
export function getKratosAdminUrl(): string {
  return KRATOS_ADMIN_URL;
}
