import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { Checkbox } from '@/components/ui/Checkbox';

describe('Checkbox', () => {
  describe('Rendering', () => {
    it('renders checkbox element', () => {
      render(<Checkbox label="Accept terms" />);
      expect(screen.getByRole('checkbox')).toBeInTheDocument();
    });

    it('renders label text', () => {
      render(<Checkbox label="Accept terms and conditions" />);
      expect(screen.getByText('Accept terms and conditions')).toBeInTheDocument();
    });

    it('associates label with checkbox via htmlFor', () => {
      render(<Checkbox label="Accept" name="accept" />);
      const label = screen.getByText('Accept');
      const checkbox = screen.getByRole('checkbox');
      expect(label).toHaveAttribute('for', 'accept');
      expect(checkbox).toHaveAttribute('id', 'accept');
    });

    it('applies base styles to checkbox', () => {
      render(<Checkbox label="Test" />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveClass('w-4', 'h-4', 'border-gray-300', 'rounded');
    });
  });

  describe('Error states', () => {
    it('does not show error message by default', () => {
      render(<Checkbox label="Accept" />);
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('shows error message when provided', () => {
      render(<Checkbox label="Accept" error="You must accept terms" name="accept" />);
      expect(screen.getByRole('alert')).toHaveTextContent('You must accept terms');
    });

    it('applies error border when error is present', () => {
      render(<Checkbox label="Accept" error="Error message" />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveClass('border-red-500');
    });

    it('has correct aria-invalid when error is present', () => {
      render(<Checkbox label="Accept" error="Error message" />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveAttribute('aria-invalid', 'true');
    });

    it('links checkbox to error message via aria-describedby', () => {
      render(<Checkbox label="Accept" name="accept" error="Required" />);
      const checkbox = screen.getByRole('checkbox');
      const error = screen.getByRole('alert');
      expect(checkbox).toHaveAttribute('aria-describedby', 'accept-error');
      expect(error).toHaveAttribute('id', 'accept-error');
    });
  });

  describe('Interactions', () => {
    it('can be checked', async () => {
      const user = userEvent.setup();
      render(<Checkbox label="Accept" />);
      const checkbox = screen.getByRole('checkbox');

      expect(checkbox).not.toBeChecked();
      await user.click(checkbox);
      expect(checkbox).toBeChecked();
    });

    it('can be unchecked', async () => {
      const user = userEvent.setup();
      render(<Checkbox label="Accept" defaultChecked />);
      const checkbox = screen.getByRole('checkbox');

      expect(checkbox).toBeChecked();
      await user.click(checkbox);
      expect(checkbox).not.toBeChecked();
    });

    it('calls onChange handler when clicked', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<Checkbox label="Accept" onChange={handleChange} />);

      await user.click(screen.getByRole('checkbox'));
      expect(handleChange).toHaveBeenCalled();
    });

    it('does not trigger onChange when disabled', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<Checkbox label="Accept" disabled onChange={handleChange} />);
      const checkbox = screen.getByRole('checkbox');

      await user.click(checkbox);
      expect(handleChange).not.toHaveBeenCalled();
      expect(checkbox).toBeDisabled();
    });
  });

  describe('Disabled state', () => {
    it('shows disabled styles', () => {
      render(<Checkbox label="Accept" disabled />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveClass('disabled:opacity-50', 'disabled:cursor-not-allowed');
    });

    it('is not interactive when disabled', () => {
      render(<Checkbox label="Accept" disabled />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeDisabled();
    });
  });

  describe('Required field', () => {
    it('marks checkbox as required when specified', () => {
      render(<Checkbox label="Accept" required />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeRequired();
    });
  });

  describe('Custom className', () => {
    it('merges custom className with default styles', () => {
      render(<Checkbox label="Accept" className="custom-class" />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveClass('custom-class');
      expect(checkbox).toHaveClass('w-4'); // Still has default styles
    });
  });

  describe('Ref forwarding', () => {
    it('forwards ref to checkbox element', () => {
      const ref = { current: null as HTMLInputElement | null };
      render(<Checkbox label="Accept" ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLInputElement);
    });
  });
});
