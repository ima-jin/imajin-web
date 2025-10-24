import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProductGrid } from "@/components/products/ProductGrid";
import type { Product } from "@/types/product";

describe("ProductGrid", () => {
  const mockProducts: Product[] = [
    {
      id: "product-1",
      name: "Product 1",
      description: "First product",
      category: "material",
      devStatus: 5,
      basePrice: 3500,
      isActive: true,
      requiresAssembly: false,
      hasVariants: false,
      createdAt: new Date("2025-01-01"),
      updatedAt: new Date("2025-01-01"),
    },
    {
      id: "product-2",
      name: "Product 2",
      description: "Second product",
      category: "connector",
      devStatus: 5,
      basePrice: 1200,
      isActive: true,
      requiresAssembly: false,
      hasVariants: false,
      createdAt: new Date("2025-01-01"),
      updatedAt: new Date("2025-01-01"),
    },
    {
      id: "product-3",
      name: "Product 3",
      description: "Third product",
      category: "kit",
      devStatus: 5,
      basePrice: 10000,
      isActive: true,
      requiresAssembly: true,
      hasVariants: true,
      createdAt: new Date("2025-01-01"),
      updatedAt: new Date("2025-01-01"),
    },
  ];

  it("renders all products in a grid", () => {
    render(<ProductGrid products={mockProducts} />);

    expect(screen.getByText("Product 1")).toBeInTheDocument();
    expect(screen.getByText("Product 2")).toBeInTheDocument();
    expect(screen.getByText("Product 3")).toBeInTheDocument();
  });

  it("applies grid layout classes", () => {
    const { container } = render(<ProductGrid products={mockProducts} />);
    const grid = container.firstChild;

    expect(grid).toHaveClass("grid");
  });

  it("renders empty state when no products", () => {
    render(<ProductGrid products={[]} />);

    expect(screen.getByText(/no products found/i)).toBeInTheDocument();
  });

  it("renders correct number of product cards", () => {
    const { container } = render(<ProductGrid products={mockProducts} />);
    const links = container.querySelectorAll("a");

    // Each ProductCard is wrapped in a Link
    expect(links).toHaveLength(3);
  });

  it("handles single product", () => {
    render(<ProductGrid products={[mockProducts[0]]} />);

    expect(screen.getByText("Product 1")).toBeInTheDocument();
    expect(screen.queryByText("Product 2")).not.toBeInTheDocument();
  });

  it("maintains responsive grid layout", () => {
    const { container } = render(<ProductGrid products={mockProducts} />);
    const grid = container.firstChild as HTMLElement;

    // Should have responsive grid classes (1 col mobile, 2 col tablet, 3+ col desktop)
    expect(grid?.className).toMatch(/grid-cols/);
  });
});
