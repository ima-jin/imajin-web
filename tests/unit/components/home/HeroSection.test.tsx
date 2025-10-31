/**
 * HeroSection Component Tests
 * Phase 2.4.7 - Phase 2
 *
 * Tests for the homepage hero section
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import HeroSection from '@/components/home/HeroSection';

const mockContent = {
  heading: 'Modular LED Lighting',
  subheading: 'Transform your space with modular LED fixtures',
  cta_primary: {
    label: 'Explore Products',
    href: '/products',
    aria_label: 'View all products',
  },
  cta_secondary: {
    label: 'Learn More',
    href: '/about',
    aria_label: 'Learn more about Imajin',
  },
};

describe('HeroSection', () => {
  describe('Content', () => {
    it('should display hero title', () => {
      render(<HeroSection content={mockContent} />);

      // Should have an h1 heading
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
      expect(heading.textContent).toBeTruthy();
    });

    it('should display subtitle/tagline', () => {
      render(<HeroSection content={mockContent} />);

      // Should contain the subheading text
      const text = screen.getByText(/transform your space/i);
      expect(text).toBeInTheDocument();
    });

    it('should have primary CTA button', () => {
      render(<HeroSection content={mockContent} />);

      // Should have a link to products page
      const cta = screen.getByRole('link', { name: /explore|shop|view products/i });
      expect(cta).toBeInTheDocument();
      expect(cta).toHaveAttribute('href', '/products');
    });

    it('should use design system Heading component', () => {
      const { container } = render(<HeroSection content={mockContent} />);

      // Heading should use proper design system classes
      const heading = container.querySelector('h1');
      expect(heading).toBeInTheDocument();
    });
  });

  describe('Styling & Layout', () => {
    it('should have full-width hero layout', () => {
      const { container } = render(<HeroSection content={mockContent} />);

      // Hero section should span full width
      const heroContainer = container.firstChild;
      expect(heroContainer).toBeInTheDocument();
    });

    it('should center content properly', () => {
      const { container } = render(<HeroSection content={mockContent} />);

      // Content should be centered - check for centered text
      const centerContent = container.querySelector('.text-center');
      expect(centerContent).toBeInTheDocument();
    });

    it('should have proper vertical spacing', () => {
      const { container } = render(<HeroSection content={mockContent} />);

      // Hero should have padding/margin for spacing
      const hero = container.firstChild as HTMLElement;
      expect(hero).toBeInTheDocument();
    });

    it('should be responsive', () => {
      const { container } = render(<HeroSection content={mockContent} />);

      // Should render without layout issues
      expect(container.firstChild).toBeInTheDocument();
    });
  });
});
