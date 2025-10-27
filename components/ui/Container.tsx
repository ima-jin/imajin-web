import type { HTMLAttributes, ReactNode } from 'react';

export interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

/**
 * Container Component
 *
 * Layout container with max-width and centered alignment.
 * Provides consistent horizontal spacing across the application.
 *
 * @example
 * <Container>
 *   <Heading level={1}>Page Title</Heading>
 *   <Text>Page content...</Text>
 * </Container>
 */
export function Container({
  children,
  className = '',
  ...props
}: ContainerProps) {
  const baseClasses = 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8';

  const combinedClasses = `${baseClasses} ${className}`.trim().replace(/\s+/g, ' ');

  return (
    <div className={combinedClasses} {...props}>
      {children}
    </div>
  );
}
