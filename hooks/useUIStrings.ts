import { loadContentCached } from '@/lib/config/content-loader';
import { UIStrings, UIStringsSchema } from '@/config/schema/ui-strings-schema';

/**
 * Load UI strings on the server
 * Use this in Server Components or during SSR/SSG
 * @returns UI strings for buttons, labels, and common text
 *
 * @example
 * ```tsx
 * export default async function CartDrawer() {
 *   const strings = await getUIStrings();
 *   return <h2>{strings.cart.heading}</h2>;
 * }
 * ```
 */
export async function getUIStrings(): Promise<UIStrings> {
  return loadContentCached('content/ui-strings.json', UIStringsSchema);
}
