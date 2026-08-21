'use client';

import AuthGuard from '../auth/AuthGuard';

export default function ClientProvider({ children }) {
  return <AuthGuard>{children}</AuthGuard>;
}
