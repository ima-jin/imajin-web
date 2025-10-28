import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { Textarea } from '@/components/ui/Textarea';

describe('Textarea', () => {
  describe('Rendering', () => {
    it('renders textarea element', () => {
      render(<Textarea />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('renders with label when provided', () => {
      render(<Textarea label="Message" name="message" />);
      expect(screen.getByText('Message')).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('associates label with textarea via htmlFor', () => {
      render(<Textarea label="Message" name="message" />);
      const label = screen.getByText('Message');
      const textarea = screen.getByRole('textbox');
      expect(label).toHaveAttribute('for', 'message');
      expect(textarea).toHaveAttribute('id', 'message');
    });

    it('applies base styles', () => {
      render(<Textarea />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveClass('w-full', 'px-3', 'py-2', 'border', 'rounded-md');
    });
  });

  describe('Error states', () => {
    it('does not show error message by default', () => {
      render(<Textarea label="Message" />);
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('shows error message when provided', () => {
      render(<Textarea label="Message" error="Message is required" name="message" />);
      expect(screen.getByRole('alert')).toHaveTextContent('Message is required');
    });

    it('applies error border when error is present', () => {
      render(<Textarea error="Error message" />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveClass('border-red-500');
    });

    it('has correct aria-invalid when error is present', () => {
      render(<Textarea error="Error message" />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('aria-invalid', 'true');
    });

    it('links textarea to error message via aria-describedby', () => {
      render(<Textarea name="message" error="Invalid message" />);
      const textarea = screen.getByRole('textbox');
      const error = screen.getByRole('alert');
      expect(textarea).toHaveAttribute('aria-describedby', 'message-error');
      expect(error).toHaveAttribute('id', 'message-error');
    });
  });

  describe('Helper text', () => {
    it('shows helper text when provided', () => {
      render(<Textarea helperText="Enter your message" name="message" />);
      expect(screen.getByText('Enter your message')).toBeInTheDocument();
    });

    it('links textarea to helper text via aria-describedby', () => {
      render(<Textarea name="message" helperText="Helper text" />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('aria-describedby', 'message-helper');
    });

    it('does not show helper text when error is present', () => {
      render(<Textarea helperText="Helper text" error="Error message" />);
      expect(screen.getByRole('alert')).toHaveTextContent('Error message');
      expect(screen.queryByText('Helper text')).not.toBeInTheDocument();
    });
  });

  describe('Character count', () => {
    it('does not show character count by default', () => {
      render(<Textarea maxLength={100} />);
      expect(screen.queryByText(/\/100/)).not.toBeInTheDocument();
    });

    it('shows character count when showCharacterCount is true', () => {
      render(<Textarea showCharacterCount maxLength={100} />);
      expect(screen.getByText('0/100')).toBeInTheDocument();
    });

    it('updates character count as user types', async () => {
      const user = userEvent.setup();
      render(<Textarea showCharacterCount maxLength={100} />);

      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'Hello');

      expect(screen.getByText('5/100')).toBeInTheDocument();
    });

    it('does not show character count if maxLength is not provided', () => {
      render(<Textarea showCharacterCount />);
      expect(screen.queryByText(/\//)).not.toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('accepts user input', async () => {
      const user = userEvent.setup();
      render(<Textarea />);
      const textarea = screen.getByRole('textbox');

      await user.type(textarea, 'Test message');
      expect(textarea).toHaveValue('Test message');
    });

    it('calls onChange handler when value changes', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<Textarea onChange={handleChange} />);

      await user.type(screen.getByRole('textbox'), 'a');
      expect(handleChange).toHaveBeenCalled();
    });

    it('does not accept input when disabled', async () => {
      const user = userEvent.setup();
      render(<Textarea disabled />);
      const textarea = screen.getByRole('textbox');

      await user.type(textarea, 'test');
      expect(textarea).toHaveValue('');
      expect(textarea).toBeDisabled();
    });

    it('respects maxLength', async () => {
      const user = userEvent.setup();
      render(<Textarea maxLength={5} />);
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;

      await user.type(textarea, '123456');
      expect(textarea.value.length).toBeLessThanOrEqual(5);
    });
  });

  describe('Disabled state', () => {
    it('shows disabled styles', () => {
      render(<Textarea disabled />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveClass('disabled:bg-gray-100', 'disabled:cursor-not-allowed');
    });

    it('is not interactive when disabled', () => {
      render(<Textarea disabled />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeDisabled();
    });
  });

  describe('Placeholder', () => {
    it('shows placeholder text', () => {
      render(<Textarea placeholder="Enter message" />);
      expect(screen.getByPlaceholderText('Enter message')).toBeInTheDocument();
    });
  });

  describe('Required field', () => {
    it('marks textarea as required when specified', () => {
      render(<Textarea required />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeRequired();
    });
  });

  describe('Custom className', () => {
    it('merges custom className with default styles', () => {
      render(<Textarea className="custom-class" />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveClass('custom-class');
      expect(textarea).toHaveClass('w-full'); // Still has default styles
    });
  });

  describe('Ref forwarding', () => {
    it('forwards ref to textarea element', () => {
      const ref = { current: null as HTMLTextAreaElement | null };
      render(<Textarea ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
    });
  });
});
