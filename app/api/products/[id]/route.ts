import { NextRequest } from "next/server";
import { getProductWithVariants } from "@/lib/services/product-service";
import {
  successResponse,
  notFoundResponse,
  handleUnknownError,
} from "@/lib/utils/api-response";
import { HTTP_STATUS } from "@/lib/config/api";

/**
 * GET /api/products/[id]
 *
 * Returns a single product by ID with its variants and specs
 *
 * Path parameters:
 * - id: Product ID
 *
 * Returns:
 * - 200: Product with variants and specs (camelCase properties)
 * - 404: Product not found
 * - 500: Server error
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    // Get product with variants and specs using service layer
    const product = await getProductWithVariants(id);

    if (!product) {
      return notFoundResponse("Product");
    }

    // Return standardized success response
    return successResponse(product, HTTP_STATUS.OK);
  } catch (error) {
    return handleUnknownError(error, 'Failed to fetch product');
  }
}
