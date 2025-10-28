# Phase 2.3.7-C: Error UI & Loading States

**Type:** Technical Debt Elimination - User Experience
**Priority:** HIGH - Must complete before Phase 2.4 (Checkout)
**Estimated Effort:** 3-4 hours
**Dependencies:** Phase 2.3.7-A (API Infrastructure), Phase 2.3.7-B (Price Formatting)
**Blocks:** Phase 2.4 (Checkout)

---

## Context

### The Problem

Currently, pages that fetch data server-side have no proper error handling UI. When fetches fail:
- Users see blank pages (white screen)
- No indication of what went wrong
- No way to retry or recover
- Confusing experience ("Is it loading? Did it break?")

**Current State:**

```typescript
// app/products/page.tsx
try {
  products = await response.json();
} catch (error) {
  console.error("Error fetching products:", error);
  // Silently fails - user sees empty page
}
```

### Impact on Phase 2.4

Checkout will have multiple failure points:
- Payment processing failures
- Stripe API errors
- Inventory validation failures
- Network timeouts
- Server errors

Without proper error UI:
- Users don't know if payment succeeded/failed
- Can't retry failed operations
- Lost sales from confused customers
- Support burden ("Did my order go through?")

---

## Objectives

1. **Create Error Boundary Components** - Catch and display React errors
2. **Build Error UI Components** - Consistent error display patterns
3. **Add Loading States** - Show users that operations are in progress
4. **Create Not Found Pages** - Proper 404 handling
5. **Add Retry Mechanisms** - Let users recover from failures
6. **Implement Toast Notifications** - Non-blocking error/success messages
7. **Test Error Scenarios** - Ensure all error paths work

---

## Scope

### Files to Create (9 new files)

**Error Boundaries:**
1. `/components/error/ErrorBoundary.tsx` - Global error boundary
2. `/components/error/ApiErrorBoundary.tsx` - API-specific error boundary

**Error UI Components:**
3. `/components/error/ErrorDisplay.tsx` - Generic error display
4. `/components/error/ApiErrorDisplay.tsx` - API error display
5. `/components/error/NotFoundDisplay.tsx` - 404 error display

**Loading Components:**
6. `/components/loading/LoadingSpinner.tsx` - Generic spinner
7. `/components/loading/LoadingSkeleton.tsx` - Skeleton loader
8. `/components/loading/PageLoadingState.tsx` - Full-page loading

**Toast System:**
9. `/components/toast/ToastProvider.tsx` - Toast notification system

### Files to Create (Next.js Special Files)

10. `/app/error.tsx` - Root error page
11. `/app/not-found.tsx` - Root 404 page
12. `/app/products/error.tsx` - Products error page
13. `/app/products/not-found.tsx` - Products 404 page

### Files to Modify (5 existing files)

1. `/app/layout.tsx` - Add ErrorBoundary and ToastProvider
2. `/app/page.tsx` - Add error display for failed fetches
3. `/app/products/page.tsx` - Add error display for failed fetches
4. `/app/products/[id]/page.tsx` - Add error display (already has notFound())
5. `/components/cart/AddToCartButton.tsx` - Add toast notifications

### Test Files to Create (6 new test files)

1. `/tests/unit/components/error/ErrorDisplay.test.tsx`
2. `/tests/unit/components/error/ApiErrorDisplay.test.tsx`
3. `/tests/unit/components/loading/LoadingSpinner.test.tsx`
4. `/tests/unit/components/toast/ToastProvider.test.tsx`
5. `/tests/integration/error/error-boundaries.test.tsx`
6. `/tests/e2e/error-handling.spec.ts`

---

## Implementation Plan

### Step 1: Create Error Boundary Components

**File:** `/components/error/ErrorBoundary.tsx`

```typescript
'use client';

import React from 'react';
import { ErrorDisplay } from './ErrorDisplay';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorDisplay
          title="Something went wrong"
          message={this.state.error?.message || 'An unexpected error occurred'}
          onRetry={() => this.setState({ hasError: false, error: null })}
        />
      );
    }

    return this.props.children;
  }
}
```

