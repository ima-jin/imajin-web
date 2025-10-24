import Link from "next/link";
import type { Product } from "@/types/product";

interface ProductCardProps {
  product: Product;
}

/**
 * ProductCard Component
 *
 * Displays a product in a card format with:
 * - Product image (placeholder for now)
 * - Name and description
 * - Price
 * - Category badge
 * - Assembly requirement badge
 * - Variants indicator
 *
 * Links to product detail page on click
 */
export function ProductCard({ product }: ProductCardProps) {
  // Format price from cents to dollars
  const formattedPrice = `$${(product.basePrice / 100).toFixed(2)}`;

  return (
    <Link
      href={`/products/${product.id}`}
      className="block border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-200 bg-white"
    >
      {/* Product Image Placeholder */}
      <div className="aspect-square bg-gray-100 flex items-center justify-center">
        <span className="text-gray-400 text-sm">Image</span>
      </div>

      {/* Product Info */}
      <div className="p-4 space-y-2">
        {/* Category Badge */}
        <div className="flex items-center gap-2">
          <span className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
            {product.category}
          </span>
          {product.requiresAssembly && (
            <span className="inline-block px-2 py-1 text-xs font-medium bg-amber-100 text-amber-700 rounded">
              Requires Assembly
            </span>
          )}
        </div>

        {/* Product Name */}
        <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>

        {/* Product Description */}
        {product.description && (
          <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>
        )}

        {/* Price */}
        <div className="pt-2">
          <p className="text-xl font-bold text-gray-900">{formattedPrice}</p>
        </div>

        {/* Variants Indicator */}
        {product.hasVariants && (
          <p className="text-xs text-gray-500">Multiple colors available</p>
        )}
      </div>
    </Link>
  );
}
