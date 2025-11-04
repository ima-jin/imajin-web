/**
 * Portfolio API Route
 *
 * GET /api/portfolio - Returns products with showOnPortfolioPage = true
 */

import { NextResponse } from 'next/server';
import { db } from '@/db';
import { products } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { mapDbProductToProduct } from '@/lib/mappers/product-mapper';
import { logger } from '@/lib/utils/logger';

export async function GET() {
  try {
    // Query products that should show on portfolio page
    // Note: We don't check is_live here - portfolio is about showcasing work
    const portfolioProducts = await db
      .select()
      .from(products)
      .where(eq(products.showOnPortfolioPage, true));

    // Map to application format
    const mappedProducts = portfolioProducts.map(mapDbProductToProduct);

    return NextResponse.json(mappedProducts, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    logger.error('Portfolio API error', error as Error);
    return NextResponse.json(
      { error: 'Failed to fetch portfolio products' },
      { status: 500 }
    );
  }
}
