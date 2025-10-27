/**
 * String Template Interpolation Utility
 * Replaces template variables in strings with provided values
 * Example: "Only {quantity} remaining" + {quantity: 5} => "Only 5 remaining"
 */

/**
 * Interpolate template variables in a string
 * @param template - String with placeholders in {variable} format
 * @param vars - Object with variable names and values
 * @returns Interpolated string with variables replaced
 *
 * @example
 * ```ts
 * const message = interpolate("Only {quantity} remaining", { quantity: 5 });
 * // Result: "Only 5 remaining"
 * ```
 *
 * @example
 * ```ts
 * const message = interpolate(
 *   "{product_name} is sold out",
 *   { product_name: "Black Cube" }
 * );
 * // Result: "Black Cube is sold out"
 * ```
 */
export function interpolate(
  template: string,
  vars: Record<string, string | number | boolean | null | undefined>
): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    const value = vars[key];

    // If value is undefined or null, return empty string
    if (value === undefined || value === null) {
      return '';
    }

    return String(value);
  });
}

/**
 * Interpolate template with year replacement
 * Special handling for {year} placeholder which gets current year
 * @param template - String with placeholders
 * @param vars - Object with variable names and values
 * @returns Interpolated string
 *
 * @example
 * ```ts
 * const copyright = interpolateWithYear("© {year} Imajin", {});
 * // Result: "© 2025 Imajin"
 * ```
 */
export function interpolateWithYear(
  template: string,
  vars: Record<string, string | number | boolean | null | undefined> = {}
): string {
  const currentYear = new Date().getFullYear();
  return interpolate(template, {
    ...vars,
    year: currentYear,
  });
}
