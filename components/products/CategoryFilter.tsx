"use client";

import type { ProductCategory } from "@/types/product";

interface CategoryFilterProps {
  categories: ProductCategory[];
  selectedCategory: ProductCategory | null;
  onChange: (category: ProductCategory | null) => void;
}

/**
 * CategoryFilter Component
 *
 * Displays clickable filter buttons for product categories
 * - Shows "All" option to clear filter
 * - Highlights selected category
 * - Capitalizes category labels for display
 */
export function CategoryFilter({ categories, selectedCategory, onChange }: CategoryFilterProps) {
  // Capitalize first letter of category for display
  const formatCategory = (category: string): string => {
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {/* All button */}
      <button
        onClick={() => onChange(null)}
        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
          selectedCategory === null
            ? "bg-gray-900 text-white"
            : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
        }`}
      >
        All
      </button>

      {/* Category buttons */}
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => onChange(category)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            selectedCategory === category
              ? "bg-gray-900 text-white"
              : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
          }`}
        >
          {formatCategory(category)}
        </button>
      ))}
    </div>
  );
}
