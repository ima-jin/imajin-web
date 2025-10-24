interface ProductSpec {
  specKey: string;
  specValue: string;
  specUnit: string | null;
  displayOrder: number;
}

interface ProductSpecsProps {
  specs: ProductSpec[];
}

/**
 * ProductSpecs Component
 *
 * Displays product technical specifications in a clean table format
 * - Shows spec key, value, and unit
 * - Formatted for readability
 * - Respects display order from database
 */
export function ProductSpecs({ specs }: ProductSpecsProps) {
  if (specs.length === 0) {
    return null;
  }

  // Format spec key for display (replace underscores, capitalize)
  const formatSpecKey = (key: string): string => {
    return key
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Specifications</h3>
      </div>
      <div className="divide-y divide-gray-200">
        {specs.map((spec, index) => (
          <div
            key={`${spec.specKey}-${index}`}
            className="px-4 py-3 flex justify-between items-center hover:bg-gray-50 transition-colors"
          >
            <span className="text-sm font-medium text-gray-700">
              {formatSpecKey(spec.specKey)}
            </span>
            <span className="text-sm text-gray-900">
              {spec.specValue}
              {spec.specUnit && ` ${spec.specUnit}`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
