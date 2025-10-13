'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
  level?: 'page' | 'section' | 'component';
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('[ErrorBoundary] Caught error:', error.message);
      console.error('[ErrorBoundary] Stack:', error.stack);
      console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);
      console.error('[ErrorBoundary] Error level:', this.props.level || 'component');
    }

    // Auto-recover after 5 seconds in development
    if (process.env.NODE_ENV === 'development' && this.props.level !== 'page') {
      setTimeout(() => {
        console.log('[ErrorBoundary] Auto-recovering from error...');
        this.handleRetry();
      }, 5000);
    }

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In production, you might want to send this to an error reporting service
    // Example: logErrorToService(error, errorInfo, this.state.errorId);
  }

  handleRetry = () => {
    console.log('[ErrorBoundary] Attempting to recover from error...');
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    });
    // Force re-render of children
    this.forceUpdate();
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  getErrorLevel() {
    return this.props.level || 'component';
  }

  renderFallback() {
    if (this.props.fallback) {
      return this.props.fallback;
    }

    const level = this.getErrorLevel();
    const { error, errorInfo, errorId } = this.state;
    const { showDetails = false } = this.props;

    // Component-level error (minimal UI)
    if (level === 'component') {
      return (
        <div className="flex items-center justify-center p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm">Unable to load this content</span>
            <Button
              size="sm"
              variant="outline"
              onClick={this.handleRetry}
              className="ml-2 h-7 px-2 text-xs"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          </div>
        </div>
      );
    }

    // Section-level error (medium UI)
    if (level === 'section') {
      return (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-700 mb-2">
              Section Unavailable
            </h3>
            <p className="text-red-600 mb-4">
              This section couldn&apos;t be loaded. Please try refreshing or come back later.
            </p>
            <div className="flex justify-center gap-2">
              <Button
                onClick={this.handleRetry}
                variant="outline"
                size="sm"
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    // Page-level error (full UI)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-lg w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
            <CardTitle className="text-xl text-red-700">
              Oops! Something went wrong
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-6">
              We&apos;re sorry, but something unexpected happened. Our team has been notified.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
              <Button
                onClick={this.handleRetry}
                className="bg-[var(--primary-orange)] hover:bg-[var(--primary-dark)]"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button
                onClick={this.handleGoHome}
                variant="outline"
              >
                <Home className="h-4 w-4 mr-2" />
                Go Home
              </Button>
              <Button
                onClick={this.handleReload}
                variant="ghost"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reload Page
              </Button>
            </div>

            {showDetails && error && (
              <details className="text-left bg-gray-100 rounded-lg p-4">
                <summary className="cursor-pointer text-sm font-medium mb-2 flex items-center gap-2">
                  <Bug className="h-4 w-4" />
                  Technical Details
                </summary>
                <div className="text-xs text-gray-700 space-y-2">
                  <div>
                    <strong>Error ID:</strong> {errorId}
                  </div>
                  <div>
                    <strong>Error:</strong> {error.message}
                  </div>
                  {errorInfo && (
                    <div>
                      <strong>Stack:</strong>
                      <pre className="whitespace-pre-wrap text-xs bg-white p-2 rounded mt-1 overflow-auto max-h-32">
                        {errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            <p className="text-xs text-gray-500 mt-4">
              Error ID: {errorId}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  componentDidUpdate(prevProps: Props) {
    // Clear error state if children prop changes (indicating a route change)
    if (prevProps.children !== this.props.children && this.state.hasError) {
      console.log('[ErrorBoundary] Children changed, clearing error state...');
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: ''
      });
    }
  }

  render() {
    if (this.state.hasError) {
      // Add timestamp to error display to help debugging
      console.log(`[ErrorBoundary] Rendering error UI at ${new Date().toISOString()}`);
      return this.renderFallback();
    }

    return this.props.children;
  }
}

export default ErrorBoundary;