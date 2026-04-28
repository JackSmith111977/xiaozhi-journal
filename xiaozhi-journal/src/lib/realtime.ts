import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import type { Journal } from '@/types';

let channel: RealtimeChannel | null = null;

type ChangeCallback = (event: 'INSERT' | 'UPDATE' | 'DELETE', journal: Journal) => void;

export function subscribeJournals(callback: ChangeCallback) {
  if (channel) return;

  channel = supabase
    .channel('journals')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'journals' },
      (payload) => {
        const eventType = payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE';
        const journal = payload.new as Journal | undefined ?? (payload.old as Journal);
        if (journal) {
          callback(eventType, journal);
        }
      }
    )
    .subscribe();
}

export function unsubscribeJournals() {
  if (channel) {
    supabase.removeChannel(channel);
    channel = null;
  }
}
