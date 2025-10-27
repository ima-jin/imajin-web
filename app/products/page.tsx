import { ProductCard } from "@/components/products/ProductCard";
import { Container } from "@/components/ui/Container";
import { Heading } from "@/components/ui/Heading";
import { Text } from "@/components/ui/Text";
import { Badge } from "@/components/ui/Badge";
import { getProductsListingContent } from "@/hooks/usePageContent";
import type { Product } from "@/types/product";

/**
 * Product Listing Page
 *
 * Matches wireframe design:
 * - Page header
 * - Sidebar filters
 * - Featured Founder Edition section
 * - Category sections (Expansion, Accessories, DIY)
 */
export default async function ProductsPage() {
  // Load content
  const content = await getProductsListingContent();

  // Fetch products server-side
  let products: Product[] = [];
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/products`,
      { cache: "no-store" }
    );
    products = await response.json();
  } catch (error) {
    console.error("Error fetching products:", error);
  }

  // Categorize products
  const founderEdition = products.find(p => p.hasVariants === true);
  const expansionProducts = products.filter(p =>
    p.category === "material" || p.category === "control" || p.category === "connector"
  ).slice(0, 3);
  const accessories = products.filter(p =>
    p.category === "interface" || p.name.toLowerCase().includes("cap")
  ).slice(0, 3);
  const diyKits = products.filter(p => p.category === "kit");

  return (
    <div className="min-h-screen bg-white">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 py-16 text-center">
        <Container>
          <Heading level={1} className="text-5xl font-light mb-4">
            {content.page.heading}
          </Heading>
          <Text size="lg" color="secondary" className="max-w-2xl mx-auto">
            {content.page.subheading}
          </Text>
        </Container>
      </div>

      <Container className="py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[250px_1fr] gap-10">
          {/* Sidebar Filters */}
          <aside className="bg-white border border-gray-200 p-6 h-fit">
            <Heading level={3} className="text-sm uppercase tracking-wider mb-4">
              {content.filters.heading}
            </Heading>

            <div className="space-y-8">
              {content.filters.sections.map((section) => (
                <div key={section.id}>
                  <Heading level={4} className="text-sm mb-3">{section.label}</Heading>
                  {section.options.map((option) => (
                    <label key={option.value} className="flex items-center mb-2 cursor-pointer">
                      <input
                        type="checkbox"
                        defaultChecked={option.value === "fixtures" || option.value === "in_stock"}
                        className="mr-2"
                      />
                      <Text size="sm">{option.label}</Text>
                    </label>
                  ))}
                </div>
              ))}
            </div>
          </aside>

          {/* Main Content */}
          <main>
            {/* Featured Founder Edition */}
            {founderEdition && (
              <div className="bg-gray-50 border-2 border-gray-300 p-10 mb-16">
                <Heading level={2} className="text-3xl font-light mb-6">
                  {content.product_sections.find(s => s.id === "founder")?.heading}
                </Heading>
                <Text color="secondary" className="mb-8 max-w-3xl">
                  {content.product_sections.find(s => s.id === "founder")?.description}
                </Text>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <div className="relative">
                        <ProductCard product={founderEdition} />
                        <Badge variant="limited" className="absolute top-4 left-4">
                          500 Available
                        </Badge>
                      </div>
                      <div className="relative">
                        <ProductCard product={founderEdition} />
                        <Badge variant="limited" className="absolute top-4 left-4">
                          300 Available
                        </Badge>
                      </div>
                      <div className="relative">
                        <ProductCard product={founderEdition} />
                        <Badge variant="limited" className="absolute top-4 left-4">
                          200 Available
                        </Badge>
                      </div>
                </div>
              </div>
            )}

            {/* Expansion & Upgrades */}
            {expansionProducts.length > 0 && (
              <div className="mb-16">
                <div className="mb-6 pb-4 border-b-2 border-gray-300">
                  <Heading level={2} className="text-3xl mb-2">
                    {content.product_sections.find(s => s.id === "expansion")?.heading}
                  </Heading>
                  <Text color="secondary">
                    {content.product_sections.find(s => s.id === "expansion")?.description}
                  </Text>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {expansionProducts.map(product => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </div>
            )}

            {/* Accessories */}
            {accessories.length > 0 && (
              <div className="mb-16">
                <div className="mb-6 pb-4 border-b-2 border-gray-300">
                  <Heading level={2} className="text-3xl mb-2">
                    {content.product_sections.find(s => s.id === "accessories")?.heading}
                  </Heading>
                  <Text color="secondary">
                    {content.product_sections.find(s => s.id === "accessories")?.description}
                  </Text>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {accessories.map(product => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </div>
            )}

            {/* DIY Kits (De-emphasized) */}
            {diyKits.length > 0 && (
              <div className="mb-16 opacity-80">
                <div className="mb-6 pb-4 border-b-2 border-gray-300">
                  <Heading level={2} className="text-3xl mb-2">
                    {content.product_sections.find(s => s.id === "diy")?.heading}
                  </Heading>
                  <Text color="secondary">
                    {content.product_sections.find(s => s.id === "diy")?.description}
                  </Text>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {diyKits.map(product => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </div>
            )}
          </main>
        </div>
      </Container>
    </div>
  );
}
