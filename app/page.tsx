import { HeroSection } from "@/components/home/HeroSection";
import { ProductCard } from "@/components/products/ProductCard";
import { Container } from "@/components/ui/Container";
import { Heading } from "@/components/ui/Heading";
import { Text } from "@/components/ui/Text";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

/**
 * Homepage
 *
 * Matches wireframe design:
 * - Hero section with black background
 * - Value props (Ready to Install, Modular Design, 10-Year Warranty)
 * - Founder Edition showcase
 * - Lifestyle section
 * - Browse all products
 */
export default async function HomePage() {
  // Fetch all products
  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/products`, {
    cache: "no-store",
  });

  const products = await response.json();

  // Filter Founder Edition variants (they'll have hasVariants: true)
  const founderEdition = products.find((p: any) => p.hasVariants === true);

  // Get other products for browse section
  const browseProducts = products.filter((p: any) => !p.hasVariants).slice(0, 4);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <HeroSection />

      {/* Value Props Section */}
      <section className="bg-white py-16">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
            <div className="text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto mb-5 flex items-center justify-center">
                <Text size="caption" color="muted">ICON</Text>
              </div>
              <Heading level={3} className="mb-3">Ready to Install</Heading>
              <Text color="secondary">
                Pre-assembled fixtures arrive ready to hang. Professional installation available in GTA.
              </Text>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto mb-5 flex items-center justify-center">
                <Text size="caption" color="muted">ICON</Text>
              </div>
              <Heading level={3} className="mb-3">Modular Design</Heading>
              <Text color="secondary">
                Expand your fixture over time. Add panels and change configurations as your space evolves.
              </Text>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto mb-5 flex items-center justify-center">
                <Text size="caption" color="muted">ICON</Text>
              </div>
              <Heading level={3} className="mb-3">10-Year Warranty</Heading>
              <Text color="secondary">
                Founder Edition units include comprehensive warranty and exclusive ownership certificate.
              </Text>
            </div>
          </div>
        </Container>
      </section>

      {/* Founder Edition Showcase */}
      <section className="bg-white py-20">
        <Container>
          <div className="text-center mb-16">
            <Heading level={2} className="text-4xl mb-4">Founder Edition Collection</Heading>
            <Text size="lg" color="secondary" className="max-w-2xl mx-auto">
              Limited run of 1,000 units. Each includes MJN NFT ownership certificate and 10-year warranty.
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
            <Link href="/products">
              <Button variant="primary" size="lg">
                View Details
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
                Designed in Toronto.<br />Built to Last.
              </Heading>
              <Text size="lg" color="secondary" className="mb-5 leading-relaxed">
                Each Imajin fixture is a sculptural statement piece. Our modular LED panels transform kitchens, dining rooms, and living spaces with warm, even light.
              </Text>
              <Text size="lg" color="secondary" className="mb-8 leading-relaxed">
                Proudly designed and manufactured in Toronto. Limited production runs ensure exceptional quality control.
              </Text>
              <Button variant="primary" size="lg">
                See Our Portfolio
              </Button>
            </div>
          </div>
        </Container>
      </section>

      {/* Browse All Products */}
      <section className="bg-white py-20">
        <Container>
          <div className="text-center mb-12">
            <Heading level={2} className="text-4xl mb-4">Browse All Products</Heading>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {browseProducts.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link href="/products">
              <Button variant="secondary" size="lg">
                View All Products
              </Button>
            </Link>
          </div>
        </Container>
      </section>
    </div>
  );
}
