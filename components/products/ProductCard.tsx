import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Price } from "@/components/ui/Price";
import { Heading } from "@/components/ui/Heading";
import { Text } from "@/components/ui/Text";
import { getBestImageUrl } from "@/lib/utils/cloudinary";
import {
  getProductDisplayStatus,
  getDisplayPrice,
  getDepositAmount
} from "@/lib/utils/product-display";
import type { Product, MediaItem } from "@/types/product";
import type { ProductDetailContent } from "@/config/schema/page-content-schema";

interface ProductCardProps {
  product: Product;
  content?: ProductDetailContent;
  variantName?: string; // Optional variant name to append to product name
  variantMedia?: MediaItem[]; // Optional variant-specific media
  userHasPaidDeposit?: boolean; // Whether user has paid deposit for this product
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
export function ProductCard({ product, content, variantName, variantMedia, userHasPaidDeposit = false }: ProductCardProps) {
  const displayStatus = getProductDisplayStatus(product);
  const displayName = variantName ? `${product.name} - ${variantName}` : product.name;

  // Get conditional pricing based on sell status and deposit status
  const displayPrice = getDisplayPrice(product, undefined, userHasPaidDeposit);
  const depositAmount = getDepositAmount(product);

  // Use variant media if provided, otherwise fall back to product media
  const mediaToUse = variantMedia && variantMedia.length > 0 ? variantMedia : product.media;

  return (
    <Link href={`/products/${product.id}`} className="block">
      <Card hover noPadding>
        {/* Product Image */}
        <div className="aspect-square bg-gray-100 relative overflow-hidden">
          <Image
            src={getBestImageUrl(mediaToUse, 'hero', { width: 400, height: 400 })}
            alt={displayName}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        </div>

        {/* Product Info */}
        <div className="p-4 space-y-2">
          {/* Category Badge + Sell Status */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="default" size="sm">
              {product.category}
            </Badge>
            {product.requiresAssembly && (
              <Badge variant="warning" size="sm">
                {content?.badges.requires_assembly || "Requires Assembly"}
              </Badge>
            )}
            {displayStatus.badge && (
              <Badge variant={displayStatus.badge.variant} size="sm">
                {displayStatus.badge.text}
              </Badge>
            )}
          </div>

          {/* Product Name */}
          <Heading level={3} className="text-lg">
            {displayName}
          </Heading>

          {/* Product Description */}
          {product.description && (
            <Text size="sm" color="secondary" className="line-clamp-2">
              {product.description}
            </Text>
          )}

          {/* Price */}
          <div className="pt-2">
            {product.sellStatus === 'pre-sale' && depositAmount !== null ? (
              // Pre-sale: Show deposit amount with badge
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="voltage" size="sm">
                    Deposit
                  </Badge>
                  <Price amount={depositAmount} size="lg" />
                </div>
                <Text size="caption" color="muted">
                  Refundable deposit to secure wholesale pricing
                </Text>
              </div>
            ) : displayPrice ? (
              // Pre-order or For-sale: Show price
              <div className="flex items-baseline gap-2">
                <Price amount={displayPrice.price} size="lg" />
                {displayPrice.type === 'wholesale' && (
                  <Badge variant="success" size="sm">
                    Wholesale
                  </Badge>
                )}
                {displayStatus.message && (
                  <span className="text-xs text-gray-600">
                    ({displayStatus.message})
                  </span>
                )}
              </div>
            ) : (
              // Price hidden (fallback)
              <Text size="sm" color="muted">
                Pricing available soon
              </Text>
            )}
          </div>

          {/* Variants Indicator - only show if product has variants AND no specific variant is being shown */}
          {product.hasVariants && !variantName && (
            <Text size="caption" color="muted">
              {content?.badges.multiple_colors || "Multiple colors available"}
            </Text>
          )}
        </div>
      </Card>
    </Link>
  );
}
