import { Heart, Mail } from 'lucide-react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import SignOutButton from '@/components/auth/SignOutButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'My Account | AUTO ANI',
};

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login?callbackUrl=/account');
  }

  const user = session.user;

  return (
    <div className="min-h-[70vh] bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <h1 className="text-3xl font-bold mb-6">My Account</h1>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              {user.image ? (
                <Image
                  src={user.image}
                  alt={user.name || 'Account'}
                  width={64}
                  height={64}
                  className="rounded-full"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-[var(--primary-orange)] text-white flex items-center justify-center text-2xl font-semibold">
                  {(user.name || user.email || '?').charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-lg font-semibold text-gray-900">{user.name}</p>
                <p className="text-gray-500 flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  {user.email}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <SignOutButton />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <Heart className="w-5 h-5 text-[var(--primary-orange)] mt-1" />
              <div>
                <p className="font-semibold text-gray-900">Your favorites</p>
                <p className="text-sm text-gray-600">
                  Browse vehicles and tap the heart to save them.{' '}
                  <Link href="/vehicles" className="text-[var(--primary-orange)] underline">
                    View inventory
                  </Link>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
