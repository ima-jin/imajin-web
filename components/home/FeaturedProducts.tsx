/**
 * FeaturedProducts Component
 *
 * Displays featured products on the homepage
 */

'use client';

import { useEffect, useState } from 'react';
import { Product } from '@/types/product';
import { Heading } from '@/components/ui/Heading';
import { Container } from '@/components/ui/Container';
import { ProductCard } from '@/components/products/ProductCard';
import { logger } from '@/lib/utils/logger';

export default function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFeaturedProducts() {
      try {
        setLoading(true);
        // Fetch from API instead of direct database access
        const response = await fetch('/api/products');

        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }

        const data = await response.json();
        const allProducts = data.data || data;

        // Filter to only featured products
        const featured = allProducts
          .filter((p: Product) => p.isFeatured && p.isLive)
          .slice(0, 6); // Limit to 6 products max

        setProducts(featured);
      } catch (err) {
        logger.error('Failed to fetch featured products', err as Error);
        setError('Failed to load featured products');
      } finally {
        setLoading(false);
      }
    }

    fetchFeaturedProducts();
  }, []);

  if (loading) {
    return (
      <section className="py-16" role="region" aria-label="Featured Products">
        <Container>
          <Heading level={2} className="text-center mb-12">
            Featured Products
          </Heading>
          <div className="text-center text-gray-500">Loading featured products...</div>
        </Container>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-16" role="region" aria-label="Featured Products">
        <Container>
          <Heading level={2} className="text-center mb-12">
            Featured Products
          </Heading>
          <div className="text-center text-red-600">
            {error}
            <div className="mt-4">
              <button
                onClick={() => window.location.reload()}
                className="text-blue-600 hover:underline"
              >
                Try Again
              </button>
            </div>
          </div>
        </Container>
      </section>
    );
  }

  if (products.length === 0) {
    return (
      <section className="py-16" role="region" aria-label="Featured Products">
        <Container>
          <Heading level={2} className="text-center mb-12">
            Featured Products
          </Heading>
          <div className="text-center text-gray-600">
            No featured products available at this time.
          </div>
        </Container>
      </section>
    );
  }

  return (
    <section className="py-16" role="region" aria-label="Featured Products">
      <Container>
        <Heading level={2} className="text-center mb-12">
          Featured Products
        </Heading>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product) => (
            <article key={product.id}>
              <ProductCard product={product} />
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
