'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '../../store/useAuthStore.js';
import { Loader2 } from 'lucide-react';

const PUBLIC_ROUTES = ['/login', '/register', '/'];

export default function AuthGuard({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isLoading) {
      const isPublic = PUBLIC_ROUTES.includes(pathname);

      if (!isAuthenticated && !isPublic) {
        router.push('/login');
      } else if (isAuthenticated && (pathname === '/login' || pathname === '/register' || pathname === '/')) {
        router.push('/chat');
      }
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
        <p className="text-slate-400 text-sm font-medium">Authenticating session...</p>
      </div>
    );
  }

  return children;
}
