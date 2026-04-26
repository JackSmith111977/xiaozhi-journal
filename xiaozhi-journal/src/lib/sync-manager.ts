import { getPendingJournals, updateJournal } from './db';
import { useAppStore } from '@/store';

let syncing = false;

/**
 * Sync pending journals to Supabase only (no AI callback).
 * Used for data sync without triggering AI responses.
 */
export async function syncPending() {
  if (syncing) return;
  syncing = true;

  try {
    const pending = await getPendingJournals();
    if (pending.length === 0) return;

    // Import syncToSupabase dynamically to avoid circular dependency
    const { syncToSupabase } = await import('./db');
    await syncToSupabase(pending);
  } catch (err) {
    console.error('[SyncManager] Sync failed, journals remain pending:', err);
  } finally {
    syncing = false;
  }
}

/**
 * Sync pending journals and call AI for each.
 * Called when network recovers (online event).
 * Reports progress via callbacks.
 */
export async function syncPendingWithAI(
  onProgress?: (total: number, done: number) => void,
  onComplete?: () => void
) {
  if (syncing) return;
  syncing = true;

  try {
    const pending = await getPendingJournals();
    if (pending.length === 0) {
      syncing = false;
      onComplete?.();
      return;
    }

    // Sort by timestamp (old → new)
    pending.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const total = pending.length;
    let done = 0;

    for (const journal of pending) {
      try {
        // 30 秒超时控制
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        const res = await fetch('/api/journal', {
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

        if (!res.ok) {
          console.warn(`[SyncManager] AI call failed for journal ${journal.id}: ${res.status}`);
          continue;
        }

        let data;
        try {
          data = await res.json();
        } catch (parseErr) {
          console.warn(`[SyncManager] JSON parse error for journal ${journal.id}:`, parseErr);
          continue;
        }

        if (data?.response) {
          const updated = {
            ...journal,
            aiResponse: data.response,
            goldenQuote: data.goldenQuote,
            moodLabel: data.moodLabel,
            status: 'ai_done' as const,
          };
          await updateJournal(updated);
          // Notify store update
          useAppStore.getState().updateAIResponse(journal.id, data);
          done++;
          onProgress?.(total, done);
        } else {
          console.warn(`[SyncManager] No AI response for journal ${journal.id}`);
        }
      } catch (err) {
        console.warn(`[SyncManager] Error processing journal ${journal.id}:`, err);
        // Keep pending, continue to next
      }
    }

    syncing = false;
    onComplete?.();
  } catch (err) {
    console.error('[SyncManager] syncPendingWithAI failed:', err);
    syncing = false;
  }
}

export function getSyncingStatus() {
  return { syncing, isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true };
}
