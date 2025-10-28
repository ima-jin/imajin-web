import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorDisplay } from '@/components/error/ErrorDisplay';

describe('ErrorDisplay', () => {
  it('should render title and message', () => {
    render(
      <ErrorDisplay
        title="Test Error"
        message="This is a test error message"
      />
    );

    expect(screen.getByText('Test Error')).toBeInTheDocument();
    expect(screen.getByText('This is a test error message')).toBeInTheDocument();
  });

  it('should show retry button when onRetry provided', () => {
    const onRetry = vi.fn();
    render(
      <ErrorDisplay
        title="Test Error"
        message="Test message"
        onRetry={onRetry}
      />
    );

    const retryButton = screen.getByRole('button', { name: /try again/i });
    expect(retryButton).toBeInTheDocument();
  });

  it('should call onRetry when retry button clicked', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();

    render(
      <ErrorDisplay
        title="Test Error"
        message="Test message"
        onRetry={onRetry}
      />
    );

    await user.click(screen.getByRole('button', { name: /try again/i }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('should show home link by default', () => {
    render(
      <ErrorDisplay
        title="Test Error"
        message="Test message"
      />
    );

    expect(screen.getByRole('link', { name: /go home/i })).toBeInTheDocument();
  });

  it('should hide home link when showHomeLink is false', () => {
    render(
      <ErrorDisplay
        title="Test Error"
        message="Test message"
        showHomeLink={false}
      />
    );

    expect(screen.queryByRole('link', { name: /go home/i })).not.toBeInTheDocument();
  });

  it('should show details in development', () => {
    vi.stubEnv('NODE_ENV', 'development');

    render(
      <ErrorDisplay
        title="Test Error"
        message="Test message"
        details="Stack trace here"
      />
    );

    expect(screen.getByText(/error details/i)).toBeInTheDocument();

    vi.unstubAllEnvs();
  });
});
