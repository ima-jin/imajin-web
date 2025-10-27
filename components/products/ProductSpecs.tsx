import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Heading } from "@/components/ui/Heading";
import { Text } from "@/components/ui/Text";

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
    <Card noPadding>
      <CardHeader>
        <Heading level={3} className="text-lg">
          Specifications
        </Heading>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-gray-200">
          {specs.map((spec, index) => (
            <div
              key={`${spec.specKey}-${index}`}
              className="px-4 py-3 flex justify-between items-center hover:bg-gray-50 transition-colors"
            >
              <Text size="sm" className="font-medium text-gray-700">
                {formatSpecKey(spec.specKey)}
              </Text>
              <Text size="sm">
                {spec.specValue}
                {spec.specUnit && ` ${spec.specUnit}`}
              </Text>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
