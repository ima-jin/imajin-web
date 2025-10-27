import type { HTMLAttributes, ReactNode, ElementType } from 'react';

export interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  color?: 'primary' | 'secondary' | 'muted' | 'inverse';
}

/**
 * Heading Component
 *
 * Semantic heading component with consistent typography from design system.
 * Renders h1-h6 elements with appropriate sizing and styling.
 *
 * @example
 * <Heading level={1}>Page Title</Heading>
 * <Heading level={2} color="secondary">Section Heading</Heading>
 * <Heading level={3} color="inverse">Dark Background Heading</Heading>
 */
export function Heading({
  children,
  level = 2,
  color = 'primary',
  className = '',
  ...props
}: HeadingProps) {
  const Tag = `h${level}` as ElementType;

  // Level-based styles
  const levelClasses = {
    1: 'text-3xl sm:text-4xl font-bold',
    2: 'text-2xl sm:text-3xl font-bold',
    3: 'text-xl font-semibold',
    4: 'text-lg font-semibold',
    5: 'text-base font-medium',
    6: 'text-sm font-medium',
  };

  // Color variants
  const colorClasses = {
    primary: 'text-gray-900',
    secondary: 'text-gray-600',
    muted: 'text-gray-500',
    inverse: 'text-white',
  };

  const combinedClasses = `
    ${levelClasses[level]}
    ${colorClasses[color]}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <Tag className={combinedClasses} {...props}>
      {children}
    </Tag>
  );
}
