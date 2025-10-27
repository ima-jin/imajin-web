import { notFound } from "next/navigation";
import Link from "next/link";
import { ProductSpecs } from "@/components/products/ProductSpecs";
import { LimitedEditionBadge } from "@/components/products/LimitedEditionBadge";
import { ProductAddToCart } from "@/components/products/ProductAddToCart";
import { getProductDetailContent } from "@/hooks/usePageContent";
import { getNavigation } from "@/hooks/useNavigation";
import type { Variant } from "@/types/product";

interface ProductDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

/**
 * Product Detail Page
 *
 * Displays:
 * - Product images (placeholder for now)
 * - Product name, description, price
 * - Limited edition badge if applicable
 * - Product specifications
 * - Variants list (if any)
 * - Add to cart button (placeholder)
 */
export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { id } = await params;

  // Load content
  const [content, navigation] = await Promise.all([
    getProductDetailContent(),
    getNavigation(),
  ]);

  // Fetch product details from API
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/products/${id}`,
    { cache: "no-store" }
  );

  if (!response.ok) {
    notFound();
  }

  const product = await response.json();

  // Format price
  const formattedPrice = `$${(product.basePrice / 100).toFixed(2)}`;

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex text-sm">
            <Link href="/" className="text-gray-500 hover:text-gray-700">
              {navigation.breadcrumbs.home}
            </Link>
            <span className="mx-2 text-gray-400">/</span>
            <Link href="/products" className="text-gray-500 hover:text-gray-700">
              {navigation.breadcrumbs.products}
            </Link>
            <span className="mx-2 text-gray-400">/</span>
            <span className="text-gray-900 font-medium">{product.name}</span>
          </nav>
        </div>
      </div>

      {/* Product Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Image */}
          <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
            <span className="text-gray-400">Product Image</span>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Category Badge */}
            <div>
              <span className="inline-block px-3 py-1 text-sm font-medium bg-gray-100 text-gray-700 rounded">
                {product.category}
              </span>
            </div>

            {/* Product Name */}
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
              {product.name}
            </h1>

            {/* Price */}
            <div className="text-3xl font-bold text-gray-900">{formattedPrice}</div>

            {/* Limited Edition Badges for Variants */}
            {product.variants && product.variants.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-700">{content.variant_selector.color_label}</h3>
                {product.variants.map((variant: Variant) => (
                  <div key={variant.id} className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-900">
                      {variant.variantValue}
                    </span>
                    <LimitedEditionBadge
                      availableQuantity={variant.availableQuantity}
                      maxQuantity={variant.maxQuantity}
                      isAvailable={variant.isAvailable}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Description */}
            {product.description && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">{content.sections.description.heading}</h2>
                <p className="text-gray-700 leading-relaxed">{product.description}</p>
              </div>
            )}

            {/* Requires Assembly Badge */}
            {product.requiresAssembly && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-800">
                  {content.assembly.notice}
                </p>
              </div>
            )}

            {/* Add to Cart */}
            <div className="pt-4">
              <ProductAddToCart
                product={{
                  id: product.id,
                  name: product.name,
                  basePrice: product.basePrice,
                  image: product.image,
                  voltage: product.voltage,
                  variants: product.variants,
                }}
              />
            </div>
          </div>
        </div>

        {/* Specifications */}
        {product.specs && product.specs.length > 0 && (
          <div className="mt-16">
            <ProductSpecs specs={product.specs} />
          </div>
        )}
      </div>
    </div>
  );
}
