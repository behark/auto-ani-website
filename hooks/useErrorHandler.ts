'use client';

import { useCallback, useState } from 'react';

interface UseErrorHandlerOptions {
  onError?: (error: Error) => void;
  fallbackMessage?: string;
}

interface ErrorState {
  error: Error | null;
  isError: boolean;
  errorMessage: string;
}

export function useErrorHandler(options: UseErrorHandlerOptions = {}) {
  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    isError: false,
    errorMessage: ''
  });

  const handleError = useCallback((error: Error | unknown) => {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    const errorMessage = errorObj.message || options.fallbackMessage || 'An unexpected error occurred';

    setErrorState({
      error: errorObj,
      isError: true,
      errorMessage
    });

    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by useErrorHandler:', errorObj);
    }

    // Call custom error handler
    options.onError?.(errorObj);
  }, [options]);

  const clearError = useCallback(() => {
    setErrorState({
      error: null,
      isError: false,
      errorMessage: ''
    });
  }, []);

  const wrapAsync = useCallback(<T extends any[], R>(
    asyncFn: (...args: T) => Promise<R>
  ) => {
    return async (...args: T): Promise<R | undefined> => {
      try {
        clearError();
        return await asyncFn(...args);
      } catch (error) {
        handleError(error);
        return undefined;
      }
    };
  }, [handleError, clearError]);

  const wrapSync = useCallback(<T extends any[], R>(
    syncFn: (...args: T) => R
  ) => {
    return (...args: T): R | undefined => {
      try {
        clearError();
        return syncFn(...args);
      } catch (error) {
        handleError(error);
        return undefined;
      }
    };
  }, [handleError, clearError]);

  return {
    ...errorState,
    handleError,
    clearError,
    wrapAsync,
    wrapSync
  };
}