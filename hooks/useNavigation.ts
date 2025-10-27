import { loadContentCached } from '@/lib/config/content-loader';
import { Navigation, NavigationSchema } from '@/config/schema/navigation-schema';

/**
 * Load navigation configuration on the server
 * Use this in Server Components or during SSR/SSG
 * @returns Navigation configuration including header, footer, and breadcrumbs
 *
 * @example
 * ```tsx
 * // In a Server Component
 * export default async function Header() {
 *   const nav = await getNavigation();
 *   return (
 *     <nav>
 *       {nav.header.nav_items.map(item => (
 *         <a key={item.id} href={item.href}>{item.label}</a>
 *       ))}
 *     </nav>
 *   );
 * }
 * ```
 */
export async function getNavigation(): Promise<Navigation> {
  return loadContentCached('content/navigation.json', NavigationSchema);
}
