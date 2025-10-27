import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Price } from "@/components/ui/Price";
import { Heading } from "@/components/ui/Heading";
import { Text } from "@/components/ui/Text";
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
  return (
    <Link href={`/products/${product.id}`} className="block">
      <Card hover noPadding>
        {/* Product Image Placeholder */}
        <div className="aspect-square bg-gray-100 flex items-center justify-center">
          <Text size="sm" color="muted">Image</Text>
        </div>

        {/* Product Info */}
        <div className="p-4 space-y-2">
          {/* Category Badge */}
          <div className="flex items-center gap-2">
            <Badge variant="default" size="sm">
              {product.category}
            </Badge>
            {product.requiresAssembly && (
              <Badge variant="warning" size="sm">
                Requires Assembly
              </Badge>
            )}
          </div>

          {/* Product Name */}
          <Heading level={3} className="text-lg">
            {product.name}
          </Heading>

          {/* Product Description */}
          {product.description && (
            <Text size="sm" color="secondary" className="line-clamp-2">
              {product.description}
            </Text>
          )}

          {/* Price */}
          <div className="pt-2">
            <Price amount={product.basePrice} size="lg" />
          </div>

          {/* Variants Indicator */}
          {product.hasVariants && (
            <Text size="caption" color="muted">
              Multiple colors available
            </Text>
          )}
        </div>
      </Card>
    </Link>
  );
}
