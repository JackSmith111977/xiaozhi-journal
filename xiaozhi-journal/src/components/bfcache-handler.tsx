'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/store';
import { supabase } from '@/lib/supabase/client';

/**
 * Handle bfcache restore — re-fetch data and re-establish subscriptions
 * instead of full page reload (which causes flash and loses draft content).
 */
export function BfcacheHandler() {
  useEffect(() => {
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        const store = useAppStore.getState();
        store.fetchJournals();
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session?.user) {
            store.stopRealtimeSubscription();
            store.startRealtimeSubscription();
          }
        });
      }
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, []);

  return null;
}
