import { loadContentCached } from '@/lib/config/content-loader';
import { SiteMetadata, SiteMetadataSchema } from '@/config/schema/site-metadata-schema';

/**
 * Load site metadata on the server
 * Use this in Server Components or during SSR/SSG
 * @returns Site metadata configuration
 *
 * @example
 * ```tsx
 * // In a Server Component
 * export default async function Layout() {
 *   const metadata = await getSiteMetadata();
 *   return <title>{metadata.meta.default_title}</title>;
 * }
 * ```
 */
export async function getSiteMetadata(): Promise<SiteMetadata> {
  return loadContentCached('content/site-metadata.json', SiteMetadataSchema);
}
