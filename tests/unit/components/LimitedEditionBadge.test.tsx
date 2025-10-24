import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LimitedEditionBadge } from "@/components/products/LimitedEditionBadge";

describe("LimitedEditionBadge", () => {
  it("does not render for unlimited quantities (null maxQuantity)", () => {
    const { container } = render(
      <LimitedEditionBadge availableQuantity={null} maxQuantity={null} isAvailable={true} />
    );

    expect(container.firstChild).toBeNull();
  });

  it("renders 'Sold Out' when isAvailable is false", () => {
    render(<LimitedEditionBadge availableQuantity={0} maxQuantity={100} isAvailable={false} />);

    expect(screen.getByText(/sold out/i)).toBeInTheDocument();
  });

  it("renders 'Sold Out' when availableQuantity is 0", () => {
    render(<LimitedEditionBadge availableQuantity={0} maxQuantity={100} isAvailable={true} />);

    expect(screen.getByText(/sold out/i)).toBeInTheDocument();
  });

  it("shows remaining quantity for limited edition", () => {
    render(<LimitedEditionBadge availableQuantity={50} maxQuantity={100} isAvailable={true} />);

    expect(screen.getByText(/50 remaining/i)).toBeInTheDocument();
    expect(screen.getByText(/limited edition/i)).toBeInTheDocument();
  });

  it("applies low stock styling when less than 10% remaining", () => {
    const { container } = render(
      <LimitedEditionBadge availableQuantity={5} maxQuantity={100} isAvailable={true} />
    );

    const badge = container.firstChild;
    expect(badge).toHaveClass("bg-amber-100");
    expect(badge).toHaveClass("text-amber-700");
  });

  it("applies normal styling when more than 10% remaining", () => {
    const { container } = render(
      <LimitedEditionBadge availableQuantity={50} maxQuantity={100} isAvailable={true} />
    );

    const badge = container.firstChild;
    expect(badge).toHaveClass("bg-blue-100");
    expect(badge).toHaveClass("text-blue-700");
  });

  it("handles exactly 10% remaining as not low stock", () => {
    const { container } = render(
      <LimitedEditionBadge availableQuantity={10} maxQuantity={100} isAvailable={true} />
    );

    const badge = container.firstChild;
    expect(badge).toHaveClass("bg-blue-100");
  });

  it("handles 1 unit remaining correctly", () => {
    render(<LimitedEditionBadge availableQuantity={1} maxQuantity={500} isAvailable={true} />);

    expect(screen.getByText(/1 remaining/i)).toBeInTheDocument();
  });

  it("applies sold out styling with red colors", () => {
    const { container } = render(
      <LimitedEditionBadge availableQuantity={0} maxQuantity={100} isAvailable={false} />
    );

    const badge = container.firstChild;
    expect(badge).toHaveClass("bg-red-100");
    expect(badge).toHaveClass("text-red-700");
  });
});
