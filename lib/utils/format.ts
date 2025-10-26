/**
 * Format a price in cents to a currency string
 * @param cents - Price in cents
 * @param currency - Currency code (default: 'USD')
 * @returns Formatted currency string (e.g., "$50.00")
 */
export function formatCurrency(cents: number, currency: string = 'USD'): string {
  const dollars = cents / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(dollars);
}
