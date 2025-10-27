import { loadContentCached } from '@/lib/config/content-loader';
import { ValidationMessages, ValidationMessagesSchema } from '@/config/schema/validation-messages-schema';

/**
 * Load validation messages on the server
 * Use this in Server Components or during SSR/SSG
 * @returns Validation messages for errors and warnings
 *
 * @example
 * ```tsx
 * import { interpolate } from '@/lib/utils/string-template';
 *
 * export default async function CartValidator() {
 *   const messages = await getValidationMessages();
 *   const error = interpolate(
 *     messages.cart_validation.product_sold_out_template,
 *     { product_name: 'Black Cube' }
 *   );
 *   return <p>{error}</p>;
 * }
 * ```
 */
export async function getValidationMessages(): Promise<ValidationMessages> {
  return loadContentCached('content/validation-messages.json', ValidationMessagesSchema);
}
