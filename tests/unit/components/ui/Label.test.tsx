import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Label } from '@/components/ui/Label';

describe('Label', () => {
  describe('Rendering', () => {
    it('renders with children text', () => {
      render(<Label>Name</Label>);
      expect(screen.getByText('Name')).toBeInTheDocument();
    });

    it('renders with htmlFor attribute', () => {
      render(<Label htmlFor="email">Email</Label>);
      const label = screen.getByText('Email');
      expect(label).toHaveAttribute('for', 'email');
    });

    it('applies base styles', () => {
      render(<Label>Label</Label>);
      const label = screen.getByText('Label');
      expect(label).toHaveClass('block', 'text-sm', 'font-medium', 'text-gray-700');
    });
  });

  describe('Required indicator', () => {
    it('does not show required indicator by default', () => {
      render(<Label>Optional</Label>);
      expect(screen.queryByText('*')).not.toBeInTheDocument();
    });

    it('shows required indicator when required is true', () => {
      render(<Label required>Required Field</Label>);
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('has proper aria-label on required indicator', () => {
      render(<Label required>Required Field</Label>);
      const indicator = screen.getByText('*');
      expect(indicator).toHaveAttribute('aria-label', 'required');
    });

    it('applies red color to required indicator', () => {
      render(<Label required>Required Field</Label>);
      const indicator = screen.getByText('*');
      expect(indicator).toHaveClass('text-red-500');
    });
  });

  describe('Custom className', () => {
    it('merges custom className with default styles', () => {
      render(<Label className="custom-class">Custom</Label>);
      const label = screen.getByText('Custom');
      expect(label).toHaveClass('custom-class');
      expect(label).toHaveClass('text-gray-700'); // Still has default styles
    });
  });

  describe('Accessibility', () => {
    it('renders as label element', () => {
      render(<Label>Field Label</Label>);
      const label = screen.getByText('Field Label');
      expect(label.tagName).toBe('LABEL');
    });

    it('associates with input via htmlFor', () => {
      render(
        <>
          <Label htmlFor="test-input">Test Label</Label>
          <input id="test-input" type="text" />
        </>
      );
      const label = screen.getByText('Test Label');
      const input = screen.getByRole('textbox');
      expect(label).toHaveAttribute('for', 'test-input');
      expect(input).toHaveAttribute('id', 'test-input');
    });
  });
});
