/**
 * Date Formatting Utilities
 *
 * Utilities for formatting dates in human-readable formats
 */

/**
 * Format ISO date string to readable format
 * @param isoDate - ISO 8601 date string (YYYY-MM-DD)
 * @returns Formatted date string (e.g., "November 1, 2025")
 */
export function formatDate(isoDate: string): string {
  try {
    // Parse date manually to avoid timezone issues
    // ISO dates like "2025-11-01" should be treated as local, not UTC
    const [year, month, day] = isoDate.split('-').map(Number);
    const date = new Date(year, month - 1, day); // month is 0-indexed

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Date not available';
    }

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return 'Date not available';
  }
}
