import { NextRequest, NextResponse } from "next/server";
import { getAllProducts } from "@/lib/services/product-service";
import type { ProductCategory } from "@/types/product";

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
    const category = searchParams?.get("category") as ProductCategory | null | undefined;

    // Build filters
    const filters = category ? { category } : undefined;

    // Get products using service layer
    const products = await getAllProducts(filters);

    // Return products as JSON
    return NextResponse.json(products, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error fetching products:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch products",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
