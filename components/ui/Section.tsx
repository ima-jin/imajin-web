import type { HTMLAttributes, ReactNode } from 'react';

export interface SectionProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
  background?: 'light' | 'dark' | 'neutral';
}

/**
 * Section Component
 *
 * Semantic section wrapper with consistent spacing and background variants.
 * Uses design tokens for spacing and colors.
 *
 * @example
 * <Section background="dark">
 *   <Container>
 *     <Heading level={1} color="inverse">Hero Title</Heading>
 *   </Container>
 * </Section>
 */
export function Section({
  children,
  background = 'light',
  className = '',
  ...props
}: SectionProps) {
  // Background variants
  const backgroundClasses = {
    light: 'bg-white text-gray-900',
    dark: 'bg-black text-white',
    neutral: 'bg-gray-50 text-gray-900',
  };

  // Base styles with semantic spacing
  const baseClasses = 'py-8 sm:py-12 lg:py-16';

  const combinedClasses = `
    ${baseClasses}
    ${backgroundClasses[background]}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <section className={combinedClasses} {...props}>
      {children}
    </section>
  );
}
