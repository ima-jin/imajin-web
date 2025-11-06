/**
 * PolicyPage Component Tests
 * Phase 3.1 - Policy Page Infrastructure
 *
 * Tests for PolicyPage component rendering policy content with markdown
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PolicyPage } from '@/components/policies/PolicyPage';

describe('PolicyPage Component', () => {
  describe('Content Rendering', () => {
    it('should render page heading from content prop', () => {
      // Arrange
      const content = {
        heading: 'Terms of Service',
        body: 'Content here',
        updated: '2025-11-01',
      };

      // Act
      render(<PolicyPage content={content} />);

      // Assert
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Terms of Service');
    });

    it('should render markdown body with proper HTML elements', () => {
      const content = {
        heading: 'Privacy Policy',
        body: '## Section 1\n\nParagraph with **bold** text.',
        updated: '2025-11-01',
      };

      render(<PolicyPage content={content} />);

      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Section 1');
      expect(screen.getByText(/bold/)).toBeInTheDocument();
    });

    it('should display last updated date in readable format', () => {
      const content = {
        heading: 'FAQ',
        body: 'Content',
        updated: '2025-11-01',
      };

      const { container } = render(<PolicyPage content={content} />);

      expect(screen.getByText(/Last updated/i)).toBeInTheDocument();
      // Check container text content for formatted date
      expect(container.textContent).toContain('November 1, 2025');
    });

    it('should show error message when content is missing', () => {
      render(<PolicyPage content={null} />);

      expect(screen.getByText(/content not available/i)).toBeInTheDocument();
    });
  });

  describe('Markdown Rendering', () => {
    it('should render markdown links with proper attributes', () => {
      const content = {
        heading: 'Policy',
        body: '[Contact us](mailto:info@imajin.ca)',
        updated: '2025-11-01',
      };

      render(<PolicyPage content={content} />);

      const link = screen.getByRole('link', { name: /contact us/i });
      expect(link).toHaveAttribute('href', 'mailto:info@imajin.ca');
    });

    it('should render ordered and unordered lists', () => {
      const content = {
        heading: 'Policy',
        body: '- Item 1\n- Item 2\n\n1. Numbered item',
        updated: '2025-11-01',
      };

      render(<PolicyPage content={content} />);

      const lists = screen.getAllByRole('list');
      expect(lists.length).toBeGreaterThanOrEqual(1);
    });

    it('should sanitize dangerous HTML in markdown', () => {
      const content = {
        heading: 'Policy',
        body: 'Safe content\n\n<script>alert("XSS")</script>\n\nMore safe content',
        updated: '2025-11-01',
      };

      const { container } = render(<PolicyPage content={content} />);

      // Should not contain script tag
      expect(container.querySelector('script')).not.toBeInTheDocument();
      expect(screen.queryByText(/alert/)).not.toBeInTheDocument();

      // Safe content should be present
      expect(container.textContent).toContain('Safe content');
      expect(container.textContent).toContain('More safe content');
    });
  });

  describe('SEO and Accessibility', () => {
    it('should use semantic HTML structure', () => {
      const content = {
        heading: 'Policy',
        body: 'Content',
        updated: '2025-11-01',
      };

      const { container } = render(<PolicyPage content={content} />);

      expect(container.querySelector('article')).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });
  });

  describe('Draft Badge Display', () => {
    it('should display draft badge when isDraft is true', () => {
      const content = {
        heading: 'Policy',
        body: 'Content',
        updated: '2025-11-01',
        isDraft: true,
      };

      render(<PolicyPage content={content} />);

      expect(screen.getByText(/draft/i)).toBeInTheDocument();
    });

    it('should not display draft badge when isDraft is false', () => {
      const content = {
        heading: 'Policy',
        body: 'Content',
        updated: '2025-11-01',
        isDraft: false,
      };

      render(<PolicyPage content={content} />);

      expect(screen.queryByText(/draft/i)).not.toBeInTheDocument();
    });
  });
});
