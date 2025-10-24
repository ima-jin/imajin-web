import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CategoryFilter } from "@/components/products/CategoryFilter";
import type { ProductCategory } from "@/types/product";

describe("CategoryFilter", () => {
  const mockOnChange = vi.fn();

  const categories: ProductCategory[] = ["material", "connector", "control", "kit"];

  it("renders all category options", () => {
    render(<CategoryFilter categories={categories} selectedCategory={null} onChange={mockOnChange} />);

    expect(screen.getByText("Material")).toBeInTheDocument();
    expect(screen.getByText("Connector")).toBeInTheDocument();
    expect(screen.getByText("Control")).toBeInTheDocument();
    expect(screen.getByText("Kit")).toBeInTheDocument();
  });

  it("renders 'All' option", () => {
    render(<CategoryFilter categories={categories} selectedCategory={null} onChange={mockOnChange} />);

    expect(screen.getByText("All")).toBeInTheDocument();
  });

  it("calls onChange when category is clicked", () => {
    render(<CategoryFilter categories={categories} selectedCategory={null} onChange={mockOnChange} />);

    const materialButton = screen.getByText("Material");
    fireEvent.click(materialButton);

    expect(mockOnChange).toHaveBeenCalledWith("material");
  });

  it("calls onChange with null when 'All' is clicked", () => {
    render(<CategoryFilter categories={categories} selectedCategory="material" onChange={mockOnChange} />);

    const allButton = screen.getByText("All");
    fireEvent.click(allButton);

    expect(mockOnChange).toHaveBeenCalledWith(null);
  });

  it("highlights selected category", () => {
    render(<CategoryFilter categories={categories} selectedCategory="material" onChange={mockOnChange} />);

    const materialButton = screen.getByText("Material");
    expect(materialButton).toHaveClass("bg-gray-900");
    expect(materialButton).toHaveClass("text-white");
  });

  it("highlights 'All' when no category selected", () => {
    render(<CategoryFilter categories={categories} selectedCategory={null} onChange={mockOnChange} />);

    const allButton = screen.getByText("All");
    expect(allButton).toHaveClass("bg-gray-900");
    expect(allButton).toHaveClass("text-white");
  });

  it("does not highlight unselected categories", () => {
    render(<CategoryFilter categories={categories} selectedCategory="material" onChange={mockOnChange} />);

    const connectorButton = screen.getByText("Connector");
    expect(connectorButton).not.toHaveClass("bg-gray-900");
    expect(connectorButton).toHaveClass("bg-white");
  });

  it("renders with empty categories array", () => {
    render(<CategoryFilter categories={[]} selectedCategory={null} onChange={mockOnChange} />);

    // Should still show 'All' option
    expect(screen.getByText("All")).toBeInTheDocument();
  });

  it("capitalizes category labels correctly", () => {
    render(<CategoryFilter categories={categories} selectedCategory={null} onChange={mockOnChange} />);

    // Category value is lowercase, but display should be capitalized
    expect(screen.getByText("Material")).toBeInTheDocument();
    expect(screen.queryByText("material")).not.toBeInTheDocument();
  });
});
