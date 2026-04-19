import { supabase } from './supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Journal } from '@/types';

let channel: RealtimeChannel | null = null;

/**
 * Subscribe to journals table changes (INSERT, UPDATE, DELETE).
 * Returns an unsubscribe function. Calling subscribe again while
 * a subscription is active will first unsubscribe the old one.
 */
export function subscribeJournals(onChange: (event: 'INSERT' | 'UPDATE' | 'DELETE', journal: Journal) => void) {
  // Unsubscribe existing channel to prevent duplicates
  if (channel) {
    supabase.removeChannel(channel);
    channel = null;
  }

  channel = supabase
    .channel('journals-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'journals' },
      (payload) => {
        const eventType = payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE';
        const raw = eventType === 'DELETE' ? payload.old : payload.new;
        const journal = mapPayloadToJournal(raw, eventType);
        onChange(eventType, journal);
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('[Realtime] journals subscription active');
      } else if (status === 'CHANNEL_ERROR') {
        console.error('[Realtime] journals subscription failed, will retry on next auth change');
      }
    });

  return unsubscribeJournals;
}

export function unsubscribeJournals() {
  if (channel) {
    supabase.removeChannel(channel);
    channel = null;
  }
}

// Map Supabase DB status to TypeScript Journal status
const statusMap: Record<string, Journal['status']> = {
  draft: 'pending',
  published: 'ai_done',
  archived: 'ai_done',
};

function mapPayloadToJournal(raw: Record<string, unknown> | undefined, _event: string): Journal {
  if (!raw) {
    return {
      id: '',
      content: '',
      mood: 3 as Journal['mood'],
      moodEmoji: '',
      aiResponse: null,
      goldenQuote: null,
      moodLabel: null,
      timestamp: new Date().toISOString(),
      status: 'pending' as const,
      shareCount: 0,
    };
  }

  const dbStatus = (raw.status as string) || 'draft';

  return {
    id: raw.id as string,
    content: (raw.content as string) || '',
    mood: ((raw.mood as number) || 3) as Journal['mood'],
    moodEmoji: (raw.mood_emoji as string) || '',
    aiResponse: (raw.ai_response as string) || null,
    goldenQuote: (raw.golden_quote as string) || null,
    moodLabel: (raw.mood_label as string) || null,
    timestamp: (raw.created_at as string) || new Date().toISOString(),
    status: statusMap[dbStatus] ?? 'pending',
    shareCount: 0,
  };
}
