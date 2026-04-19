'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';

interface AuthGuardProps {
  children: React.ReactNode;
  /** If true, redirect TO /auth/login when NOT authenticated (default).
   *  If false, redirect TO / when already authenticated. */
  requireAuth?: boolean;
}

export function AuthGuard({ children, requireAuth = true }: AuthGuardProps) {
  const { user, loading, initialize } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (loading) return;

    if (requireAuth && !user) {
      router.replace('/auth/login');
    } else if (!requireAuth && user) {
      router.replace('/');
    }
  }, [user, loading, requireAuth, router]);

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDF8F5] flex items-center justify-center">
        <div className="text-[#8A817C] animate-pulse">加载中...</div>
      </div>
    );
  }

  // Don't render children if auth condition isn't met
  if (requireAuth && !user) return null;
  if (!requireAuth && user) return null;

  return <>{children}</>;
}
