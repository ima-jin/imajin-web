import type { HTMLAttributes, ReactNode } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hover?: boolean;
  noPadding?: boolean;
}

export interface CardSubComponentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

/**
 * Card Component
 *
 * Container component for content with consistent styling.
 * Use with CardHeader, CardContent, and CardFooter sub-components.
 *
 * @example
 * <Card hover>
 *   <CardHeader>Product Title</CardHeader>
 *   <CardContent>Product description goes here.</CardContent>
 *   <CardFooter>$99.99</CardFooter>
 * </Card>
 */
export function Card({
  children,
  hover = false,
  noPadding = false,
  className = '',
  ...props
}: CardProps) {
  const baseClasses = 'border border-gray-200 rounded-lg bg-white overflow-hidden';
  const hoverClasses = hover ? 'hover:shadow-lg transition-shadow duration-200' : '';
  const paddingClasses = noPadding ? '' : 'p-4';

  const combinedClasses = `${baseClasses} ${hoverClasses} ${paddingClasses} ${className}`.trim().replace(/\s+/g, ' ');

  return (
    <div className={combinedClasses} {...props}>
      {children}
    </div>
  );
}

/**
 * CardHeader Component
 *
 * Header section for Card component.
 * Typically contains title or heading.
 */
export function CardHeader({
  children,
  className = '',
  ...props
}: CardSubComponentProps) {
  const baseClasses = 'px-4 py-3 border-b border-gray-200 bg-gray-50';
  const combinedClasses = `${baseClasses} ${className}`.trim().replace(/\s+/g, ' ');

  return (
    <div className={combinedClasses} {...props}>
      {children}
    </div>
  );
}

/**
 * CardContent Component
 *
 * Main content section for Card component.
 */
export function CardContent({
  children,
  className = '',
  ...props
}: CardSubComponentProps) {
  const baseClasses = 'px-4 py-4';
  const combinedClasses = `${baseClasses} ${className}`.trim().replace(/\s+/g, ' ');

  return (
    <div className={combinedClasses} {...props}>
      {children}
    </div>
  );
}

/**
 * CardFooter Component
 *
 * Footer section for Card component.
 * Typically contains actions or metadata.
 */
export function CardFooter({
  children,
  className = '',
  ...props
}: CardSubComponentProps) {
  const baseClasses = 'px-4 py-3 border-t border-gray-200 bg-gray-50';
  const combinedClasses = `${baseClasses} ${className}`.trim().replace(/\s+/g, ' ');

  return (
    <div className={combinedClasses} {...props}>
      {children}
    </div>
  );
}
