import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProductSpecs } from "@/components/products/ProductSpecs";

describe("ProductSpecs", () => {
  const mockSpecs = [
    { specKey: "led_count", specValue: "64", specUnit: "LEDs", displayOrder: 1 },
    { specKey: "voltage", specValue: "5", specUnit: "v", displayOrder: 2 },
    { specKey: "power_consumption", specValue: "30", specUnit: "W", displayOrder: 3 },
  ];

  it("renders specifications title", () => {
    render(<ProductSpecs specs={mockSpecs} />);
    expect(screen.getByText("Specifications")).toBeInTheDocument();
  });

  it("renders all spec keys with formatted names", () => {
    render(<ProductSpecs specs={mockSpecs} />);

    expect(screen.getByText("Led Count")).toBeInTheDocument();
    expect(screen.getByText("Voltage")).toBeInTheDocument();
    expect(screen.getByText("Power Consumption")).toBeInTheDocument();
  });

  it("renders spec values with units", () => {
    render(<ProductSpecs specs={mockSpecs} />);

    expect(screen.getByText("64 LEDs")).toBeInTheDocument();
    expect(screen.getByText("5 v")).toBeInTheDocument();
    expect(screen.getByText("30 W")).toBeInTheDocument();
  });

  it("handles specs without units", () => {
    const specsWithoutUnit = [
      { specKey: "color", specValue: "Black", specUnit: null, displayOrder: 1 },
    ];

    render(<ProductSpecs specs={specsWithoutUnit} />);
    expect(screen.getByText("Black")).toBeInTheDocument();
    expect(screen.queryByText("Black null")).not.toBeInTheDocument();
  });

  it("returns null for empty specs array", () => {
    const { container } = render(<ProductSpecs specs={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("capitalizes each word in multi-word spec keys", () => {
    const multiWordSpecs = [
      { specKey: "warranty_years", specValue: "10", specUnit: "years", displayOrder: 1 },
    ];

    render(<ProductSpecs specs={multiWordSpecs} />);
    expect(screen.getByText("Warranty Years")).toBeInTheDocument();
  });

  it("renders specs in correct order", () => {
    render(<ProductSpecs specs={mockSpecs} />);

    const specElements = screen.getAllByText(/Led Count|Voltage|Power Consumption/);
    expect(specElements[0]).toHaveTextContent("Led Count");
    expect(specElements[1]).toHaveTextContent("Voltage");
    expect(specElements[2]).toHaveTextContent("Power Consumption");
  });

  it("applies border and styling classes", () => {
    const { container } = render(<ProductSpecs specs={mockSpecs} />);
    const wrapper = container.firstChild;

    expect(wrapper).toHaveClass("border");
    expect(wrapper).toHaveClass("rounded-lg");
  });
});
