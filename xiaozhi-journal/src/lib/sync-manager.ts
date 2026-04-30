// Sync manager — handles offline journal sync with AI

import { getPendingJournals, updateJournal } from './db';
import { useAppStore } from '@/store';
import type { Journal, AIResponse } from '@/types';

let syncing = false;

const AI_TIMEOUT_MS = 30_000;

export interface SyncProgress {
  status: 'idle' | 'syncing' | 'complete' | 'error';
  total: number;
  done: number;
  currentId?: string;
  error?: string;
}

export async function syncPendingWithAI(
  onProgress?: (total: number, done: number) => void,
  onComplete?: () => void
): Promise<void> {
  if (syncing) {
    console.log('[sync] already syncing, skipping');
    return;
  }
  syncing = true;

  try {
    const pending = await getPendingJournals();
    if (pending.length === 0) {
      console.log('[sync] no pending journals');
      syncing = false;
      onComplete?.();
      return;
    }

    // Sort oldest first (by timestamp ascending)
    const sorted = [...pending].sort(
      (a, b) => a.timestamp.localeCompare(b.timestamp)
    );

    const total = sorted.length;
    let done = 0;

    for (const journal of sorted) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

        const response = await fetch('/api/journal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: journal.id,
            content: journal.content,
            mood: journal.mood,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`POST /api/journal returned ${response.status}`);
        }

        const aiResult: AIResponse = await response.json();

        // Update journal in IndexedDB
        const updated: Journal = {
          ...journal,
          aiResponse: aiResult.response,
          goldenQuote: aiResult.goldenQuote,
          moodLabel: aiResult.moodLabel,
          status: 'ai_done',
        };
        await updateJournal(updated);

        // Notify the store
        useAppStore.getState().updateAIResponse(journal.id, aiResult);

        done++;
        onProgress?.(total, done);
      } catch (err) {
        console.warn(
          `[sync] failed for journal ${journal.id}:`,
          err instanceof Error ? err.message : err
        );
        // Keep journal as pending, continue to next
      }
    }

    syncing = false;
    onComplete?.();
  } catch (err) {
    console.error('[sync] unexpected error:', err);
    syncing = false;
    onComplete?.();
  }
}
