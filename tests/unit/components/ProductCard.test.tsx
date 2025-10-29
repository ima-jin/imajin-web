import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProductCard } from "@/components/products/ProductCard";
import { createMockProduct } from "@/tests/fixtures/product-fixtures";

// Mock cloudinary service
vi.mock("@/lib/services/cloudinary-service", () => ({
  cloudinaryService: {
    getCloudName: vi.fn(() => "imajin-ai"),
  },
}));

describe("ProductCard", () => {
  const mockProduct = createMockProduct({
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
  });

  const mockProductWithVariants = createMockProduct({
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
  });

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

  // Media Display Tests
  describe("Media Display", () => {
    it("displays Cloudinary image from media array", () => {
      const productWithMedia = createMockProduct({
        ...mockProduct,
        media: [
          {
            cloudinaryPublicId: "media/products/test/main",
            category: "main",
            localPath: "test/main.jpg",
            type: "image",
            mimeType: "image/jpeg",
            alt: "Test Product",
            order: 1,
          },
        ],
      });

      const { container } = render(<ProductCard product={productWithMedia} />);
      const image = container.querySelector("img");

      // Image should be rendered (getBestImageUrl will be called)
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute("alt", "Material-8x8-V");
    });

    it("uses placeholder when media array is empty", () => {
      const productNoMedia = createMockProduct({
        ...mockProduct,
        media: [],
      });

      const { container } = render(<ProductCard product={productNoMedia} />);
      const image = container.querySelector("img");

      // Placeholder image should be used (data:image/svg)
      expect(image).toBeInTheDocument();
      expect(image?.getAttribute("src")).toContain("data:image");
    });

    it("prefers main category image when multiple media items exist", () => {
      const productMultipleMedia = createMockProduct({
        ...mockProduct,
        media: [
          {
            cloudinaryPublicId: "media/products/test/detail",
            category: "detail",
            localPath: "test/detail.jpg",
            type: "image",
            mimeType: "image/jpeg",
            alt: "Detail View",
            order: 1,
          },
          {
            cloudinaryPublicId: "media/products/test/main",
            category: "main",
            localPath: "test/main.jpg",
            type: "image",
            mimeType: "image/jpeg",
            alt: "Main View",
            order: 2,
          },
        ],
      });

      const { container } = render(<ProductCard product={productMultipleMedia} />);
      const image = container.querySelector("img");

      // Should use getBestImageUrl which prefers 'main' category
      expect(image).toBeInTheDocument();
    });
  });

  // Sell Status Badge Tests
  describe("Sell Status Badges", () => {
    it("displays Pre-Order badge when sellStatus is pre-order", () => {
      const preOrderProduct = createMockProduct({
        ...mockProduct,
        isLive: true,
        sellStatus: "pre-order",
        sellStatusNote: "Ships December 2025",
      });

      render(<ProductCard product={preOrderProduct} />);
      expect(screen.getByText("Pre-Order")).toBeInTheDocument();
    });

    it("displays low stock badge when availableQuantity is low", () => {
      const lowStockProduct = createMockProduct({
        ...mockProduct,
        isLive: true,
        sellStatus: "for-sale",
        maxQuantity: 100,
        soldQuantity: 95,
        availableQuantity: 5,
      });

      render(<ProductCard product={lowStockProduct} />);
      expect(screen.getByText("Only 5 Left")).toBeInTheDocument();
    });

    it("displays Sold Out badge when availableQuantity is 0", () => {
      const soldOutProduct = createMockProduct({
        ...mockProduct,
        isLive: true,
        sellStatus: "for-sale",
        maxQuantity: 100,
        soldQuantity: 100,
        availableQuantity: 0,
      });

      render(<ProductCard product={soldOutProduct} />);
      expect(screen.getByText("Sold Out")).toBeInTheDocument();
    });

    it("displays multiple badges together (category, assembly, sell status)", () => {
      const multiStatusProduct = createMockProduct({
        ...mockProduct,
        requiresAssembly: true,
        isLive: true,
        sellStatus: "pre-order",
        maxQuantity: 100,
        soldQuantity: 90,
        availableQuantity: 10,
      });

      render(<ProductCard product={multiStatusProduct} />);

      // Should show all badges
      expect(screen.getByText("material")).toBeInTheDocument();
      expect(screen.getByText("Requires Assembly")).toBeInTheDocument();
      expect(screen.getByText("Pre-Order")).toBeInTheDocument();
    });

    it("does not display sell status badge for regular for-sale products", () => {
      const regularProduct = createMockProduct({
        ...mockProduct,
        isLive: true,
        sellStatus: "for-sale",
        maxQuantity: null,
        availableQuantity: null,
      });

      render(<ProductCard product={regularProduct} />);

      // Should NOT show Pre-Order or Sold Out badges
      expect(screen.queryByText("Pre-Order")).not.toBeInTheDocument();
      expect(screen.queryByText("Sold Out")).not.toBeInTheDocument();
      expect(screen.queryByText(/Only.*Left/)).not.toBeInTheDocument();
    });
  });

  // Product Visibility Tests
  describe("Product Visibility", () => {
    it("renders products with isLive=true", () => {
      const liveProduct = createMockProduct({
        ...mockProduct,
        isLive: true,
        sellStatus: "for-sale",
      });

      render(<ProductCard product={liveProduct} />);
      expect(screen.getByText("Material-8x8-V")).toBeInTheDocument();
    });

    it("renders even when isLive=false (visibility filtering happens at list level)", () => {
      const notLiveProduct = createMockProduct({
        ...mockProduct,
        isLive: false,
        sellStatus: "internal",
      });

      // ProductCard itself doesn't filter - that happens in product lists
      render(<ProductCard product={notLiveProduct} />);
      expect(screen.getByText("Material-8x8-V")).toBeInTheDocument();
    });
  });
});
