import type { HTMLAttributes, ReactNode } from 'react';

export interface TextProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
  size?: 'lg' | 'body' | 'sm' | 'caption';
  color?: 'primary' | 'secondary' | 'muted' | 'inverse';
  as?: 'p' | 'span' | 'div';
}

/**
 * Text Component
 *
 * Semantic text component with consistent typography from design system.
 * Can be rendered as p, span, or div elements.
 *
 * @example
 * <Text>Default paragraph text</Text>
 * <Text size="sm" color="secondary">Small secondary text</Text>
 * <Text as="span" size="caption" color="muted">Caption text</Text>
 */
export function Text({
  children,
  size = 'body',
  color = 'primary',
  as = 'p',
  className = '',
  ...props
}: TextProps) {
  const Tag = as;

  // Size-based styles
  const sizeClasses = {
    lg: 'text-lg',
    body: 'text-base',
    sm: 'text-sm',
    caption: 'text-xs',
  };

  // Color variants
  const colorClasses = {
    primary: 'text-gray-900',
    secondary: 'text-gray-600',
    muted: 'text-gray-500',
    inverse: 'text-white',
  };

  const combinedClasses = `
    ${sizeClasses[size]}
    ${colorClasses[color]}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <Tag className={combinedClasses} {...props}>
      {children}
    </Tag>
  );
}
