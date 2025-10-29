'use client';

import React from 'react';
import { ApiErrorDisplay } from './ApiErrorDisplay';
import { ApiClientError } from '@/lib/utils/api-client';
import { logger } from '@/lib/utils/logger';

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
    logger.error('ApiErrorBoundary caught error', error, { componentStack: errorInfo.componentStack });
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
