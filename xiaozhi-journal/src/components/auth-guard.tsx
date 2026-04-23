'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import * as Sentry from '@sentry/nextjs';
import { useAppStore, initializeAuth } from '@/store';

interface AuthGuardProps {
  children: React.ReactNode;
  /** If true, redirect TO /auth/login when NOT authenticated (default).
   *  If false, redirect TO / when already authenticated. */
  requireAuth?: boolean;
}

export function AuthGuard({ children, requireAuth = true }: AuthGuardProps) {
  const user = useAppStore((s) => s.user);
  const authLoading = useAppStore((s) => s.authLoading);
  const router = useRouter();

  useEffect(() => {
    initializeAuth();
  }, [requireAuth]);

  // Sentry user context sync
  useEffect(() => {
    if (user) {
      Sentry.setUser({ id: user.id, email: user.email ?? undefined });
    } else {
      Sentry.setUser(null);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;

    if (requireAuth && !user) {
      router.replace('/auth/login');
    } else if (!requireAuth && user) {
      router.replace('/');
    }
  }, [user, authLoading, requireAuth, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#FDF8F5] flex items-center justify-center">
        <div className="text-muted-foreground animate-pulse">加载中...</div>
      </div>
    );
  }

  if (requireAuth && !user) return null;
  if (!requireAuth && user) return null;

  return <>{children}</>;
}
