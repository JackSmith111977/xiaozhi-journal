// Sync manager stub - provides stub for store sync functionality

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
  // Stub - no actual sync logic
  console.log('syncPendingWithAI stub called');

  // Simulate progress
  const total = 5;
  if (onProgress) {
    for (let i = 0; i < total; i++) {
      onProgress(total, i + 1);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  if (onComplete) {
    onComplete();
  }
}