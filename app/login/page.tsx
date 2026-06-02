import { Car } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import LoginButtons from '@/components/auth/LoginButtons';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { hasFacebookAuth, hasGoogleAuth } from '@/lib/env';

export const metadata: Metadata = {
  title: 'Log in | AUTO ANI',
  description: 'Log in to AUTO ANI to save your favorite vehicles and speed up inquiries.',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  // Already signed in → send to account.
  const session = await auth();
  if (session?.user) redirect('/account');

  const { callbackUrl } = await searchParams;

  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-gray-50 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto w-12 h-12 bg-[var(--primary-orange)] rounded-full flex items-center justify-center">
            <Car className="w-7 h-7 text-white" />
          </div>
          <CardTitle className="text-2xl">Log in to AUTO ANI</CardTitle>
          <p className="text-sm text-gray-600">
            Save favorites and pre-fill your details on inquiries.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <LoginButtons
            googleEnabled={hasGoogleAuth}
            facebookEnabled={hasFacebookAuth}
            callbackUrl={callbackUrl || '/account'}
          />

          <p className="text-xs text-gray-500 text-center">
            By continuing you agree to our{' '}
            <Link href="/privacy" className="underline hover:text-[var(--primary-orange)]">
              Privacy Policy
            </Link>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