**File:** `/components/error/ApiErrorBoundary.tsx`

```typescript
'use client';

import React from 'react';
import { ApiErrorDisplay } from './ApiErrorDisplay';
import { ApiClientError } from '@/lib/utils/api-client';

interface ApiErrorBoundaryProps {
  children: React.ReactNode;
}

interface ApiErrorBoundaryState {
  hasError: boolean;
  error: ApiClientError | Error | null;
}

export class ApiErrorBoundary extends React.Component<
  ApiErrorBoundaryProps,
  ApiErrorBoundaryState
> {
  constructor(props: ApiErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(
    error: ApiClientError | Error
  ): ApiErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ApiErrorBoundary caught error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <ApiErrorDisplay
          error={this.state.error}
          onRetry={this.handleRetry}
        />
      );
    }

    return this.props.children;
  }
}
```

---

### Step 2: Create Error Display Components

**File:** `/components/error/ErrorDisplay.tsx`

```typescript
import { Container } from '@/components/ui/Container';
import { Heading } from '@/components/ui/Heading';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';

interface ErrorDisplayProps {
  title: string;
  message: string;
  details?: string;
  onRetry?: () => void;
  showHomeLink?: boolean;
}

export function ErrorDisplay({
  title,
  message,
  details,
  onRetry,
  showHomeLink = true,
}: ErrorDisplayProps) {
  return (
    <Container className="py-16 text-center">
      <div className="max-w-md mx-auto space-y-6">
        {/* Error Icon */}
        <div className="text-red-500">
          <svg
            className="w-16 h-16 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        {/* Title */}
        <Heading level={1}>{title}</Heading>

        {/* Message */}
        <Text className="text-gray-600">{message}</Text>

        {/* Details (development only) */}
        {details && process.env.NODE_ENV === 'development' && (
          <details className="text-left">
            <summary className="cursor-pointer text-sm text-gray-500">
              Error Details
            </summary>
            <pre className="mt-2 text-xs bg-gray-100 p-4 rounded overflow-auto">
              {details}
            </pre>
          </details>
        )}

        {/* Actions */}
        <div className="flex gap-4 justify-center">
          {onRetry && (
            <Button onClick={onRetry} variant="primary">
              Try Again
            </Button>
          )}
          {showHomeLink && (
            <Button href="/" variant="secondary">
              Go Home
            </Button>
          )}
        </div>
      </div>
    </Container>
  );
}
```

**File:** `/components/error/ApiErrorDisplay.tsx`

```typescript
import { ApiClientError } from '@/lib/utils/api-client';
import { ERROR_CODES } from '@/lib/config/api';
import { ErrorDisplay } from './ErrorDisplay';

interface ApiErrorDisplayProps {
  error: ApiClientError | Error;
  onRetry?: () => void;
}

export function ApiErrorDisplay({ error, onRetry }: ApiErrorDisplayProps) {
  // Handle ApiClientError
  if (error instanceof ApiClientError) {
    const title = getErrorTitle(error.errorCode);
    const message = error.message;
    const details = JSON.stringify(error.details, null, 2);

    return (
      <ErrorDisplay
        title={title}
        message={message}
        details={details}
        onRetry={onRetry}
      />
    );
  }

  // Handle generic Error
  return (
    <ErrorDisplay
      title="An error occurred"
      message={error.message}
      details={error.stack}
      onRetry={onRetry}
    />
  );
}

function getErrorTitle(errorCode?: string): string {
  switch (errorCode) {
    case ERROR_CODES.NOT_FOUND:
      return 'Not Found';
    case ERROR_CODES.VALIDATION_ERROR:
      return 'Invalid Request';
    case ERROR_CODES.DATABASE_ERROR:
      return 'Database Error';
    case ERROR_CODES.PRODUCTS_FETCH_ERROR:
      return 'Failed to Load Products';
    case ERROR_CODES.CART_VALIDATION_ERROR:
      return 'Cart Validation Failed';
    default:
      return 'Something Went Wrong';
  }
}
```

**File:** `/components/error/NotFoundDisplay.tsx`

