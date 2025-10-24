"use client";

import { useState, useEffect } from "react";
import { ProductGrid } from "@/components/products/ProductGrid";
import { CategoryFilter } from "@/components/products/CategoryFilter";
import type { Product, ProductCategory } from "@/types/product";

/**
 * Product Listing Page
 *
 * Displays:
 * - Category filter
 * - Product grid with all products
 * - Client-side filtering by category
 */
export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | null>(null);
  const [loading, setLoading] = useState(true);

  const categories: ProductCategory[] = ["material", "connector", "control", "kit", "interface"];

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        const url = selectedCategory
          ? `/api/products?category=${selectedCategory}`
          : "/api/products";

        const response = await fetch(url);
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
  }, [selectedCategory]);

  const handleCategoryChange = (category: ProductCategory | null) => {
    setSelectedCategory(category);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Page Header */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            Products
          </h1>
          <p className="text-lg text-gray-600">
            Browse our complete catalog of modular LED components and kits
          </p>
        </div>
      </div>

      {/* Filters and Products */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Category Filter */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Filter by Category</h2>
          <CategoryFilter
            categories={categories}
            selectedCategory={selectedCategory}
            onChange={handleCategoryChange}
          />
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading products...</p>
          </div>
        )}

        {/* Product Grid */}
        {!loading && <ProductGrid products={products} />}

        {/* Product Count */}
        {!loading && products.length > 0 && (
          <div className="mt-8 text-center text-sm text-gray-600">
            Showing {products.length} {products.length === 1 ? "product" : "products"}
          </div>
        )}
      </div>
    </div>
  );
}
