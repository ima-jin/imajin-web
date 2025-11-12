/**
 * Generic pagination helper for Stripe list API endpoints
 *
 * Handles automatic pagination through Stripe's list responses using
 * the has_more flag and starting_after cursor pattern.
 *
 * @example
 * ```typescript
 * const products = await paginateStripeList(
 *   (params) => stripe.products.list(params),
 *   { active: true, limit: 100 }
 * );
 * ```
 */

/**
 * Stripe list response structure
 */
export interface StripeListResponse<T> {
  data: T[];
  has_more: boolean;
}

/**
 * Parameters for Stripe list endpoints
 */
export type StripeListParams = {
  limit?: number;
  starting_after?: string;
  [key: string]: any; // Allow additional endpoint-specific parameters
};

/**
 * Function type for Stripe list operations
 */
export type StripeListFunction<T> = (
  params: StripeListParams
) => Promise<StripeListResponse<T>>;

/**
 * Paginate through all results from a Stripe list endpoint
 *
 * Automatically handles pagination by iterating through all pages,
 * preserving all filter and query parameters across requests.
 *
 * @param listFn - Stripe list function to paginate
 * @param params - Initial query parameters (filters, limit, etc.)
 * @returns Array of all results across all pages
 * @throws Error if API call fails or response is malformed
 */
export async function paginateStripeList<T extends { id: string }>(
  listFn: StripeListFunction<T>,
  params: StripeListParams
): Promise<T[]> {
  const results: T[] = [];
  let hasMore = true;
  let currentParams = { ...params };

  while (hasMore) {
    const response = await listFn(currentParams);

    // Validate response structure
    if (!Array.isArray(response.data)) {
      throw new Error('Invalid response: data field must be an array');
    }

    // Accumulate results
    results.push(...response.data);

    // Check if there are more pages
    // Treat missing has_more as false (end pagination)
    hasMore = response.has_more === true;

    // Prepare params for next page if needed
    if (hasMore && response.data.length > 0) {
      const lastItem = response.data[response.data.length - 1];
      currentParams = {
        ...params, // Preserve original filters
        starting_after: lastItem.id, // Use last item ID as cursor
      };
    }
  }

  return results;
}
