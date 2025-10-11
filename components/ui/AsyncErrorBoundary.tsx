'use client';

import { useEffect, useState, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface AsyncErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, retry: () => void) => ReactNode;
  onError?: (error: Error) => void;
}

export default function AsyncErrorBoundary({
  children,
  fallback,
  onError
}: AsyncErrorBoundaryProps) {
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = new Error(event.reason?.message || 'Unhandled promise rejection');
      setError(error);
      onError?.(error);
    };

    const handleError = (event: ErrorEvent) => {
      const error = new Error(event.message || 'Runtime error');
      setError(error);
      onError?.(error);
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, [onError]);

  const retry = () => {
    setError(null);
  };

  if (error) {
    if (fallback) {
      return fallback(error, retry);
    }

    return (
      <div className="flex flex-col items-center justify-center p-8 bg-red-50 border border-red-200 rounded-lg">
        <AlertTriangle className="h-8 w-8 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold text-red-700 mb-2">
          Something went wrong
        </h3>
        <p className="text-red-600 mb-4 text-center">
          {error.message || 'An unexpected error occurred'}
        </p>
        <Button
          onClick={retry}
          variant="outline"
          className="border-red-300 text-red-700 hover:bg-red-100"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}