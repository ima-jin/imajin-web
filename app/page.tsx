import HeroSection from "@/components/home/HeroSection";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import { ProductCard } from "@/components/products/ProductCard";
import { Container } from "@/components/ui/Container";
import { Heading } from "@/components/ui/Heading";
import { Text } from "@/components/ui/Text";
import { Button } from "@/components/ui/Button";
import { getHomePageContent } from "@/hooks/usePageContent";
import { getAllProducts } from "@/lib/services/product-service";
import Link from "next/link";
import type { Metadata } from "next";

/**
 * Metadata for homepage
 * Phase 2.4.7 - SEO optimization
 */
export const metadata: Metadata = {
  title: "Imajin - Modular LED Fixtures",
  description: "Transform your space with modular LED lighting fixtures. Designed for flexibility, built to last.",
  openGraph: {
    title: "Imajin - Modular LED Fixtures",
    description: "Transform your space with modular LED lighting fixtures.",
    images: ["/og-image.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Imajin - Modular LED Fixtures",
    description: "Transform your space with modular LED lighting fixtures.",
  },
};

// Revalidate every 60 seconds (ISR)
export const revalidate = 60;

/**
 * Homepage
 *
 * Matches wireframe design:
 * - Hero section with black background
 * - Featured products
 * - Value props (Ready to Install, Modular Design, 10-Year Warranty)
 * - Founder Edition showcase
 * - Lifestyle section
 * - Browse all products
 */
export default async function HomePage() {
  // Load content
  const content = await getHomePageContent();

  // Fetch all products from database (server-side)
  // Errors will be caught by error boundary (app/error.tsx)
  const products = await getAllProducts();

  // Filter Founder Edition variants (they'll have hasVariants: true)
  const founderEdition = products.find((p) => p.hasVariants === true);

  // Get other products for browse section
  const browseProducts = products.filter((p) => !p.hasVariants).slice(0, 4);

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <HeroSection content={content.hero} />

      {/* Featured Products - Phase 2.4.7 */}
      <FeaturedProducts />

      {/* Value Props Section */}
      <section className="bg-white py-16">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
            {content.value_props.map((prop) => (
              <div key={prop.id} className="text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto mb-5 flex items-center justify-center">
                  <Text size="caption" color="muted">ICON</Text>
                </div>
                <Heading level={3} className="mb-3">{prop.heading}</Heading>
                <Text color="secondary">
                  {prop.description}
                </Text>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Founder Edition Showcase */}
      <section className="bg-white py-20">
        <Container>
          <div className="text-center mb-16">
            <Heading level={2} className="text-4xl mb-4">{content.founder_section.heading}</Heading>
            <Text size="lg" color="secondary" className="max-w-2xl mx-auto">
              {content.founder_section.description}
            </Text>
          </div>

          {founderEdition && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <ProductCard product={founderEdition} />
              <ProductCard product={founderEdition} />
              <ProductCard product={founderEdition} />
            </div>
          )}

          <div className="mt-8 text-center">
            <Link href={content.founder_section.cta.href}>
              <Button variant="primary" size="lg" aria-label={content.founder_section.cta.aria_label}>
                {content.founder_section.cta.label}
              </Button>
            </Link>
          </div>
        </Container>
      </section>

      {/* Lifestyle Section */}
      <section className="bg-white py-20">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="h-[500px] bg-gray-100 flex items-center justify-center rounded">
              <Text color="muted">Installation Photo - Residential Setting</Text>
            </div>
            <div>
              <Heading level={2} className="text-4xl md:text-5xl font-light mb-6">
                {content.about_section.heading}
              </Heading>
              <Text size="lg" color="secondary" className="mb-8 leading-relaxed">
                {content.about_section.description}
              </Text>
              <Link href={content.about_section.cta.href}>
                <Button variant="primary" size="lg" aria-label={content.about_section.cta.aria_label}>
                  {content.about_section.cta.label}
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* Browse All Products */}
      <section className="bg-white py-20">
        <Container>
          <div className="text-center mb-12">
            <Heading level={2} className="text-4xl mb-4">{content.browse_all_section.heading}</Heading>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {browseProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link href={content.browse_all_section.cta.href}>
              <Button variant="secondary" size="lg" aria-label={content.browse_all_section.cta.aria_label}>
                {content.browse_all_section.cta.label}
              </Button>
            </Link>
          </div>
        </Container>
      </section>
    </main>
  );
}
