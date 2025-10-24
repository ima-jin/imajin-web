import { HeroSection } from "@/components/home/HeroSection";
import { ProductGrid } from "@/components/products/ProductGrid";
import Link from "next/link";

/**
 * Homepage
 *
 * Displays:
 * - Hero section with company value proposition
 * - Featured products section
 * - Call to action to view all products
 */
export default async function HomePage() {
  // Fetch featured products from API
  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/products`, {
    cache: "no-store", // Ensure fresh data on each request
  });

  const products = await response.json();

  // Show first 4 products as featured
  const featuredProducts = products.slice(0, 4);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <HeroSection />

      {/* Featured Products Section */}
      <section id="featured" className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Featured Products
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Explore our modular LED system. Build custom fixtures tailored to your needs.
            </p>
          </div>

          {/* Product Grid */}
          {featuredProducts.length > 0 ? (
            <ProductGrid products={featuredProducts} />
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No products available at this time.</p>
            </div>
          )}

          {/* View All Products CTA */}
          {products.length > 4 && (
            <div className="mt-12 text-center">
              <Link
                href="/products"
                className="inline-block px-8 py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors"
              >
                View All Products
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