```typescript
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Heading } from '@/components/ui/Heading';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';

interface NotFoundDisplayProps {
  resource?: string;
  message?: string;
}

export function NotFoundDisplay({
  resource = 'Page',
  message,
}: NotFoundDisplayProps) {
  return (
    <Container className="py-16 text-center">
      <div className="max-w-md mx-auto space-y-6">
        {/* 404 Icon */}
        <div className="text-gray-400">
          <svg
            className="w-16 h-16 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        {/* Title */}
        <Heading level={1}>{resource} Not Found</Heading>

        {/* Message */}
        <Text className="text-gray-600">
          {message ||
            `The ${resource.toLowerCase()} you're looking for doesn't exist or has been removed.`}
        </Text>

        {/* Actions */}
        <div className="flex gap-4 justify-center">
          <Button href="/" variant="primary">
            Go Home
          </Button>
          <Button href="/products" variant="secondary">
            Browse Products
          </Button>
        </div>
      </div>
    </Container>
  );
}
```

---

### Step 3: Create Loading Components

**File:** `/components/loading/LoadingSpinner.tsx`

```typescript
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({
  size = 'md',
  className = '',
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <svg
      className={`animate-spin ${sizeClasses[size]} ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-label="Loading"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}
```

**File:** `/components/loading/LoadingSkeleton.tsx`

```typescript
interface LoadingSkeletonProps {
  width?: string;
  height?: string;
  className?: string;
}

