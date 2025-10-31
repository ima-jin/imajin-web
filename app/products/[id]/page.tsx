import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ProductSpecs } from "@/components/products/ProductSpecs";
import { LimitedEditionBadge } from "@/components/products/LimitedEditionBadge";
import { ProductAddToCart } from "@/components/products/ProductAddToCart";
import { MediaCarousel } from "@/components/products/MediaCarousel";
import { getProductDetailContent } from "@/hooks/usePageContent";
import { getNavigation } from "@/hooks/useNavigation";
import { apiGet, ApiClientError } from "@/lib/utils/api-client";
import { API_ENDPOINTS } from "@/lib/config/api";
import { ProductWithVariantsSchema } from "@/types/product";
import type { Variant } from "@/types/product";
import { formatCurrency } from "@/lib/utils/price";
import { getProductImageUrl } from "@/lib/utils/cloudinary";
import { getProductDisplayStatus } from "@/lib/utils/product-display";

interface ProductDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

/**
 * Generate metadata for product detail pages
 * Phase 2.4.7 - SEO optimization
 */
export async function generateMetadata({ params }: ProductDetailPageProps): Promise<Metadata> {
  const { id } = await params;

  try {
    const product = await apiGet(
      API_ENDPOINTS.PRODUCT_BY_ID(id),
      ProductWithVariantsSchema,
      { cache: "no-store" }
    );

    // Get the first valid image URL for OpenGraph
    let ogImage = '';
    if (product.media && product.media.length > 0) {
      const mainImage = product.media.find(m => m.category === 'main' || m.category === 'hero');
      if (mainImage?.cloudinaryPublicId) {
        ogImage = getProductImageUrl(mainImage.cloudinaryPublicId);
      } else if (product.media[0]?.cloudinaryPublicId) {
        ogImage = getProductImageUrl(product.media[0].cloudinaryPublicId);
      }
    }

    return {
      title: `${product.name} - Imajin LED Fixtures`,
      description: product.description || `Shop ${product.name} from Imajin's modular LED fixture collection.`,
      openGraph: {
        title: `${product.name} - Imajin`,
        description: product.description || `Shop ${product.name} from Imajin's collection.`,
        images: ogImage ? [{ url: ogImage }] : [],
      },
    };
  } catch {
    return {
      title: 'Product - Imajin LED Fixtures',
      description: 'Product details for Imajin modular LED fixtures.',
    };
  }
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

  // Fetch product details from API with validation
  try {
    const product = await apiGet(
      API_ENDPOINTS.PRODUCT_BY_ID(id),
      ProductWithVariantsSchema,
      { cache: "no-store" }
    );

    // Format price
    const formattedPrice = formatCurrency(product.basePrice);

    // Get display status (includes sell status badge and note)
    const displayStatus = getProductDisplayStatus(product);

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
            {/* Product Media Carousel */}
            <MediaCarousel media={product.media} productName={product.name} />

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
              <div className="flex items-baseline gap-3">
                <div className="text-3xl font-bold text-gray-900">{formattedPrice}</div>
                {displayStatus.message && (
                  <span className="text-base text-gray-600">
                    ({displayStatus.message})
                  </span>
                )}
              </div>

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
                    image: undefined,
                    voltage: undefined,
                    // @ts-expect-error - Type mismatch in variant fields (pre-existing)
                    variants: product.variants,
                    sellStatus: product.sellStatus,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Specifications */}
          {product.specs && product.specs.length > 0 && (
            <div className="mt-16">
              {/* @ts-expect-error - Type mismatch in spec fields (pre-existing) */}
              <ProductSpecs specs={product.specs} />
            </div>
          )}
        </div>
      </div>
    );
  } catch (error) {
    if (error instanceof ApiClientError && error.statusCode === 404) {
      notFound();
    }

    throw error; // Let error boundary handle it
  }
}
