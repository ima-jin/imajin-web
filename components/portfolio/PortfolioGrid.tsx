/**
 * PortfolioGrid Component
 *
 * Editorial-style layout: Featured product at top, then grid below
 */

import { Product } from '@/types/product';
import PortfolioCard from './PortfolioCard';
import PortfolioFeaturedCard from './PortfolioFeaturedCard';

interface PortfolioGridProps {
  products: Product[];
}

export default function PortfolioGrid({ products }: PortfolioGridProps) {
  // Separate featured from regular products
  const featuredProduct = products.find((p) => p.isFeatured);
  const regularProducts = products.filter((p) => !p.isFeatured);

  return (
    <div className="space-y-16">
      {/* Featured Product - Full Width Hero */}
      {featuredProduct && (
        <PortfolioFeaturedCard product={featuredProduct} />
      )}

      {/* Regular Products Grid */}
      {regularProducts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {regularProducts.map((product) => (
            <PortfolioCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
