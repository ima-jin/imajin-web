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
import { Product } from '@/types/product';
import { logger } from '@/lib/utils/logger';

async function getPortfolioProducts(): Promise<Product[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/portfolio`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch portfolio products');
    }

    return await response.json();
  } catch (error) {
    logger.error('Error fetching portfolio products', error as Error);
    return [];
  }
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
