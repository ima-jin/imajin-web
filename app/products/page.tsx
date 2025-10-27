"use client";

import { useState, useEffect } from "react";
import { ProductCard } from "@/components/products/ProductCard";
import { Container } from "@/components/ui/Container";
import { Heading } from "@/components/ui/Heading";
import { Text } from "@/components/ui/Text";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
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
export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await fetch("/api/products");
        const data = await response.json();
        setProducts(data);
      } catch (error) {
        console.error("Error fetching products:", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

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
            Shop Pre-Made Fixtures
          </Heading>
          <Text size="lg" color="secondary" className="max-w-2xl mx-auto">
            Sculptural LED lighting ready for your home. Limited production runs, designed in Toronto.
          </Text>
        </Container>
      </div>

      <Container className="py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[250px_1fr] gap-10">
          {/* Sidebar Filters */}
          <aside className="bg-white border border-gray-200 p-6 h-fit">
            <Heading level={3} className="text-sm uppercase tracking-wider mb-4">
              Filter By
            </Heading>

            <div className="space-y-8">
              <div>
                <Heading level={4} className="text-sm mb-3">Product Type</Heading>
                <label className="flex items-center mb-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="mr-2" />
                  <Text size="sm">Complete Fixtures</Text>
                </label>
                <label className="flex items-center mb-2 cursor-pointer">
                  <input type="checkbox" className="mr-2" />
                  <Text size="sm">Expansion Panels</Text>
                </label>
                <label className="flex items-center mb-2 cursor-pointer">
                  <input type="checkbox" className="mr-2" />
                  <Text size="sm">Controllers</Text>
                </label>
                <label className="flex items-center mb-2 cursor-pointer">
                  <input type="checkbox" className="mr-2" />
                  <Text size="sm">Accessories</Text>
                </label>
              </div>

              <div>
                <Heading level={4} className="text-sm mb-3">Availability</Heading>
                <label className="flex items-center mb-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="mr-2" />
                  <Text size="sm">In Stock</Text>
                </label>
                <label className="flex items-center mb-2 cursor-pointer">
                  <input type="checkbox" className="mr-2" />
                  <Text size="sm">Limited Edition</Text>
                </label>
              </div>

              <div>
                <Heading level={4} className="text-sm mb-3">Color</Heading>
                <label className="flex items-center mb-2 cursor-pointer">
                  <input type="checkbox" className="mr-2" />
                  <Text size="sm">Black</Text>
                </label>
                <label className="flex items-center mb-2 cursor-pointer">
                  <input type="checkbox" className="mr-2" />
                  <Text size="sm">White</Text>
                </label>
                <label className="flex items-center mb-2 cursor-pointer">
                  <input type="checkbox" className="mr-2" />
                  <Text size="sm">Red</Text>
                </label>
              </div>

              <div>
                <Heading level={4} className="text-sm mb-3">Price Range</Heading>
                <label className="flex items-center mb-2 cursor-pointer">
                  <input type="checkbox" className="mr-2" />
                  <Text size="sm">Under $500</Text>
                </label>
                <label className="flex items-center mb-2 cursor-pointer">
                  <input type="checkbox" className="mr-2" />
                  <Text size="sm">$500 - $1,500</Text>
                </label>
                <label className="flex items-center mb-2 cursor-pointer">
                  <input type="checkbox" className="mr-2" />
                  <Text size="sm">$1,500 - $3,000</Text>
                </label>
                <label className="flex items-center mb-2 cursor-pointer">
                  <input type="checkbox" className="mr-2" />
                  <Text size="sm">$3,000+</Text>
                </label>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main>
            {loading && (
              <div className="text-center py-12">
                <Text color="muted">Loading products...</Text>
              </div>
            )}

            {!loading && (
              <>
                {/* Featured Founder Edition */}
                {founderEdition && (
                  <div className="bg-gray-50 border-2 border-gray-300 p-10 mb-16">
                    <Heading level={2} className="text-3xl font-light mb-6">
                      Founder Edition Collection
                    </Heading>
                    <Text color="secondary" className="mb-8 max-w-3xl">
                      Limited run of 1,000 units worldwide. Each includes 8 LED panels, 24v controller, 10-year warranty, and MJN NFT ownership certificate.
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
                      <Heading level={2} className="text-3xl mb-2">Expand Your Fixture</Heading>
                      <Text color="secondary">
                        Add panels and upgrade components to customize your installation.
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
                      <Heading level={2} className="text-3xl mb-2">Accessories</Heading>
                      <Text color="secondary">
                        Enhance and customize your fixture's appearance.
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
                      <Heading level={2} className="text-3xl mb-2">DIY Kits</Heading>
                      <Text color="secondary">
                        For makers who want to assemble themselves. Requires technical knowledge.
                      </Text>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      {diyKits.map(product => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </Container>
    </div>
  );
}
