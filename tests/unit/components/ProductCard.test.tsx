import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProductCard } from "@/components/products/ProductCard";
import type { Product } from "@/types/product";

describe("ProductCard", () => {
  const mockProduct: Product = {
    id: "Material-8x8-V",
    name: "Material-8x8-V",
    description: "8x8 LED material panel",
    category: "material",
    devStatus: 5,
    basePrice: 3500,
    isActive: true,
    requiresAssembly: false,
    hasVariants: false,
    maxQuantity: null,
    soldQuantity: 0,
    availableQuantity: null,
    isAvailable: true,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
  };

  const mockProductWithVariants: Product = {
    id: "Founder-Kit",
    name: "Founder Edition Kit",
    description: "Limited edition founder kit with 10-year warranty",
    category: "kit",
    devStatus: 5,
    basePrice: 10000,
    isActive: true,
    requiresAssembly: true,
    hasVariants: true,
    maxQuantity: 1000,
    soldQuantity: 0,
    availableQuantity: 1000,
    isAvailable: true,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
  };

  it("renders product name", () => {
    render(<ProductCard product={mockProduct} />);
    expect(screen.getByText("Material-8x8-V")).toBeInTheDocument();
  });

  it("renders product description", () => {
    render(<ProductCard product={mockProduct} />);
    expect(screen.getByText("8x8 LED material panel")).toBeInTheDocument();
  });

  it("renders formatted price", () => {
    render(<ProductCard product={mockProduct} />);
    // $35.00 (basePrice 3500 cents = $35.00)
    expect(screen.getByText("$35.00")).toBeInTheDocument();
  });

  it("renders category badge", () => {
    render(<ProductCard product={mockProduct} />);
    expect(screen.getByText("material")).toBeInTheDocument();
  });

  it("renders link to product detail page", () => {
    render(<ProductCard product={mockProduct} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/products/Material-8x8-V");
  });

  it("shows 'Requires Assembly' badge when requiresAssembly is true", () => {
    render(<ProductCard product={mockProductWithVariants} />);
    expect(screen.getByText("Requires Assembly")).toBeInTheDocument();
  });

  it("does not show 'Requires Assembly' badge when requiresAssembly is false", () => {
    render(<ProductCard product={mockProduct} />);
    expect(screen.queryByText("Requires Assembly")).not.toBeInTheDocument();
  });

  it("shows variants indicator when hasVariants is true", () => {
    render(<ProductCard product={mockProductWithVariants} />);
    expect(screen.getByText(/colors available/i)).toBeInTheDocument();
  });

  it("does not show variants indicator when hasVariants is false", () => {
    render(<ProductCard product={mockProduct} />);
    expect(screen.queryByText(/colors available/i)).not.toBeInTheDocument();
  });

  it("applies correct styling classes", () => {
    const { container } = render(<ProductCard product={mockProduct} />);
    // Link is first child, Card is inside it
    const link = container.firstChild;
    const card = link?.firstChild;

    // Card component should have border and rounded corners
    expect(card).toHaveClass("border");
    expect(card).toHaveClass("rounded-lg");
  });

  it("renders high-price products correctly", () => {
    render(<ProductCard product={mockProductWithVariants} />);
    // $100.00 (basePrice 10000 cents = $100.00)
    expect(screen.getByText("$100.00")).toBeInTheDocument();
  });

  it("handles products with no description gracefully", () => {
    const productNoDesc = { ...mockProduct, description: null };
    render(<ProductCard product={productNoDesc} />);
    expect(screen.getByText("Material-8x8-V")).toBeInTheDocument();
  });
});
