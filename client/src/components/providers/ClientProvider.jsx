'use client';

import AuthGuard from '../auth/AuthGuard';
import { ToastProvider } from '../common/ToastContext';

export default function ClientProvider({ children }) {
  return (
    <ToastProvider>
      <AuthGuard>{children}</AuthGuard>
    </ToastProvider>
  );
}