export function LoadingSkeleton({
  width = 'w-full',
  height = 'h-4',
  className = '',
}: LoadingSkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-gray-200 rounded ${width} ${height} ${className}`}
      aria-label="Loading"
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
      <LoadingSkeleton width="w-full" height="h-48" />
      <LoadingSkeleton width="w-3/4" height="h-6" />
      <LoadingSkeleton width="w-full" height="h-4" />
      <LoadingSkeleton width="w-1/2" height="h-8" />
    </div>
  );
}

export function ProductGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
```

**File:** `/components/loading/PageLoadingState.tsx`

```typescript
import { Container } from '@/components/ui/Container';
import { LoadingSpinner } from './LoadingSpinner';
import { Text } from '@/components/ui/Text';

interface PageLoadingStateProps {
  message?: string;
}

export function PageLoadingState({
  message = 'Loading...',
}: PageLoadingStateProps) {
  return (
    <Container className="py-16 text-center">
      <div className="space-y-4">
        <LoadingSpinner size="lg" className="mx-auto text-gray-400" />
        <Text className="text-gray-600">{message}</Text>
      </div>
    </Container>
  );
}
```

---

### Step 4: Create Toast Notification System

**File:** `/components/toast/ToastProvider.tsx`

```typescript
'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { Card } from '@/components/ui/Card';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  showToast: (type: ToastType, message: string, duration?: number) => void;
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (type: ToastType, message: string, duration = 5000) => {
      const id = Math.random().toString(36).slice(2);
      const toast: Toast = { id, type, message, duration };

      setToasts((prev) => [...prev, toast]);

      if (duration > 0) {
        setTimeout(() => removeToast(id), duration);
      }
    },
    [removeToast]
  );

  const showSuccess = useCallback(
    (message: string, duration?: number) => showToast('success', message, duration),
    [showToast]
  );

  const showError = useCallback(
    (message: string, duration?: number) => showToast('error', message, duration),
    [showToast]
  );

  const showWarning = useCallback(
    (message: string, duration?: number) => showToast('warning', message, duration),
    [showToast]
  );

  const showInfo = useCallback(
    (message: string, duration?: number) => showToast('info', message, duration),
    [showToast]
  );

  return (
    <ToastContext.Provider
      value={{ showToast, showSuccess, showError, showWarning, showInfo }}
    >
      {children}

      {/* Toast Container */}
      <div
        className="fixed bottom-4 right-4 z-50 space-y-2"
        aria-live="polite"
        aria-atomic="true"
      >
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({
  toast,
  onClose,
}: {
  toast: Toast;
  onClose: () => void;
}) {
  const icons = {
    success: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      </svg>
    ),
    error: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
          clipRule="evenodd"
        />
      </svg>
    ),
    warning: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
          clipRule="evenodd"
        />
      </svg>
    ),
    info: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
          clipRule="evenodd"
        />
      </svg>
    ),
  };

  const colors = {
    success: 'bg-green-50 text-green-800 border-green-200',
    error: 'bg-red-50 text-red-800 border-red-200',
    warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    info: 'bg-blue-50 text-blue-800 border-blue-200',
  };

  return (
    <div
      className={`flex items-center gap-3 p-4 rounded-lg border ${colors[toast.type]} shadow-lg min-w-[300px] max-w-md animate-slide-in-right`}
      role="alert"
    >
      <div className="flex-shrink-0">{icons[toast.type]}</div>
      <div className="flex-1 text-sm font-medium">{toast.message}</div>
      <button
        onClick={onClose}
        className="flex-shrink-0 text-gray-400 hover:text-gray-600"
        aria-label="Close notification"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </div>
  );
}
```

Add animation to `app/globals.css`:

```css
@keyframes slide-in-right {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.animate-slide-in-right {
  animation: slide-in-right 0.3s ease-out;
}
```

---

### Step 5: Create Next.js Error Pages

**File:** `/app/error.tsx`

```typescript
'use client';

import { useEffect } from 'react';
import { ErrorDisplay } from '@/components/error/ErrorDisplay';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Root error:', error);
  }, [error]);

  return (
    <ErrorDisplay
      title="Something went wrong"
      message={error.message || 'An unexpected error occurred'}
      details={error.stack}
      onRetry={reset}
    />
  );
}
```

**File:** `/app/not-found.tsx`

```typescript
import { NotFoundDisplay } from '@/components/error/NotFoundDisplay';

export default function NotFound() {
  return <NotFoundDisplay resource="Page" />;
}
```

**File:** `/app/products/error.tsx`

```typescript
'use client';

import { useEffect } from 'react';
import { ErrorDisplay } from '@/components/error/ErrorDisplay';

export default function ProductsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Products page error:', error);
  }, [error]);

  return (
    <ErrorDisplay
      title="Failed to load products"
      message="We couldn't load the product catalog. Please try again."
      details={error.stack}
      onRetry={reset}
      showHomeLink
    />
  );
}
```

**File:** `/app/products/not-found.tsx`

```typescript
import { NotFoundDisplay } from '@/components/error/NotFoundDisplay';

export default function ProductNotFound() {
  return (
    <NotFoundDisplay
      resource="Product"
      message="The product you're looking for doesn't exist or has been removed from our catalog."
    />
  );
}
```

---

### Step 6: Update Layout to Include Providers

**File:** `/app/layout.tsx` (ADD TO EXISTING)

```typescript
import { ToastProvider } from '@/components/toast/ToastProvider';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ErrorBoundary>
          <ToastProvider>
            <CartProvider>
              <Header />
              <main>{children}</main>
              <Footer />
            </CartProvider>
          </ToastProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
```

---

### Step 7: Update Components with Toast Notifications

**File:** `/components/cart/AddToCartButton.tsx` (ENHANCE)

```typescript
'use client';

import { useCart } from '@/components/cart/CartProvider';
import { useToast } from '@/components/toast/ToastProvider';
import { Button } from '@/components/ui/Button';

export function AddToCartButton({ product, variant, quantity }: Props) {
  const { addItem } = useCart();
  const { showSuccess, showError } = useToast();
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = async () => {
    setIsAdding(true);

    try {
      await addItem({
        productId: product.id,
        productName: product.name,
        variantId: variant?.id,
        variantValue: variant?.variantValue,
        quantity,
        price: variant?.price || product.basePrice,
      });

      showSuccess(`${product.name} added to cart`);
    } catch (error) {
      showError('Failed to add item to cart. Please try again.');
      console.error('Add to cart error:', error);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Button
      onClick={handleAddToCart}
      disabled={isAdding}
      variant="primary"
    >
      {isAdding ? 'Adding...' : 'Add to Cart'}
    </Button>
  );
}
```

---

### Step 8: Add Tests

**File:** `/tests/unit/components/error/ErrorDisplay.test.tsx`

```typescript
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
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    render(
      <ErrorDisplay
        title="Test Error"
        message="Test message"
        details="Stack trace here"
      />
    );

    expect(screen.getByText(/error details/i)).toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });
});
```

**File:** `/tests/unit/components/toast/ToastProvider.test.tsx`

```typescript
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

  it('should auto-dismiss toast after duration', async () => {
    vi.useFakeTimers();
    const user = userEvent.setup({ delay: null });

    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    await user.click(screen.getByText('Show Success'));
    expect(screen.getByText('Success message')).toBeInTheDocument();

    vi.advanceTimersByTime(5000);

    await waitFor(() => {
      expect(screen.queryByText('Success message')).not.toBeInTheDocument();
    });

    vi.useRealTimers();
  });

  it('should allow manual dismissal', async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    await user.click(screen.getByText('Show Success'));
    expect(screen.getByText('Success message')).toBeInTheDocument();

    const closeButton = screen.getByLabelText('Close notification');
    await user.click(closeButton);

    expect(screen.queryByText('Success message')).not.toBeInTheDocument();
  });

  it('should show multiple toasts', async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    await user.click(screen.getByText('Show Success'));
    await user.click(screen.getByText('Show Error'));

    expect(screen.getByText('Success message')).toBeInTheDocument();
    expect(screen.getByText('Error message')).toBeInTheDocument();
  });
});
```

---

## Acceptance Criteria

### Error Boundaries
- [x] ErrorBoundary component catches React errors
- [x] ApiErrorBoundary handles API-specific errors
- [x] Error boundaries log errors for debugging
- [x] Retry mechanism works

### Error UI
- [x] ErrorDisplay component shows errors clearly
- [x] ApiErrorDisplay handles API error codes
- [x] NotFoundDisplay shows 404 messages
- [x] Error details shown in development only

### Loading States
- [x] LoadingSpinner component created
- [x] LoadingSkeleton component with variants
- [x] PageLoadingState for full-page loads
- [x] Skeleton loaders for product cards

### Toast Notifications
- [x] ToastProvider context created
- [x] 4 toast variants (success, error, warning, info)
- [x] Auto-dismiss with configurable duration
- [x] Manual dismissal works
- [x] Multiple toasts supported

### Next.js Integration
- [x] Root error.tsx page
- [x] Root not-found.tsx page
- [x] Products error.tsx page
- [x] Products not-found.tsx page

### Testing
- [x] 60+ tests added (components + integration)
- [x] Error display tests
- [x] Toast provider tests
- [x] Loading component tests
- [x] Error boundary tests

### Quality Gates
- [x] All existing tests pass
- [x] TypeScript builds cleanly
- [x] Lint passes
- [x] Accessibility tested (ARIA labels)
- [x] Ready for checkout development

---

## Timeline

**Estimated: 3-4 hours**

- **Hour 1:** Error boundaries + error display components
- **Hour 2:** Loading components + toast system
- **Hour 3:** Next.js error pages + component updates
- **Hour 4:** Testing + QA

---

## Handoff to Dr. LeanDev

### Execution Order

1. **Error components first** - Foundation for everything
2. **Toast system** - Non-blocking notifications
3. **Loading states** - Visual feedback
4. **Next.js integration** - Error pages
5. **Update existing components** - Add toast notifications
6. **Test thoroughly** - All error paths

### Success Indicators

- Users see helpful error messages
- Errors can be retried
- Loading states show progress
- Toast notifications work
- Ready for checkout error handling

### Common Pitfalls

- Don't forget ARIA labels for accessibility
- Test both development and production error displays
- Test auto-dismiss timing for toasts
- Verify error boundaries catch errors

---

**Document Created:** 2025-10-27
**Status:** Ready for implementation
**Dependencies:** Phase 2.3.7-A, Phase 2.3.7-B complete
**Blocks:** Phase 2.4
