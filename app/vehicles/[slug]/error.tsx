'use client';

import { AlertCircle, Home, ArrowLeft } from 'lucide-react';
import { useEffect } from 'react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Vehicle details error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 mb-4">
                <AlertCircle className="w-10 h-10 text-red-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Diçka shkoi keq
              </h1>
              <p className="text-gray-600 mb-4">
                Na vjen keq, por ndodhi një gabim gjatë ngarkimit të detajeve të veturës.
              </p>
              {error.message && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
                  <p className="text-sm text-red-800 font-mono">
                    {error.message}
                  </p>
                  {error.digest && (
                    <p className="text-xs text-red-600 mt-2">
                      Error ID: {error.digest}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={reset}
                className="inline-flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Provo Përsëri
              </Button>
              <Link href="/vehicles">
                <Button variant="outline" className="inline-flex items-center gap-2 w-full sm:w-auto">
                  <Home className="w-4 h-4" />
                  Kthehu te Veturat
                </Button>
              </Link>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Nëse problemi vazhdon, ju lutemi na kontaktoni në:
              </p>
              <div className="mt-2 space-y-1">
                <p className="text-sm">
                  <a href="tel:+38349204242" className="text-orange-600 hover:text-orange-700 font-medium">
                    +383 49 204 242
                  </a>
                </p>
                <p className="text-sm">
                  <a href="mailto:info@autosalonani.com" className="text-orange-600 hover:text-orange-700 font-medium">
                    info@autosalonani.com
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
