import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { Select } from '@/components/ui/Select';

const mockOptions = [
  { value: 'us', label: 'United States' },
  { value: 'ca', label: 'Canada' },
  { value: 'mx', label: 'Mexico' },
];

describe('Select', () => {
  describe('Rendering', () => {
    it('renders select element', () => {
      render(<Select options={mockOptions} />);
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('renders with label when provided', () => {
      render(<Select label="Country" name="country" options={mockOptions} />);
      expect(screen.getByText('Country')).toBeInTheDocument();
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('associates label with select via htmlFor', () => {
      render(<Select label="Country" name="country" options={mockOptions} />);
      const label = screen.getByText('Country');
      const select = screen.getByRole('combobox');
      expect(label).toHaveAttribute('for', 'country');
      expect(select).toHaveAttribute('id', 'country');
    });

    it('applies base styles', () => {
      render(<Select options={mockOptions} />);
      const select = screen.getByRole('combobox');
      expect(select).toHaveClass('w-full', 'px-3', 'py-2', 'border', 'rounded-md');
    });

    it('renders all options', () => {
      render(<Select options={mockOptions} />);
      expect(screen.getByRole('option', { name: 'United States' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Canada' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Mexico' })).toBeInTheDocument();
    });
  });

  describe('Placeholder', () => {
    it('does not render placeholder by default', () => {
      render(<Select options={mockOptions} />);
      expect(screen.queryByRole('option', { name: 'Select an option' })).not.toBeInTheDocument();
    });

    it('renders placeholder option when provided', () => {
      render(<Select options={mockOptions} placeholder="Select country" />);
      expect(screen.getByRole('option', { name: 'Select country' })).toBeInTheDocument();
    });

    it('makes placeholder option disabled', () => {
      render(<Select options={mockOptions} placeholder="Select country" />);
      const placeholderOption = screen.getByRole('option', { name: 'Select country' });
      expect(placeholderOption).toHaveAttribute('disabled');
    });

    it('sets placeholder value to empty string', () => {
      render(<Select options={mockOptions} placeholder="Select country" />);
      const placeholderOption = screen.getByRole('option', { name: 'Select country' });
      expect(placeholderOption).toHaveValue('');
    });
  });

  describe('Error states', () => {
    it('does not show error message by default', () => {
      render(<Select label="Country" options={mockOptions} />);
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('shows error message when provided', () => {
      render(<Select label="Country" error="Country is required" name="country" options={mockOptions} />);
      expect(screen.getByRole('alert')).toHaveTextContent('Country is required');
    });

    it('applies error border when error is present', () => {
      render(<Select error="Error message" options={mockOptions} />);
      const select = screen.getByRole('combobox');
      expect(select).toHaveClass('border-red-500');
    });

    it('has correct aria-invalid when error is present', () => {
      render(<Select error="Error message" options={mockOptions} />);
      const select = screen.getByRole('combobox');
      expect(select).toHaveAttribute('aria-invalid', 'true');
    });

    it('links select to error message via aria-describedby', () => {
      render(<Select name="country" error="Invalid country" options={mockOptions} />);
      const select = screen.getByRole('combobox');
      const error = screen.getByRole('alert');
      expect(select).toHaveAttribute('aria-describedby', 'country-error');
      expect(error).toHaveAttribute('id', 'country-error');
    });
  });

  describe('Helper text', () => {
    it('shows helper text when provided', () => {
      render(<Select helperText="Choose your country" name="country" options={mockOptions} />);
      expect(screen.getByText('Choose your country')).toBeInTheDocument();
    });

    it('links select to helper text via aria-describedby', () => {
      render(<Select name="country" helperText="Helper text" options={mockOptions} />);
      const select = screen.getByRole('combobox');
      expect(select).toHaveAttribute('aria-describedby', 'country-helper');
    });

    it('does not show helper text when error is present', () => {
      render(<Select helperText="Helper text" error="Error message" options={mockOptions} />);
      expect(screen.getByRole('alert')).toHaveTextContent('Error message');
      expect(screen.queryByText('Helper text')).not.toBeInTheDocument();
    });

    it('prioritizes error over helper text in aria-describedby', () => {
      render(<Select name="country" helperText="Helper" error="Error" options={mockOptions} />);
      const select = screen.getByRole('combobox');
      expect(select).toHaveAttribute('aria-describedby', 'country-error');
    });
  });

  describe('Interactions', () => {
    it('allows user to select option', async () => {
      const user = userEvent.setup();
      render(<Select options={mockOptions} />);
      const select = screen.getByRole('combobox');

      await user.selectOptions(select, 'ca');
      expect(select).toHaveValue('ca');
    });

    it('calls onChange handler when selection changes', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<Select onChange={handleChange} options={mockOptions} />);

      await user.selectOptions(screen.getByRole('combobox'), 'us');
      expect(handleChange).toHaveBeenCalled();
    });

    it('does not allow selection when disabled', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<Select disabled onChange={handleChange} options={mockOptions} />);
      const select = screen.getByRole('combobox');

      await user.selectOptions(select, 'ca');
      expect(handleChange).not.toHaveBeenCalled();
      expect(select).toBeDisabled();
    });
  });

  describe('Disabled state', () => {
    it('shows disabled styles', () => {
      render(<Select disabled options={mockOptions} />);
      const select = screen.getByRole('combobox');
      expect(select).toHaveClass('disabled:bg-gray-100', 'disabled:cursor-not-allowed');
    });

    it('is not interactive when disabled', () => {
      render(<Select disabled options={mockOptions} />);
      const select = screen.getByRole('combobox');
      expect(select).toBeDisabled();
    });
  });

  describe('Required field', () => {
    it('marks select as required when specified', () => {
      render(<Select required options={mockOptions} />);
      const select = screen.getByRole('combobox');
      expect(select).toBeRequired();
    });
  });

  describe('Custom className', () => {
    it('merges custom className with default styles', () => {
      render(<Select className="custom-class" options={mockOptions} />);
      const select = screen.getByRole('combobox');
      expect(select).toHaveClass('custom-class');
      expect(select).toHaveClass('w-full'); // Still has default styles
    });
  });

  describe('Ref forwarding', () => {
    it('forwards ref to select element', () => {
      const ref = { current: null as HTMLSelectElement | null };
      render(<Select ref={ref} options={mockOptions} />);
      expect(ref.current).toBeInstanceOf(HTMLSelectElement);
    });
  });
});
