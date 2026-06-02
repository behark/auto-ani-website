'use client';

import { LogOut, User as UserIcon } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';

/**
 * Navbar auth control.
 * - Logged out: "Log in" link.
 * - Logged in: avatar button + dropdown (Account, Log out).
 *
 * `variant="mobile"` renders a stacked layout for the mobile menu.
 */
export default function AccountMenu({ variant = 'desktop' }: { variant?: 'desktop' | 'mobile' }) {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);

  // Avoid layout shift while the session loads.
  if (status === 'loading') {
    return <div className="h-9 w-9" aria-hidden="true" />;
  }

  const user = session?.user;

  if (!user) {
    if (variant === 'mobile') {
      return (
        <Link
          href="/login"
          className="flex items-center space-x-2 text-[var(--primary-orange)] hover:text-orange-600 font-medium"
        >
          <UserIcon className="w-4 h-4" />
          <span>Log in</span>
        </Link>
      );
    }
    return (
      <Link href="/login">
        <Button variant="outline" size="sm" className="gap-2">
          <UserIcon className="w-4 h-4" />
          Log in
        </Button>
      </Link>
    );
  }

  const avatar = user.image ? (
    <Image
      src={user.image}
      alt={user.name || 'Account'}
      width={32}
      height={32}
      className="rounded-full"
    />
  ) : (
    <div className="w-8 h-8 rounded-full bg-[var(--primary-orange)] text-white flex items-center justify-center text-sm font-semibold">
      {(user.name || user.email || '?').charAt(0).toUpperCase()}
    </div>
  );

  if (variant === 'mobile') {
    return (
      <div className="space-y-2">
        <Link href="/account" className="flex items-center gap-3">
          {avatar}
          <span className="font-medium text-gray-900">{user.name || user.email}</span>
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="flex items-center gap-2 text-gray-700 hover:text-[var(--primary-orange)]"
        >
          <LogOut className="w-4 h-4" />
          <span>Log out</span>
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center rounded-full focus:outline-none focus:ring-2 focus:ring-[var(--primary-orange)]"
        aria-label="Account menu"
        aria-expanded={open}
      >
        {avatar}
      </button>

      {open && (
        <>
          {/* Click-away backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-md shadow-lg z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
            <Link
              href="/account"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <UserIcon className="w-4 h-4" />
              My Account
            </Link>
            <button
              onClick={() => {
                setOpen(false);
                signOut({ callbackUrl: '/' });
              }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <LogOut className="w-4 h-4" />
              Log out
            </button>
          </div>
        </>
      )}
    </div>
  );
}
