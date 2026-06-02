'use client';

import { SessionProvider } from 'next-auth/react';

/**
 * Client wrapper so the app tree can use `useSession()` (navbar avatar,
 * form autofill, etc.). Auth.js v5 `SessionProvider` fetches the session
 * lazily from /api/auth/session.
 */
export default function SessionProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SessionProvider>{children}</SessionProvider>;
}
