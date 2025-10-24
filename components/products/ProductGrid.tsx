import { ProductCard } from "./ProductCard";
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
        <p className="text-gray-500 text-lg">No products found</p>
        <p className="text-gray-400 text-sm mt-2">Try adjusting your filters</p>
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
