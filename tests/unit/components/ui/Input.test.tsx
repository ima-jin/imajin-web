import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { Input } from '@/components/ui/Input';

describe('Input', () => {
  describe('Rendering', () => {
    it('renders input element', () => {
      render(<Input />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('renders with label when provided', () => {
      render(<Input label="Email" name="email" />);
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('associates label with input via htmlFor', () => {
      render(<Input label="Email" name="email" />);
      const label = screen.getByText('Email');
      const input = screen.getByRole('textbox');
      expect(label).toHaveAttribute('for', 'email');
      expect(input).toHaveAttribute('id', 'email');
    });

    it('applies base styles', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('w-full', 'px-3', 'py-2', 'border', 'rounded-md');
    });
  });

  describe('Error states', () => {
    it('does not show error message by default', () => {
      render(<Input label="Name" />);
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('shows error message when provided', () => {
      render(<Input label="Email" error="Invalid email" name="email" />);
      expect(screen.getByRole('alert')).toHaveTextContent('Invalid email');
    });

    it('applies error border when error is present', () => {
      render(<Input error="Error message" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('border-red-500');
    });

    it('has correct aria-invalid when error is present', () => {
      render(<Input error="Error message" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('links input to error message via aria-describedby', () => {
      render(<Input name="email" error="Invalid email" />);
      const input = screen.getByRole('textbox');
      const error = screen.getByRole('alert');
      expect(input).toHaveAttribute('aria-describedby', 'email-error');
      expect(error).toHaveAttribute('id', 'email-error');
    });
  });

  describe('Helper text', () => {
    it('shows helper text when provided', () => {
      render(<Input helperText="Enter your email address" name="email" />);
      expect(screen.getByText('Enter your email address')).toBeInTheDocument();
    });

    it('links input to helper text via aria-describedby', () => {
      render(<Input name="email" helperText="Helper text" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-describedby', 'email-helper');
    });

    it('does not show helper text when error is present', () => {
      render(<Input helperText="Helper text" error="Error message" />);
      expect(screen.getByRole('alert')).toHaveTextContent('Error message');
      expect(screen.queryByText('Helper text')).not.toBeInTheDocument();
    });

    it('prioritizes error over helper text in aria-describedby', () => {
      render(<Input name="email" helperText="Helper" error="Error" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-describedby', 'email-error');
    });
  });

  describe('Interactions', () => {
    it('accepts user input', async () => {
      const user = userEvent.setup();
      render(<Input />);
      const input = screen.getByRole('textbox');

      await user.type(input, 'test@example.com');
      expect(input).toHaveValue('test@example.com');
    });

    it('calls onChange handler when value changes', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<Input onChange={handleChange} />);

      await user.type(screen.getByRole('textbox'), 'a');
      expect(handleChange).toHaveBeenCalled();
    });

    it('does not accept input when disabled', async () => {
      const user = userEvent.setup();
      render(<Input disabled />);
      const input = screen.getByRole('textbox');

      await user.type(input, 'test');
      expect(input).toHaveValue('');
      expect(input).toBeDisabled();
    });
  });

  describe('Input types', () => {
    it('renders as text input by default', () => {
      render(<Input />);
      // Text type is default and may not be explicitly set in DOM
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('renders as email type when specified', () => {
      render(<Input type="email" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'email');
    });

    it('renders as password type when specified', () => {
      render(<Input type="password" />);
      const input = document.querySelector('input[type="password"]');
      expect(input).toBeInTheDocument();
    });
  });

  describe('Disabled state', () => {
    it('shows disabled styles', () => {
      render(<Input disabled />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('disabled:bg-gray-100', 'disabled:cursor-not-allowed');
    });

    it('is not interactive when disabled', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<Input disabled onChange={handleChange} />);

      await user.type(screen.getByRole('textbox'), 'test');
      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe('Placeholder', () => {
    it('shows placeholder text', () => {
      render(<Input placeholder="Enter email" />);
      expect(screen.getByPlaceholderText('Enter email')).toBeInTheDocument();
    });
  });

  describe('Required field', () => {
    it('marks input as required when specified', () => {
      render(<Input required />);
      const input = screen.getByRole('textbox');
      expect(input).toBeRequired();
    });
  });

  describe('Custom className', () => {
    it('merges custom className with default styles', () => {
      render(<Input className="custom-class" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('custom-class');
      expect(input).toHaveClass('w-full'); // Still has default styles
    });
  });

  describe('Ref forwarding', () => {
    it('forwards ref to input element', () => {
      const ref = { current: null as HTMLInputElement | null };
      render(<Input ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLInputElement);
    });
  });
});
