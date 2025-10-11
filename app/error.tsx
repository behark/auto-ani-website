'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log the error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Global error boundary caught:', error);
    }

    // In production, you would send this to an error reporting service
    // Example: logErrorToService(error);
  }, [error]);

  const errorId = `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
          <CardTitle className="text-xl text-red-700">
            Something went wrong!
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-gray-600 mb-6">
            We&apos;re sorry, but something unexpected happened. Our team has been notified.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
            <Button
              onClick={reset}
              className="bg-[var(--primary-orange)] hover:bg-[var(--primary-dark)]"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button
              onClick={() => window.location.href = '/'}
              variant="outline"
            >
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Button>
            <Button
              onClick={() => window.location.reload()}
              variant="ghost"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reload Page
            </Button>
          </div>

          {process.env.NODE_ENV === 'development' && (
            <details className="text-left bg-gray-100 rounded-lg p-4 mb-4">
              <summary className="cursor-pointer text-sm font-medium mb-2 flex items-center gap-2">
                <Bug className="h-4 w-4" />
                Technical Details (Development Only)
              </summary>
              <div className="text-xs text-gray-700 space-y-2">
                <div>
                  <strong>Error ID:</strong> {errorId}
                </div>
                <div>
                  <strong>Message:</strong> {error.message}
                </div>
                {error.digest && (
                  <div>
                    <strong>Digest:</strong> {error.digest}
                  </div>
                )}
                <div>
                  <strong>Stack:</strong>
                  <pre className="whitespace-pre-wrap text-xs bg-white p-2 rounded mt-1 overflow-auto max-h-32">
                    {error.stack}
                  </pre>
                </div>
              </div>
            </details>
          )}

          <p className="text-xs text-gray-500">
            Error ID: {errorId}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}