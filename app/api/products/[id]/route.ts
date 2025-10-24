import { NextRequest, NextResponse } from "next/server";
import { getProductWithVariants } from "@/lib/services/product-service";

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
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Return product with variants and specs as JSON
    return NextResponse.json(product, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error fetching product:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch product",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
