import { getPendingJournals, syncToSupabase } from './db';

let syncing = false;

/**
 * Trigger a sync of pending journals.
 * Called by the journal store's online handler.
 */
export async function syncPending() {
  if (syncing) return;
  syncing = true;

  try {
    const pending = await getPendingJournals();
    if (pending.length === 0) return;

    await syncToSupabase(pending);
  } catch (err) {
    console.error('[SyncManager] Sync failed, journals remain pending:', err);
  } finally {
    syncing = false;
  }
}

export function getSyncingStatus() {
  return { syncing, isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true };
}
