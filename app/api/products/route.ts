import { NextRequest } from "next/server";
import { getAllProducts } from "@/lib/services/product-service";
import {
  successResponse,
  handleUnknownError,
} from "@/lib/utils/api-response";
import { validateProductCategory } from "@/lib/validation/query-params";
import { HTTP_STATUS } from "@/lib/config/api";

/**
 * GET /api/products
 *
 * Returns all products (filtered by default to active products with dev_status = 5)
 *
 * Query parameters:
 * - category: Filter by product category (material, connector, control, etc.)
 *
 * Returns: Array of products with camelCase properties
 */
export async function GET(request?: NextRequest) {
  try {
    // Parse query parameters
    const searchParams = request?.nextUrl.searchParams;
    const categoryParam = searchParams?.get("category");

    // Validate category parameter
    const category = validateProductCategory(categoryParam);

    // Build filters
    const filters = category ? { category } : undefined;

    // Get products using service layer
    const products = await getAllProducts(filters);

    // Return standardized success response
    return successResponse(products, HTTP_STATUS.OK);
  } catch (error) {
    return handleUnknownError(error, 'Failed to fetch products');
  }
}
