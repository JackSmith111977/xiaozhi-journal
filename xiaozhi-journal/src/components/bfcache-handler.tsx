'use client';

import { useEffect } from 'react';

/**
 * Detect bfcache recovery and force full reload to reset Supabase client
 * and all Zustand stores to clean state.
 */
export function BfcacheHandler() {
  useEffect(() => {
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        location.reload();
      }
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, []);

  return null;
}
