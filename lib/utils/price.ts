/**
 * Price Utilities
 *
 * Centralizes all price-related formatting and calculations.
 * Prices are stored in cents (integer) and displayed as dollars (formatted string).
 */

import { z } from 'zod';

/**
 * Price schema - ensures prices are valid integers (cents)
 */
export const PriceSchema = z.number().int().nonnegative();

/**
 * Validates a price value
 */
export function validatePrice(price: unknown): number {
  return PriceSchema.parse(price);
}

/**
 * Checks if a value is a valid price
 */
export function isValidPrice(price: unknown): price is number {
  return PriceSchema.safeParse(price).success;
}

/**
 * Converts cents to dollars (for display)
 *
 * @param cents - Price in cents (integer)
 * @returns Price in dollars (float)
 */
export function centsToDollars(cents: number): number {
  return cents / 100;
}

/**
 * Converts dollars to cents (for storage/calculations)
 *
 * @param dollars - Price in dollars (float)
 * @returns Price in cents (integer)
 */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/**
 * Formats a price in cents as currency string
 *
 * @param cents - Price in cents (integer)
 * @param options - Formatting options
 * @returns Formatted currency string (e.g., "$99.99")
 */
export interface FormatCurrencyOptions {
  currency?: string;
  locale?: string;
  showCurrency?: boolean;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

export function formatCurrency(
  cents: number,
  options: FormatCurrencyOptions = {}
): string {
  const {
    currency = 'USD',
    locale = 'en-US',
    showCurrency = true,
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
  } = options;

  const dollars = centsToDollars(cents);

  if (showCurrency) {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits,
      maximumFractionDigits,
    }).format(dollars);
  }

  return new Intl.NumberFormat(locale, {
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(dollars);
}

/**
 * Formats a price range
 *
 * @param minCents - Minimum price in cents
 * @param maxCents - Maximum price in cents
 * @returns Formatted price range (e.g., "$50.00 - $100.00")
 */
export function formatPriceRange(
  minCents: number,
  maxCents: number,
  options?: FormatCurrencyOptions
): string {
  if (minCents === maxCents) {
    return formatCurrency(minCents, options);
  }
  return `${formatCurrency(minCents, options)} - ${formatCurrency(maxCents, options)}`;
}

/**
 * Calculates subtotal for multiple items
 *
 * @param items - Array of items with price and quantity
 * @returns Subtotal in cents
 */
export function calculateSubtotal(
  items: Array<{ price: number; quantity: number }>
): number {
  return items.reduce((total, item) => {
    return total + item.price * item.quantity;
  }, 0);
}

/**
 * Calculates tax amount
 *
 * @param subtotalCents - Subtotal in cents
 * @param taxRate - Tax rate as decimal (e.g., 0.13 for 13%)
 * @returns Tax amount in cents
 */
export function calculateTax(subtotalCents: number, taxRate: number): number {
  return Math.round(subtotalCents * taxRate);
}

/**
 * Calculates discount amount
 *
 * @param priceCents - Original price in cents
 * @param discountPercent - Discount percentage (e.g., 20 for 20% off)
 * @returns Discount amount in cents
 */
export function calculateDiscount(
  priceCents: number,
  discountPercent: number
): number {
  return Math.round((priceCents * discountPercent) / 100);
}

/**
 * Applies discount to price
 *
 * @param priceCents - Original price in cents
 * @param discountPercent - Discount percentage (e.g., 20 for 20% off)
 * @returns Discounted price in cents
 */
export function applyDiscount(
  priceCents: number,
  discountPercent: number
): number {
  const discount = calculateDiscount(priceCents, discountPercent);
  return priceCents - discount;
}

/**
 * Compares two prices and returns difference
 *
 * @param price1Cents - First price in cents
 * @param price2Cents - Second price in cents
 * @returns Difference in cents (positive if price1 > price2)
 */
export function priceDifference(
  price1Cents: number,
  price2Cents: number
): number {
  return price1Cents - price2Cents;
}

/**
 * Calculates percentage difference between two prices
 *
 * @param oldPriceCents - Original price in cents
 * @param newPriceCents - New price in cents
 * @returns Percentage change (positive for increase, negative for decrease)
 */
export function priceChangePercent(
  oldPriceCents: number,
  newPriceCents: number
): number {
  if (oldPriceCents === 0) return 0;
  return ((newPriceCents - oldPriceCents) / oldPriceCents) * 100;
}

/**
 * Formats a price with optional discount display
 *
 * @param originalCents - Original price in cents
 * @param discountedCents - Discounted price in cents (optional)
 * @returns Object with formatted original and discounted prices
 */
export function formatPriceWithDiscount(
  originalCents: number,
  discountedCents?: number
): {
  original: string;
  discounted?: string;
  savings?: string;
  savingsPercent?: number;
} {
  const original = formatCurrency(originalCents);

  if (!discountedCents || discountedCents === originalCents) {
    return { original };
  }

  const savings = priceDifference(originalCents, discountedCents);
  const savingsPercent = Math.abs(
    priceChangePercent(originalCents, discountedCents)
  );

  return {
    original,
    discounted: formatCurrency(discountedCents),
    savings: formatCurrency(savings),
    savingsPercent: Math.round(savingsPercent),
  };
}

/**
 * Parses a currency string to cents
 * Handles formats like: "$99.99", "99.99", "$100", "100"
 *
 * @param currencyString - Currency string to parse
 * @returns Price in cents, or null if invalid
 */
export function parseCurrencyString(currencyString: string): number | null {
  // Remove currency symbols and spaces
  const cleaned = currencyString.replace(/[$,\s]/g, '');

  // Parse as float
  const dollars = parseFloat(cleaned);

  if (isNaN(dollars)) {
    return null;
  }

  return dollarsToCents(dollars);
}
