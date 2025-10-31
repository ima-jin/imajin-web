/**
 * Portfolio Page
 * Phase 2.4.7 - Phase 3
 *
 * Showcases products with showOnPortfolioPage = true
 */

import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Heading } from '@/components/ui/Heading';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import PortfolioGrid from '@/components/portfolio/PortfolioGrid';
import { db } from '@/db';
import { products } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { mapDbProductToProduct } from '@/lib/mappers/product-mapper';

// Force dynamic rendering (don't prerender at build time)
export const dynamic = 'force-dynamic';

// Revalidate every 60 seconds (ISR)
export const revalidate = 60;

async function getPortfolioProducts() {
  const portfolioProducts = await db
    .select()
    .from(products)
    .where(
      and(
        eq(products.showOnPortfolioPage, true),
        eq(products.isLive, true)
      )
    );

  return portfolioProducts.map(mapDbProductToProduct);
}

export default async function PortfolioPage() {
  const products = await getPortfolioProducts();

  return (
    <main>
      <Container className="py-16">
        <div className="text-center mb-12">
          <Heading level={1} className="text-5xl mb-4">
            Portfolio & Installations
          </Heading>
          <Text size="lg" color="secondary" className="max-w-2xl mx-auto">
            See our modular LED fixtures in action across residential and commercial installations.
          </Text>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-16">
            <Text color="secondary" className="mb-6">
              No portfolio items available at this time. Check back soon!
            </Text>
            <Link href="/products">
              <Button variant="primary">Browse Products</Button>
            </Link>
          </div>
        ) : (
          <PortfolioGrid products={products} />
        )}
      </Container>
    </main>
  );
}
