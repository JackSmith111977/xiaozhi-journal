import { getPendingJournals, syncToSupabase } from './db';

let syncing = false;
let isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

/**
 * Start listening for online/offline events.
 * When going online, automatically sync pending journals.
 */
export function initSyncManager() {
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  // If already online on init, trigger a sync
  if (isOnline) {
    syncPending();
  }
}

export function stopSyncManager() {
  window.removeEventListener('online', handleOnline);
  window.removeEventListener('offline', handleOffline);
}

export function getSyncingStatus() {
  return { syncing, isOnline };
}

function handleOnline() {
  isOnline = true;
  console.log('[SyncManager] Back online, syncing pending journals...');
  syncPending();
}

function handleOffline() {
  isOnline = false;
  console.log('[SyncManager] Went offline, will sync when back online');
}

async function syncPending() {
  if (syncing || !isOnline) return;
  syncing = true;

  try {
    const pending = await getPendingJournals();
    if (pending.length === 0) return;

    console.log(`[SyncManager] Syncing ${pending.length} pending journal(s)...`);
    await syncToSupabase(pending);
    console.log('[SyncManager] Sync complete');
  } catch (err) {
    console.error('[SyncManager] Sync failed, journals remain pending:', err);
  } finally {
    syncing = false;
  }
}
