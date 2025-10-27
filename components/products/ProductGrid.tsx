import { ProductCard } from "./ProductCard";
import { Text } from "@/components/ui/Text";
import type { Product } from "@/types/product";

interface ProductGridProps {
  products: Product[];
}

/**
 * ProductGrid Component
 *
 * Displays a responsive grid of product cards
 * - 1 column on mobile
 * - 2 columns on tablet
 * - 3 columns on desktop
 * - 4 columns on large screens
 *
 * Shows empty state when no products
 */
export function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <Text size="lg" color="muted" className="mb-2">
          No products found
        </Text>
        <Text size="sm" color="muted">
          Try adjusting your filters
        </Text>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
