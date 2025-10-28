import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider, useToast } from '@/components/toast/ToastProvider';

function TestComponent() {
  const { showSuccess, showError, showWarning, showInfo } = useToast();

  return (
    <div>
      <button onClick={() => showSuccess('Success message')}>Show Success</button>
      <button onClick={() => showError('Error message')}>Show Error</button>
      <button onClick={() => showWarning('Warning message')}>Show Warning</button>
      <button onClick={() => showInfo('Info message')}>Show Info</button>
    </div>
  );
}

describe('ToastProvider', () => {
  it('should show success toast', async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    await user.click(screen.getByText('Show Success'));
    expect(screen.getByText('Success message')).toBeInTheDocument();
  });

  it('should show error toast', async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    await user.click(screen.getByText('Show Error'));
    expect(screen.getByText('Error message')).toBeInTheDocument();
  });

  it('should show warning toast', async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    await user.click(screen.getByText('Show Warning'));
    expect(screen.getByText('Warning message')).toBeInTheDocument();
  });

  it('should show info toast', async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    await user.click(screen.getByText('Show Info'));
    expect(screen.getByText('Info message')).toBeInTheDocument();
  });

  it.skip('should auto-dismiss toast after duration', async () => {
    vi.useFakeTimers();
    const user = userEvent.setup({ delay: null });

    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    await user.click(screen.getByText('Show Success'));
    expect(screen.getByText('Success message')).toBeInTheDocument();

    // Fast-forward time
    vi.advanceTimersByTime(5000);

    // Force a re-render by flushing promises
    await vi.runAllTimersAsync();

    expect(screen.queryByText('Success message')).not.toBeInTheDocument();

    vi.useRealTimers();
  }, 10000);

  it.skip('should allow manual dismissal', async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    await user.click(screen.getByText('Show Success'));

    await waitFor(() => {
      expect(screen.getByText('Success message')).toBeInTheDocument();
    });

    const closeButton = screen.getByLabelText('Close notification');
    await user.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText('Success message')).not.toBeInTheDocument();
    });
  }, 10000);

  it.skip('should show multiple toasts', async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    await user.click(screen.getByText('Show Success'));
    await user.click(screen.getByText('Show Error'));

    await waitFor(() => {
      expect(screen.getByText('Success message')).toBeInTheDocument();
      expect(screen.getByText('Error message')).toBeInTheDocument();
    });
  }, 10000);

  it('should throw error when useToast used outside provider', () => {
    // Suppress console.error for this test
    const originalError = console.error;
    console.error = vi.fn();

    function ComponentWithoutProvider() {
      try {
        const toast = useToast();
        return <div>{toast ? 'Has Toast' : 'No Toast'}</div>;
      } catch (error) {
        return <div>Error: {(error as Error).message}</div>;
      }
    }

    // The hook will throw during render, which React will catch
    // We need to check that the error was thrown by attempting to render
    let didThrow = false;
    let thrownError: Error | null = null;

    try {
      render(<ComponentWithoutProvider />);
    } catch (error) {
      didThrow = true;
      thrownError = error as Error;
    }

    // Since the component catches the error internally, we check the rendered output
    const { container } = render(<ComponentWithoutProvider />);
    expect(container.textContent).toContain('useToast must be used within ToastProvider');

    console.error = originalError;
  });
});
